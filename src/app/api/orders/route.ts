import { SIZES, isClosed } from "@/config/store";
import { getProduct } from "@/lib/products";
import { cleanName, cleanUtr, normalizeMobile } from "@/lib/validate";

const MAX_BYTES = 4 * 1024 * 1024; // Vercel allows ~4.5 MB request bodies

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

type ScriptReply = { ok?: boolean; error?: string; detail?: string; orderCode?: string };

export async function POST(request: Request) {
  const scriptUrl = process.env.SHEETS_WEBHOOK_URL;
  const secret = process.env.SHEETS_SECRET;
  if (!scriptUrl || !secret) return fail("Ordering is not set up yet. Please try again later.", 503);

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

  // Hand the order to the Google Apps Script, which writes the sheet row and saves the screenshot to Drive.
  let reply: ScriptReply | null = null;
  try {
    const res = await fetch(scriptUrl, {
      method: "POST",
      // text/plain keeps this a "simple" request; Apps Script reads the raw body
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({
        secret,
        productId: product.id,
        productName: product.name,
        size,
        amount: product.price, // price comes from the server, never from the browser
        name,
        mobile,
        utr: utr || "",
        proof: { base64: Buffer.from(bytes).toString("base64"), mimeType: image.type, ext: image.ext },
      }),
      redirect: "follow",
      signal: AbortSignal.timeout(25_000),
    });
    const text = await res.text();
    try {
      reply = JSON.parse(text) as ScriptReply;
    } catch {
      console.error("Apps Script did not return JSON. Check the deployment: Execute as Me, access Anyone, and the URL ends in /exec.", "HTTP", res.status, "from", res.url.split("?")[0], text.slice(0, 120).replace(/\s+/g, " "));
    }
  } catch (error) {
    console.error("Apps Script request failed", error instanceof Error ? error.message : error);
  }

  if (reply?.ok && reply.orderCode) return Response.json({ ok: true, orderCode: reply.orderCode });
  if (reply?.error === "rate") return fail("Too many orders from this number. Please wait a few minutes.", 429);
  if (reply?.error) console.error("Apps Script refused the order:", reply.error, reply.detail ?? "");
  return fail("Could not save your order. Please try again.", 502);
}
