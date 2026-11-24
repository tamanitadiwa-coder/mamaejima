import type { Product } from "./types";

export function isInStock(p: Product): boolean {
  if (!p.available) return false;
  if (p.variants.length) return p.variants.some((v) => v.stock > 0);
  return p.stock > 0;
}

export function fromPrice(p: Product): { cents: number; from: boolean } {
  if (!p.variants.length) return { cents: p.priceCents, from: false };
  const prices = p.variants.map((v) => v.priceCents);
  const min = Math.min(...prices);
  return { cents: min, from: new Set(prices).size > 1 };
}

export function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}
