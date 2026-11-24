"use client";
import type { BasketItem } from "./types";

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
  snapshots: (Omit<BasketItem, "quantity"> | null)[];
  checkedAt: string;
}

export async function validateBasket(items: BasketItem[]): Promise<ValidationResult> {
  const res = await fetch("/api/basket/validate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      items: items.map((i) => ({ productId: i.productId, variantId: i.variantId, quantity: i.quantity })),
    }),
    cache: "no-store",
  });
  if (!res.ok) throw new Error("validate_failed");
  return res.json();
}

/** Orders placed from this device (public view only), newest first. */
const ORDERS_KEY = "me.orders.v1";
export interface StoredOrderRef {
  id: string;
  reference: string;
  createdAt: string;
}
export function rememberOrder(o: StoredOrderRef) {
  try {
    const list: StoredOrderRef[] = JSON.parse(localStorage.getItem(ORDERS_KEY) || "[]");
    const next = [o, ...list.filter((x) => x.id !== o.id)].slice(0, 10);
    localStorage.setItem(ORDERS_KEY, JSON.stringify(next));
  } catch {}
}
export function recentOrders(): StoredOrderRef[] {
  try {
    return JSON.parse(localStorage.getItem(ORDERS_KEY) || "[]");
  } catch {
    return [];
  }
}
