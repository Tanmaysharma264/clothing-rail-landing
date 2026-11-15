import { createClient } from "@supabase/supabase-js";
import { PROOF_BUCKET, SIZES, isClosed } from "@/config/store";
import { getProduct } from "@/lib/products";
import { cleanName, cleanUtr, normalizeMobile } from "@/lib/validate";

const MAX_BYTES = 4 * 1024 * 1024; // Vercel allows ~4.5 MB request bodies
const RATE_LIMIT = 3; // orders per mobile number per 10 minutes

function fail(message: string, status: number) {
  return Response.json({ ok: false, error: message }, { status });
}

/** Detects the real image type from the first bytes, so a renamed file is rejected. */
function sniffImage(bytes: Uint8Array): { ext: string; type: string } | null {
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return { ext: "jpg", type: "image/jpeg" };
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) return { ext: "png", type: "image/png" };
  const riff = String.fromCharCode(...bytes.slice(0, 4));
  const webp = String.fromCharCode(...bytes.slice(8, 12));
  if (riff === "RIFF" && webp === "WEBP") return { ext: "webp", type: "image/webp" };
  return null;
}

export async function POST(request: Request) {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return fail("Ordering is not set up yet. Please try again later.", 503);

  if (isClosed()) return fail("Orders are closed.", 403);

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return fail("Could not read the form. Please try again.", 400);
  }

  // Hidden field that real people never fill in: silently accept and drop bot submissions.
  if (String(form.get("website") ?? "") !== "") return Response.json({ ok: true, orderCode: "CC-0000" });

  const product = getProduct(String(form.get("product") ?? ""));
  if (!product) return fail("That product is not available.", 400);

  const size = String(form.get("size") ?? "");
  if (!(SIZES as readonly string[]).includes(size)) return fail("Please pick a size.", 400);

  const name = cleanName(String(form.get("name") ?? ""));
  if (!name) return fail("Please enter your name.", 400);

  const mobile = normalizeMobile(String(form.get("mobile") ?? ""));
  if (!mobile) return fail("Please enter a valid 10-digit mobile number.", 400);

  const utr = cleanUtr(String(form.get("utr") ?? ""));
  if (utr === null) return fail("That transaction ID doesn't look right. Leave it empty if you're unsure.", 400);

  const proof = form.get("proof");
  if (!(proof instanceof File) || proof.size === 0) return fail("Please upload your payment screenshot.", 400);
  if (proof.size > MAX_BYTES) return fail("The screenshot is too large. Please upload a smaller image.", 413);
  const bytes = new Uint8Array(await proof.arrayBuffer());
  const image = sniffImage(bytes);
  if (!image) return fail("The screenshot must be a JPG, PNG or WebP image.", 415);

  const db = createClient(url, key, { auth: { persistSession: false } });

  // Slow down repeat submissions from the same number.
  const since = new Date(Date.now() - 10 * 60 * 1000).toISOString();
  const recent = await db.from("orders").select("id", { count: "exact", head: true }).eq("mobile", mobile).gte("created_at", since);
  if (!recent.error && (recent.count ?? 0) >= RATE_LIMIT) return fail("Too many orders from this number. Please wait a few minutes.", 429);

  const path = `${new Date().toISOString().slice(0, 7)}/${crypto.randomUUID()}.${image.ext}`;
  const upload = await db.storage.from(PROOF_BUCKET).upload(path, bytes, { contentType: image.type, upsert: false });
  if (upload.error) {
    console.error("proof upload failed", upload.error.message);
    return fail("Could not save your screenshot. Please try again.", 500);
  }
  const proofUrl = db.storage.from(PROOF_BUCKET).getPublicUrl(path).data.publicUrl;

  const insert = await db
    .from("orders")
    .insert({
      status: "pending",
      product_id: product.id,
      product_name: product.name,
      size,
      amount: product.price, // price comes from the server, never from the browser
      customer_name: name,
      mobile,
      utr: utr || null,
      proof_url: proofUrl,
    })
    .select("order_no")
    .single();

  if (insert.error || !insert.data) {
    console.error("order insert failed", insert.error?.message);
    await db.storage.from(PROOF_BUCKET).remove([path]); // don't leave an orphan screenshot behind
    return fail("Could not save your order. Please try again.", 500);
  }

  return Response.json({ ok: true, orderCode: `CC-${String(insert.data.order_no).padStart(4, "0")}` });
}
