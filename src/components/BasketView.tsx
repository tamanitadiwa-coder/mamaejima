"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { DeliverySettings } from "@/lib/types";
import { formatZAR } from "@/lib/money";
import { deliveryFeeFor } from "@/lib/delivery";
import { useBasket } from "./BasketProvider";
import { useOnline } from "./useOnline";
import { validateBasket, type ValidationResult } from "@/lib/client-api";
import { productHref } from "@/lib/product";
import { asset } from "@/lib/paths";

export function BasketView({ delivery }: { delivery: DeliverySettings }) {
  const b = useBasket();
  const online = useOnline();
  const [check, setCheck] = useState<ValidationResult | null>(null);
  const [checking, setChecking] = useState(false);
  const [checkFailed, setCheckFailed] = useState(false);

  // Re-check prices and stock with the server whenever the basket changes.
  const key = b.items.map((i) => `${i.productId}:${i.variantId}:${i.quantity}`).join("|");
  useEffect(() => {
    if (!b.ready || !online || b.items.length === 0) return;
    let cancel = false;
    setChecking(true);
    const t = setTimeout(async () => {
      try {
        const r = await validateBasket(b.items);
        if (cancel) return;
        setCheck(r);
        setCheckFailed(false);
        const fresh = r.snapshots.filter(Boolean) as NonNullable<(typeof r.snapshots)[number]>[];
        const changed = fresh.filter((s) => {
          const cur = b.items.find((i) => i.productId === s.productId && i.variantId === s.variantId);
          return cur && (cur.priceCents !== s.priceCents || cur.name !== s.name || cur.variantName !== s.variantName);
        });
        if (changed.length)
          b.refresh(changed.map((c) => ({ productId: c.productId, variantId: c.variantId, name: c.name, variantName: c.variantName, priceCents: c.priceCents, slug: c.slug })));
      } catch {
        if (!cancel) setCheckFailed(true);
      } finally {
        if (!cancel) setChecking(false);
      }
    }, 250);
    return () => {
      cancel = true;
      clearTimeout(t);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, b.ready, online]);

  if (!b.ready) return <div className="wrap" style={{ minHeight: "50vh" }} />;

  if (b.items.length === 0) {
    return (
      <div className="wrap empty">
        <p className="eyebrow">Basket</p>
        <h1>Your basket is empty</h1>
        <p className="muted">Add something you’ve been missing.</p>
        <Link href="/shop/" className="btn">
          Start shopping
        </Link>
      </div>
    );
  }

  const fresh = check && online;
  const issueFor = (pid: string, vid: string | null) =>
    check?.issues.find((x) => x.productId === pid && x.variantId === vid);
  const subtotal = fresh ? check!.subtotalCents : b.subtotalCents;
  const fee = fresh ? check!.deliveryFeeCents : deliveryFeeFor(b.subtotalCents, delivery);
  const blocking = (check?.issues.length ?? 0) > 0;

  return (
    <div className="wrap">
      <div className="page-head" style={{ marginBottom: 8 }}>
        <p className="eyebrow">Basket</p>
        <h1 style={{ marginTop: 10 }}>Your basket</h1>
      </div>
      <div className="basket-grid">
        <div>
          {b.items.map((it) => {
            const issue = issueFor(it.productId, it.variantId);
            const line = check?.lines.find((l) => l.productId === it.productId && l.variantId === it.variantId);
            const max = line ? Math.min(50, line.available) : issue?.availableQty ?? 50;
            return (
              <div className="line" key={`${it.productId}:${it.variantId}`}>
                <Link href={productHref(it.slug)} className="line-img">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={asset(it.image ?? "/placeholders/product-1.svg")} alt="" loading="lazy" />
                </Link>
                <div className="line-body">
                  <div className="line-top">
                    <div>
                      <Link href={productHref(it.slug)} className="line-name">
                        {it.name}
                      </Link>
                      {it.variantName && <p className="small muted">{it.variantName}</p>}
                      <p className="small muted num">{formatZAR(it.priceCents)} each</p>
                    </div>
                    <p className="price">{formatZAR(it.priceCents * it.quantity)}</p>
                  </div>
                  {issue && (
                    <p className="error" role="alert">
                      {issue.message}
                      {issue.kind === "insufficient_stock" && (issue.availableQty ?? 0) > 0 && (
                        <>
                          {" "}
                          <button
                            className="link"
                            onClick={() => b.setQty(it.productId, it.variantId, issue.availableQty!)}
                          >
                            Change to {issue.availableQty}
                          </button>
                        </>
                      )}
                    </p>
                  )}
                  <div className="line-actions">
                    <div className="qty sm" role="group" aria-label={`Quantity of ${it.name}`}>
                      <button
                        aria-label="Decrease"
                        onClick={() => b.setQty(it.productId, it.variantId, it.quantity - 1)}
                        disabled={it.quantity <= 1}
                      >
                        −
                      </button>
                      <output>{it.quantity}</output>
                      <button
                        aria-label="Increase"
                        onClick={() => b.setQty(it.productId, it.variantId, it.quantity + 1)}
                        disabled={it.quantity >= max}
                      >
                        +
                      </button>
                    </div>
                    <button className="link small muted" onClick={() => b.remove(it.productId, it.variantId)}>
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
          <p style={{ marginTop: 24 }}>
            <Link href="/shop/" className="link small">
              Continue shopping
            </Link>
          </p>
        </div>

        <aside className="summary" aria-label="Order summary">
          <h2 style={{ fontSize: 28, marginBottom: 16 }}>Summary</h2>
          <div className="sum-row">
            <span>Subtotal</span>
            <span className="num">{formatZAR(subtotal)}</span>
          </div>
          <div className="sum-row">
            <span>Delivery</span>
            <span className="num">{fee === 0 ? "Free" : formatZAR(fee)}</span>
          </div>
          <div className="sum-row sum-total">
            <span>Total</span>
            <span className="num">{formatZAR(subtotal + fee)}</span>
          </div>
          <p className="hint" style={{ marginBottom: 20 }}>
            {!online
              ? "You’re offline. Prices and stock will be checked again when you reconnect."
              : checking
                ? "Checking latest prices and stock…"
                : checkFailed
                  ? "We couldn’t check prices just now. They’ll be checked again before you order."
                  : "Prices and stock checked just now. Delivery is on Mondays."}
          </p>
          {blocking ? (
            <p className="notice notice-danger small" style={{ marginBottom: 12 }}>
              Please fix the items marked above to continue.
            </p>
          ) : null}
          <Link
            href="/checkout/"
            className="btn btn-block"
            aria-disabled={blocking}
            onClick={(e) => blocking && e.preventDefault()}
          >
            Checkout
          </Link>
        </aside>
      </div>
    </div>
  );
}
