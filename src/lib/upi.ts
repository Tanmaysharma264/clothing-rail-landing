/**
 * Builds a UPI payment link. On a phone it opens the UPI app chooser with the payee
 * and amount already filled in. The same string is used for the QR code.
 */
export function upiLink({ id, name, amount, note }: { id: string; name: string; amount: number; note: string }) {
  const parts = [
    ["pa", id],
    ["pn", name],
    ["am", amount.toFixed(2)],
    ["cu", "INR"],
    ["tn", note.slice(0, 40)],
  ];
  // UPI apps expect %20 for spaces, so do not use URLSearchParams (it writes "+").
  return "upi://pay?" + parts.map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join("&");
}
