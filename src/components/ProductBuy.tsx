"use client";

import { useState } from "react";
import type { Product } from "@/lib/types";
import { formatZAR } from "@/lib/money";
import { useBasket } from "./BasketProvider";
import { productImages } from "@/lib/product";

export function ProductBuy({ product }: { product: Product }) {
  const { add, items, showToast } = useBasket();
  const hasVariants = product.variants.length > 0;
  const firstInStock = product.variants.find((v) => v.stock > 0) ?? null;
  const [variantId, setVariantId] = useState<string | null>(hasVariants ? firstInStock?.id ?? null : null);
  const [qty, setQty] = useState(1);

  const variant = hasVariants ? product.variants.find((v) => v.id === variantId) ?? null : null;
  const price = variant ? variant.priceCents : product.priceCents;
  const stock = hasVariants ? variant?.stock ?? 0 : product.stock;
  const inBasket =
    items.find((x) => x.productId === product.id && (x.variantId ?? null) === (variantId ?? null))?.quantity ?? 0;
  const maxQty = Math.max(0, Math.min(50, stock - inBasket));
  const canBuy = product.available && stock > 0 && (!hasVariants || !!variant) && maxQty > 0;

  let status: string;
  if (!product.available) status = "Currently unavailable";
  else if (stock <= 0) status = "Sold out";
  else if (stock <= 5) status = `Only ${stock} left`;
  else status = "In stock";

  const onAdd = () => {
    if (!canBuy) return;
    const q = Math.min(qty, maxQty);
    add(
      {
        productId: product.id,
        variantId: variant?.id ?? null,
        name: product.name,
        variantName: variant?.name ?? null,
        priceCents: price,
        image: productImages(product)[0] ?? null,
        slug: product.slug,
      },
      q,
    );
    setQty(1);
    showToast(`Added ${q} × ${product.name}${variant ? ` (${variant.name})` : ""}`);
  };

  return (
    <div className="stack" style={{ ["--s" as string]: "20px" }}>
      <div className="row between" style={{ alignItems: "baseline" }}>
        <p className="price" style={{ fontSize: 22 }}>
          {formatZAR(price)}
        </p>
        <p className="small" style={{ color: stock > 0 && product.available ? "var(--muted)" : "var(--danger)" }}>
          {status}
        </p>
      </div>

      {hasVariants && (
        <fieldset style={{ border: 0, padding: 0, margin: 0 }}>
          <legend className="label">Option</legend>
          <div className="variant-list">
            {product.variants.map((v) => (
              <button
                key={v.id}
                type="button"
                className="variant"
                aria-pressed={v.id === variantId}
                disabled={v.stock <= 0}
                onClick={() => {
                  setVariantId(v.id);
                  setQty(1);
                }}
              >
                {v.name}
              </button>
            ))}
          </div>
        </fieldset>
      )}

      <div className="sticky-buy">
        <div className="buy-row">
          <div className="qty" role="group" aria-label="Quantity">
            <button type="button" aria-label="Decrease" disabled={qty <= 1} onClick={() => setQty((q) => q - 1)}>
              −
            </button>
            <output aria-live="polite">{qty}</output>
            <button
              type="button"
              aria-label="Increase"
              disabled={qty >= maxQty}
              onClick={() => setQty((q) => q + 1)}
            >
              +
            </button>
          </div>
          <button className="btn grow" disabled={!canBuy} onClick={onAdd}>
            {!product.available || stock <= 0 ? status : maxQty <= 0 ? "All in your basket" : "Add to basket"}
          </button>
        </div>
      </div>
      {inBasket > 0 && (
        <p className="small muted">
          {inBasket} already in your basket.
        </p>
      )}
    </div>
  );
}
