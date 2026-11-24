const fmt = new Intl.NumberFormat("en-ZA", {
  style: "currency",
  currency: "ZAR",
  minimumFractionDigits: 2,
});

/** Format integer cents as ZAR, e.g. 12950 → "R 129,50" (en-ZA style). */
export function formatZAR(cents: number): string {
  return fmt.format(cents / 100).replace(/ /g, " ");
}

/** Plain-text price for WhatsApp messages: "R129.50". */
export function plainZAR(cents: number): string {
  return `R${(cents / 100).toFixed(2)}`;
}

/** Parse a user-typed rand amount ("129.50", "129,50", "R129") to cents. */
export function parseRandToCents(input: string): number | null {
  const cleaned = input.replace(/[Rr\s]/g, "").replace(",", ".");
  if (!/^\d+(\.\d{1,2})?$/.test(cleaned)) return null;
  return Math.round(parseFloat(cleaned) * 100);
}
