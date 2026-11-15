// Store-wide settings shared by the page, the order panel and the order API.

/** Orders close at the end of 20 November 2026 (India time, IST). */
export const DEADLINE = "2026-11-20T23:59:59+05:30";

/** Price in rupees per product type. */
export const PRICES = { tee: 599, hoodie: 799 } as const;

export const SIZES = ["S", "M", "L", "XL", "XXL"] as const;
export type Size = (typeof SIZES)[number];

export function formatINR(amount: number) {
  return `₹${amount.toLocaleString("en-IN")}`;
}

export function isClosed(now = Date.now()) {
  return now > new Date(DEADLINE).getTime();
}
