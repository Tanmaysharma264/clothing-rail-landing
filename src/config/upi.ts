// The UPI ID that customers pay. It is public (it appears on the page and in the QR code).
// Verified against the shop's GPay QR code. To change it later, edit the default below,
// or set NEXT_PUBLIC_UPI_ID / NEXT_PUBLIC_UPI_NAME in Vercel (they take priority).
// These values are baked in at build time, so redeploy after changing them.
export const UPI_ID = (process.env.NEXT_PUBLIC_UPI_ID ?? "tanmaysharma.04.12.04@okaxis").trim();
export const UPI_NAME = (process.env.NEXT_PUBLIC_UPI_NAME ?? "Tanmay Sharma").trim();
