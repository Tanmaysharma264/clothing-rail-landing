"use client";

import * as React from "react";
import type { RailGarment } from "@/components/ui/product-rail-gallery";
import { PRICES, SIZES, formatINR, isClosed, type Size } from "@/config/store";
import { UPI_ID, UPI_NAME } from "@/config/upi";
import { upiLink } from "@/lib/upi";
import { compressImage } from "@/lib/compress-image";
import { cleanName, cleanUtr, normalizeMobile } from "@/lib/validate";

const DRAFT_KEY = "cc-order-draft";

type Draft = { name: string; mobile: string; utr: string; sizes: Record<string, string> };

function loadDraft(): Draft {
  try {
    const raw = JSON.parse(localStorage.getItem(DRAFT_KEY) ?? "{}");
    return { name: raw.name ?? "", mobile: raw.mobile ?? "", utr: raw.utr ?? "", sizes: raw.sizes ?? {} };
  } catch {
    return { name: "", mobile: "", utr: "", sizes: {} };
  }
}

function saveDraft(draft: Draft) {
  try {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
  } catch {
    /* private mode: the form still works, it just won't be remembered */
  }
}

const field =
  "w-full rounded-lg border border-border bg-background/80 px-3 py-2.5 text-sm text-foreground outline-none placeholder:text-muted-foreground/70 focus-visible:ring-2 focus-visible:ring-ring";

function Step({ n, title }: { n: number; title: string }) {
  return (
    <p className="flex items-center gap-2 text-sm font-medium">
      <span className="grid size-5 shrink-0 place-items-center rounded-full bg-foreground text-[11px] text-background">{n}</span>
      {title}
    </p>
  );
}

export function OrderPanel({ item }: { item: RailGarment }) {
  const id = React.useId();
  const kind = item.kind === "hoodie" ? "hoodie" : "tee";
  const amount = PRICES[kind];

  const [open, setOpen] = React.useState(false);
  const [size, setSize] = React.useState("" as Size | "");
  const [name, setName] = React.useState("");
  const [mobile, setMobile] = React.useState("");
  const [utr, setUtr] = React.useState("");
  const [proof, setProof] = React.useState(null as Blob | null);
  const [proofName, setProofName] = React.useState("");
  const [preview, setPreview] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState("");
  const [orderCode, setOrderCode] = React.useState("");
  const [qr, setQr] = React.useState("");
  const [copied, setCopied] = React.useState(false);
  const [phone, setPhone] = React.useState(false);
  const [closed, setClosed] = React.useState(false);
  const [website, setWebsite] = React.useState(""); // honeypot
  const [restored, setRestored] = React.useState(false);

  // Restore what the visitor already typed (a UPI app switch can reload the page).
  React.useEffect(() => {
    const draft = loadDraft();
    setName(draft.name);
    setMobile(draft.mobile);
    setUtr(draft.utr);
    const saved = draft.sizes[item.id];
    if ((SIZES as readonly string[]).includes(saved)) setSize(saved as Size);
    setPhone(/Android|iPhone|iPad|iPod/i.test(navigator.userAgent));
    setClosed(isClosed());
    setRestored(true);
  }, [item.id]);

  React.useEffect(() => {
    if (!restored) return; // don't overwrite the saved draft with blanks before it has been restored
    const draft = loadDraft();
    saveDraft({ ...draft, name, mobile, utr, sizes: { ...draft.sizes, ...(size ? { [item.id]: size } : {}) } });
  }, [restored, name, mobile, utr, size, item.id]);

  React.useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);

  const configured = UPI_ID !== "";
  const link = React.useMemo(
    () => (configured && size ? upiLink({ id: UPI_ID, name: UPI_NAME, amount, note: `Chillcom ${kind} ${size}` }) : ""),
    [configured, size, amount, kind],
  );

  React.useEffect(() => {
    let live = true;
    if (!link) { setQr(""); return; }
    import("qrcode")
      .then((QR) => QR.toDataURL(link, { width: 480, margin: 2, errorCorrectionLevel: "M" }))
      .then((url) => { if (live) setQr(url); })
      .catch(() => { if (live) setQr(""); });
    return () => { live = false; };
  }, [link]);

  async function copyUpi() {
    try {
      await navigator.clipboard.writeText(UPI_ID);
    } catch {
      const input = document.createElement("input");
      input.value = UPI_ID;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      input.remove();
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  async function pickFile(file: File | undefined) {
    setError("");
    if (!file) return;
    if (!file.type.startsWith("image/")) { setError("Please choose an image (a screenshot)."); return; }
    const blob = await compressImage(file);
    if (blob.size > 4 * 1024 * 1024) { setError("That image is too large. Please choose a smaller screenshot."); return; }
    setProof(blob);
    setProofName(file.name);
    setPreview(URL.createObjectURL(blob));
  }

  const validName = cleanName(name);
  const validMobile = normalizeMobile(mobile);
  const validUtr = cleanUtr(utr);
  const ready = !!size && !!validName && !!validMobile && validUtr !== null && !!proof && !busy && !closed;

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!ready || !proof) return;
    setBusy(true);
    setError("");
    try {
      const body = new FormData();
      body.set("product", item.id);
      body.set("size", size);
      body.set("name", name);
      body.set("mobile", mobile);
      body.set("utr", utr);
      body.set("website", website);
      body.set("proof", proof, "payment-proof.jpg");
      const res = await fetch("/api/orders", { method: "POST", body });
      const data = (await res.json().catch(() => null)) as { ok?: boolean; error?: string; orderCode?: string } | null;
      if (!res.ok || !data?.ok) {
        setError(data?.error ?? "Something went wrong. Please try again.");
        return;
      }
      setOrderCode(data.orderCode ?? "");
      saveDraft({ name: "", mobile: "", utr: "", sizes: {} });
    } catch {
      setError("Could not reach the store. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  // ---- order placed ----
  if (orderCode) {
    return (
      <div role="status" className="mt-2 rounded-2xl border border-border bg-card/70 p-5 text-left">
        <p className="font-[family-name:var(--font-display)] text-lg">Order placed</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Your order number is <span className="font-semibold text-foreground">{orderCode}</span>. We&apos;ll check your payment and message you on +91 {normalizeMobile(mobile) ?? mobile} to confirm.
        </p>
        <p className="mt-3 text-xs text-muted-foreground">
          {item.name} · Size {size} · {formatINR(amount)}
        </p>
      </div>
    );
  }

  return (
    <div className="mt-2 text-left">
      <div className="flex items-end justify-between gap-4 border-t border-border pt-4">
        <p className="text-3xl font-semibold tracking-tight">{formatINR(amount)}</p>
        {!open && (
          <button
            type="button"
            disabled={closed}
            onClick={() => setOpen(true)}
            className="rounded-full bg-foreground px-7 py-2.5 text-sm font-medium text-background outline-none transition-[transform,opacity] hover:-translate-y-px focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0 motion-reduce:transition-none"
          >
            {closed ? "Orders closed" : "Shop"}
          </button>
        )}
      </div>

      {open && (
        <form onSubmit={submit} noValidate className="mt-5 flex flex-col gap-6">
          {/* 1 · size */}
          <fieldset className="flex flex-col gap-3">
            <legend className="sr-only">Size</legend>
            <Step n={1} title="Pick your size" />
            <div role="radiogroup" aria-label="Size" className="flex flex-wrap gap-2">
              {SIZES.map((s) => (
                <button
                  key={s}
                  type="button"
                  role="radio"
                  aria-checked={size === s}
                  onClick={() => setSize(s)}
                  className={`h-10 min-w-12 rounded-lg border px-3 text-sm font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring ${size === s ? "border-foreground bg-foreground text-background" : "border-border text-foreground hover:border-foreground/60"}`}
                >
                  {s}
                </button>
              ))}
            </div>
          </fieldset>

          {/* 2 · pay */}
          <div className="flex flex-col gap-3">
            <Step n={2} title={`Pay ${formatINR(amount)}`} />
            {!configured ? (
              <p className="rounded-lg border border-border p-3 text-sm text-muted-foreground">Payments aren&apos;t set up yet. Please check back soon.</p>
            ) : !size ? (
              <p className="text-sm text-muted-foreground">Pick a size first, then pay.</p>
            ) : (
              <>
                {phone && (
                  <a
                    href={link}
                    className="inline-flex items-center justify-center rounded-full bg-[#ff0a8f] px-6 py-3 text-sm font-semibold text-white outline-none transition-[transform,opacity] hover:-translate-y-px focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background motion-reduce:transition-none"
                  >
                    Pay {formatINR(amount)} in your UPI app
                  </a>
                )}
                <div className="flex items-center gap-4 rounded-xl border border-border bg-card/60 p-3">
                  {qr ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={qr} alt={`UPI QR code to pay ${formatINR(amount)}`} width={112} height={112} className="size-28 shrink-0 rounded-md bg-white" />
                  ) : (
                    <div className="size-28 shrink-0 animate-pulse rounded-md bg-muted" />
                  )}
                  <div className="flex min-w-0 flex-col gap-2 text-sm">
                    <p className="text-muted-foreground">{phone ? "Or save this QR and scan it from your gallery in any UPI app." : "Scan with any UPI app on your phone."}</p>
                    {qr && (
                      <a href={qr} download={`chillcom-pay-${amount}.png`} className="w-fit rounded-full border border-border px-3 py-1 text-xs font-medium outline-none hover:border-foreground/60 focus-visible:ring-2 focus-visible:ring-ring">
                        Save QR
                      </a>
                    )}
                  </div>
                </div>
                <div className="flex items-center justify-between gap-3 rounded-lg border border-border px-3 py-2 text-sm">
                  <span className="min-w-0 truncate">
                    <span className="text-muted-foreground">UPI ID </span>
                    <span className="font-medium">{UPI_ID}</span>
                  </span>
                  <button type="button" onClick={copyUpi} className="shrink-0 rounded-full border border-border px-3 py-1 text-xs font-medium outline-none hover:border-foreground/60 focus-visible:ring-2 focus-visible:ring-ring">
                    {copied ? "Copied" : "Copy"}
                  </button>
                </div>
                <details className="group rounded-lg border border-border text-sm">
                  <summary className="cursor-pointer list-none rounded-lg px-3 py-2.5 font-medium outline-none focus-visible:ring-2 focus-visible:ring-ring [&::-webkit-details-marker]:hidden">
                    <span className="flex items-center justify-between gap-3">
                      Link or QR not working?
                      <svg aria-hidden="true" viewBox="0 0 16 16" className="size-3.5 shrink-0 transition-transform group-open:rotate-180" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6l5 5 5-5" /></svg>
                    </span>
                  </summary>
                  <div className="flex flex-col items-center gap-3 border-t border-border p-3">
                    <p className="text-center text-muted-foreground">
                      Scan this GPay QR (or save it and scan it from your gallery), then <span className="font-medium text-foreground">enter {formatINR(amount)}</span> yourself.
                    </p>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/payment/gpay-qr.png" alt={`Chillcom payment QR for ${UPI_ID}`} width={176} height={176} className="size-44 rounded-lg bg-white" />
                    <a href="/payment/gpay-qr.png" download="chillcom-payment-qr.png" className="rounded-full border border-border px-3 py-1 text-xs font-medium outline-none hover:border-foreground/60 focus-visible:ring-2 focus-visible:ring-ring">
                      Save QR
                    </a>
                  </div>
                </details>
                <p className="text-xs leading-relaxed text-muted-foreground">
                  The amount is {formatINR(amount)}. If your app lets you edit it, please keep it the same. After paying, come back here and finish step 3. If the page reloads, open this piece again and your details will still be here.
                </p>
              </>
            )}
          </div>

          {/* 3 · confirm */}
          <div className="flex flex-col gap-3">
            <Step n={3} title="Confirm your order" />

            <div className="flex flex-col gap-1.5">
              <label htmlFor={`${id}-name`} className="text-xs text-muted-foreground">Name</label>
              <input id={`${id}-name`} className={field} value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" maxLength={60} placeholder="Your full name" />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor={`${id}-mobile`} className="text-xs text-muted-foreground">Mobile number</label>
              <div className="flex">
                <span className="grid place-items-center rounded-l-lg border border-r-0 border-border bg-muted px-3 text-sm text-muted-foreground">+91</span>
                <input id={`${id}-mobile`} className={`${field} rounded-l-none`} value={mobile} onChange={(e) => setMobile(e.target.value)} type="tel" inputMode="tel" autoComplete="tel-national" maxLength={14} placeholder="10-digit number" />
              </div>
              {mobile !== "" && !validMobile && <p className="text-xs text-destructive">Enter a valid 10-digit mobile number.</p>}
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor={`${id}-utr`} className="text-xs text-muted-foreground">UTR / transaction ID <span className="opacity-70">(optional)</span></label>
              <input id={`${id}-utr`} className={field} value={utr} onChange={(e) => setUtr(e.target.value)} autoComplete="off" maxLength={30} placeholder="e.g. 412345678901" />
              {validUtr === null && <p className="text-xs text-destructive">That doesn&apos;t look right. You can leave it empty.</p>}
            </div>

            <div className="flex flex-col gap-1.5">
              <span className="text-xs text-muted-foreground">Payment screenshot</span>
              <label
                htmlFor={`${id}-proof`}
                className="flex cursor-pointer items-center gap-3 rounded-lg border border-dashed border-border p-3 text-sm transition-colors hover:border-foreground/60 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring"
              >
                {preview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={preview} alt="Your screenshot" className="size-14 shrink-0 rounded-md object-cover object-top" />
                ) : (
                  <span className="grid size-14 shrink-0 place-items-center rounded-md bg-muted text-muted-foreground">
                    <svg aria-hidden="true" viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M12 16V4m0 0L7 9m5-5l5 5M4 16v3a1 1 0 001 1h14a1 1 0 001-1v-3" /></svg>
                  </span>
                )}
                <span className="min-w-0">
                  <span className="block font-medium">{proof ? "Screenshot added" : "Upload screenshot"}</span>
                  <span className="block truncate text-xs text-muted-foreground">{proof ? proofName : "JPG or PNG from your UPI app"}</span>
                </span>
                <input id={`${id}-proof`} type="file" accept="image/*" className="sr-only" onChange={(e) => { void pickFile(e.target.files?.[0]); e.target.value = ""; }} />
              </label>
            </div>

            {/* honeypot: hidden from people, bots fill it in */}
            <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
              <label>Website<input tabIndex={-1} autoComplete="off" value={website} onChange={(e) => setWebsite(e.target.value)} /></label>
            </div>

            {error && <p role="alert" className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}

            <button
              type="submit"
              disabled={!ready}
              className="rounded-full bg-foreground px-6 py-3 text-sm font-medium text-background outline-none transition-[transform,opacity] hover:-translate-y-px focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0 motion-reduce:transition-none"
            >
              {busy ? "Placing order…" : `Place order · ${formatINR(amount)}`}
            </button>
            <p className="text-center text-xs text-muted-foreground">Your order stays pending until we verify the payment.</p>
          </div>
        </form>
      )}
    </div>
  );
}
