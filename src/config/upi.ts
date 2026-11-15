// Your UPI details. Set these in Vercel (Project → Settings → Environment Variables)
// and in a local .env.local file. See .env.example.
// NEXT_PUBLIC_ values are baked in at build time, so redeploy after changing them.
export const UPI_ID = (process.env.NEXT_PUBLIC_UPI_ID ?? "").trim();
export const UPI_NAME = (process.env.NEXT_PUBLIC_UPI_NAME ?? "Chillcom").trim();
