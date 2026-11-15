// Field checks used by both the order form (browser) and the order API (server).

/** Returns a 10-digit Indian mobile number, or null if it is not valid. */
export function normalizeMobile(input: string): string | null {
  let digits = input.replace(/[\s\-().]/g, "");
  if (digits.startsWith("+91")) digits = digits.slice(3);
  else if (digits.startsWith("91") && digits.length === 12) digits = digits.slice(2);
  else if (digits.startsWith("0") && digits.length === 11) digits = digits.slice(1);
  return /^[6-9]\d{9}$/.test(digits) ? digits : null;
}

export function cleanName(input: string): string | null {
  // Names end up in a spreadsheet, so drop leading characters that a sheet would read as a formula.
  const name = input.replace(/\s+/g, " ").replace(/^[=+\-@\s]+/, "").trim();
  return name.length >= 2 && name.length <= 60 ? name : null;
}

/** The UTR / transaction id is optional. Returns "" when empty, null when it looks wrong. */
export function cleanUtr(input: string): string | null {
  const utr = input.replace(/\s+/g, "").trim();
  if (utr === "") return "";
  return /^[A-Za-z0-9]{8,22}$/.test(utr) ? utr : null;
}
