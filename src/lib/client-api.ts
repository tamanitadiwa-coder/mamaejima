"use client";
import type { BasketItem } from "./types";
import { pb } from "./pb";

export interface ValidatedLine {
  productId: string;
  variantId: string | null;
  name: string;
  variantName: string | null;
  unitPriceCents: number;
  quantity: number;
  lineTotalCents: number;
  available: number;
}
export interface ValidationIssue {
  productId: string;
  variantId: string | null;
  kind: "missing" | "unavailable" | "insufficient_stock" | "invalid_quantity";
  message: string;
  availableQty?: number;
}
export interface ValidationResult {
  lines: ValidatedLine[];
  issues: ValidationIssue[];
  subtotalCents: number;
  deliveryFeeCents: number;
  totalCents: number;
  snapshots: ({ productId: string; variantId: string | null; name: string; variantName: string | null; priceCents: number; slug: string } | null)[];
  checkedAt: string;
}

/** Ask the server for current prices/stock. Nothing is reserved. */
export function validateBasket(items: BasketItem[]): Promise<ValidationResult> {
  return pb().send("/api/mama/basket/validate", {
    method: "POST",
    body: { items: items.map((i) => ({ productId: i.productId, variantId: i.variantId, quantity: i.quantity })) },
  });
}
