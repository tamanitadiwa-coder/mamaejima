"use client";

import Link from "next/link";
import { useBasket } from "@/components/BasketProvider";

// Stage 2: checkout requires a customer account (Stage 3–4).
export default function CheckoutPage() {
  const { count, ready } = useBasket();
  return (
    <div className="wrap empty">
      <p className="eyebrow">Checkout</p>
      <h1>Ordering opens soon</h1>
      <p className="muted" style={{ maxWidth: 440 }}>
        You’ll sign in to place your order, so your order history and basket are kept safe in your account.
        {ready && count > 0 ? " Your basket is saved on this device." : ""}
      </p>
      <Link href="/basket/" className="btn btn-outline">Back to basket</Link>
    </div>
  );
}
