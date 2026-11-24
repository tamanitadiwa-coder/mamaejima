"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import type { CustomerDetails, DeliveryAddress, DeliverySettings } from "@/lib/types";
import { formatZAR } from "@/lib/money";
import { deliveryFeeFor, describeCutoff, formatDeliveryDate, isDeliverableDate } from "@/lib/delivery";
import { hasErrors, validateAddress, validateCustomer, type FieldErrors } from "@/lib/validation";
import { rememberOrder, validateBasket, type ValidationResult } from "@/lib/client-api";
import { useBasket } from "./BasketProvider";
import { useOnline } from "./useOnline";
import { MondayPicker } from "./MondayPicker";

const KEY = "me.checkout.v1";
const STEPS = ["Details", "Address", "Delivery", "Review"] as const;

interface State {
  checkoutId: string;
  step: number;
  customer: CustomerDetails;
  address: DeliveryAddress;
  deliveryDate: string | null;
}

const blank = (): State => ({
  checkoutId: crypto.randomUUID(),
  step: 0,
  customer: { firstName: "", surname: "", phone: "", email: "" },
  address: { street: "", building: "", suburb: "", instructions: "" },
  deliveryDate: null,
});

export function Checkout({ delivery, whatsappReady }: { delivery: DeliverySettings; whatsappReady: boolean }) {
  const b = useBasket();
  const online = useOnline();
  const router = useRouter();
  const [s, setS] = useState<State | null>(null);
  const [ce, setCe] = useState<FieldErrors<CustomerDetails>>({});
  const [ae, setAe] = useState<FieldErrors<DeliveryAddress>>({});
  const [dateErr, setDateErr] = useState<string | null>(null);
  const [check, setCheck] = useState<ValidationResult | null>(null);
  const [checkErr, setCheckErr] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitErr, setSubmitErr] = useState<string | null>(null);
  const [agree, setAgree] = useState(false);
  const top = useRef<HTMLDivElement>(null);

  // Restore saved progress (persists through refresh/offline)
  useEffect(() => {
    let st = blank();
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) st = { ...st, ...JSON.parse(raw) };
    } catch {}
    // Drop a remembered date that's no longer open; never pick one for them.
    if (st.deliveryDate && !isDeliverableDate(st.deliveryDate, delivery)) st.deliveryDate = null;
    if (st.step === 3 && !st.deliveryDate) st.step = 2;
    setS(st);
  }, [delivery]);

  useEffect(() => {
    if (s)
      try {
        localStorage.setItem(KEY, JSON.stringify(s));
      } catch {}
  }, [s]);

  const step = s?.step ?? 0;
  const itemsKey = b.items.map((i) => `${i.productId}:${i.variantId}:${i.quantity}`).join("|");

  // Fresh server pricing on the review step
  useEffect(() => {
    if (step !== 3 || !online || b.items.length === 0) return;
    let cancel = false;
    setCheck(null);
    setCheckErr(false);
    validateBasket(b.items)
      .then((r) => !cancel && setCheck(r))
      .catch(() => !cancel && setCheckErr(true));
    return () => {
      cancel = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, online, itemsKey]);

  const subtotal = useMemo(() => b.subtotalCents, [b.subtotalCents]);

  if (!s || !b.ready) return <div className="wrap" style={{ minHeight: "60vh" }} />;

  if (b.items.length === 0) {
    return (
      <div className="wrap empty">
        <h1>Your basket is empty</h1>
        <p className="muted">Add a few things before checking out.</p>
        <Link href="/shop" className="btn">
          Shop
        </Link>
      </div>
    );
  }

  const go = (n: number) => {
    setS({ ...s, step: n });
    setSubmitErr(null);
    requestAnimationFrame(() => top.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
  };
  const setC = (k: keyof CustomerDetails, v: string) => {
    setS({ ...s, customer: { ...s.customer, [k]: v } });
    if (ce[k]) setCe({ ...ce, [k]: undefined });
  };
  const setA = (k: keyof DeliveryAddress, v: string) => {
    setS({ ...s, address: { ...s.address, [k]: v } });
    if (ae[k]) setAe({ ...ae, [k]: undefined });
  };

  const nextFromDetails = () => {
    const e = validateCustomer(s.customer);
    setCe(e);
    if (hasErrors(e)) return focusFirstError();
    go(1);
  };
  const nextFromAddress = () => {
    const e = validateAddress(s.address, delivery);
    setAe(e);
    if (hasErrors(e)) return focusFirstError();
    go(2);
  };
  const nextFromDelivery = () => {
    if (!s.deliveryDate) {
      setDateErr("Please choose a Monday for delivery.");
      return;
    }
    if (!isDeliverableDate(s.deliveryDate, delivery)) {
      setDateErr("That Monday is no longer available. Please choose another.");
      setS({ ...s, deliveryDate: null });
      return;
    }
    go(3);
  };

  const placeOrder = async () => {
    setSubmitErr(null);
    if (!online) {
      setSubmitErr("You’re offline. Your basket and details are saved — reconnect to place your order.");
      return;
    }
    // Re-validate everything client-side first (the server checks again).
    const e1 = validateCustomer(s.customer);
    const e2 = validateAddress(s.address, delivery);
    if (hasErrors(e1)) return (setCe(e1), go(0));
    if (hasErrors(e2)) return (setAe(e2), go(1));
    if (!s.deliveryDate || !isDeliverableDate(s.deliveryDate, delivery)) {
      setS({ ...s, deliveryDate: null, step: 2 });
      setDateErr("Please choose an available Monday.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          checkoutId: s.checkoutId,
          customer: s.customer,
          address: s.address,
          deliveryDate: s.deliveryDate,
          items: b.items.map((i) => ({ productId: i.productId, variantId: i.variantId, quantity: i.quantity })),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (data.code === "pricing") {
          setSubmitErr("Some items have changed since you added them. Please review your basket.");
          setCheck((c) => (c ? { ...c, issues: data.details ?? [] } : c));
        } else if (data.code === "invalid_date") {
          setS({ ...s, deliveryDate: null, step: 2 });
          setDateErr(data.error);
        } else if (data.code === "invalid_details") {
          setCe(data.details?.customer ?? {});
          setAe(data.details?.address ?? {});
          go(hasErrors(data.details?.customer ?? {}) ? 0 : 1);
        } else setSubmitErr(data.error ?? "Something went wrong. Please try again.");
        return;
      }
      const o = data.order;
      rememberOrder({ id: o.id, reference: o.reference, createdAt: o.createdAt });
      try {
        sessionStorage.setItem(`me.order.${o.id}`, JSON.stringify(o));
      } catch {}
      b.clear();
      localStorage.removeItem(KEY);
      router.replace(`/checkout/whatsapp/${o.id}`);
    } catch {
      setSubmitErr(
        "We couldn’t reach the store. Check your connection and tap the button again — your order won’t be duplicated.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const fee = check ? check.deliveryFeeCents : deliveryFeeFor(subtotal, delivery);
  const shownSubtotal = check ? check.subtotalCents : subtotal;
  const issues = check?.issues ?? [];

  return (
    <div className="wrap" ref={top} style={{ scrollMarginTop: 80 }}>
      <div className="page-head" style={{ marginBottom: 0, borderBottom: 0, paddingBottom: 20 }}>
        <p className="eyebrow">Checkout</p>
        <h1 style={{ marginTop: 10 }}>{STEPS[step] === "Review" ? "Review your order" : STEPS[step]}</h1>
      </div>
      <nav aria-label="Checkout steps">
        <ol className="steps" style={{ padding: 0, margin: "0 0 32px" }}>
          {STEPS.map((label, i) => (
            <li key={label} className={i === step ? "current" : i < step ? "done" : ""} aria-current={i === step ? "step" : undefined}>
              {i < step ? (
                <button type="button" onClick={() => go(i)}>
                  {i + 1}. {label}
                </button>
              ) : (
                <>
                  {i + 1}. {label}
                </>
              )}
            </li>
          ))}
        </ol>
      </nav>

      {!whatsappReady && (
        <p className="notice notice-warn" style={{ marginBottom: 24 }}>
          Online ordering opens soon. You can prepare your basket now.
        </p>
      )}

      <div className="co-grid">
        <div>
          {step === 0 && (
            <form
              noValidate
              onSubmit={(e) => {
                e.preventDefault();
                nextFromDetails();
              }}
            >
              <div className="grid-2">
                <Field label="First name" error={ce.firstName} id="firstName">
                  <input id="firstName" className="input" autoComplete="given-name" value={s.customer.firstName} onChange={(e) => setC("firstName", e.target.value)} aria-invalid={!!ce.firstName} />
                </Field>
                <Field label="Surname" error={ce.surname} id="surname">
                  <input id="surname" className="input" autoComplete="family-name" value={s.customer.surname} onChange={(e) => setC("surname", e.target.value)} aria-invalid={!!ce.surname} />
                </Field>
              </div>
              <Field label="WhatsApp / mobile number" error={ce.phone} id="phone" hint="We’ll confirm your order on this number.">
                <input id="phone" className="input" type="tel" inputMode="tel" autoComplete="tel" placeholder="082 123 4567" value={s.customer.phone} onChange={(e) => setC("phone", e.target.value)} aria-invalid={!!ce.phone} />
              </Field>
              <Field label="Email" optional error={ce.email} id="email">
                <input id="email" className="input" type="email" inputMode="email" autoComplete="email" value={s.customer.email} onChange={(e) => setC("email", e.target.value)} aria-invalid={!!ce.email} />
              </Field>
              <div className="co-actions">
                <Link href="/basket" className="btn btn-outline">Back to basket</Link>
                <button className="btn">Continue</button>
              </div>
            </form>
          )}

          {step === 1 && (
            <form
              noValidate
              onSubmit={(e) => {
                e.preventDefault();
                nextFromAddress();
              }}
            >
              <p className="notice small" style={{ marginBottom: 24 }}>
                We currently deliver within {delivery.city}, {delivery.province} only.
              </p>
              <Field label="Street address" error={ae.street} id="street" hint="House or unit number and street.">
                <input id="street" className="input" autoComplete="address-line1" value={s.address.street} onChange={(e) => setA("street", e.target.value)} aria-invalid={!!ae.street} />
              </Field>
              <Field label="Building or complex" optional error={ae.building} id="building">
                <input id="building" className="input" autoComplete="address-line2" value={s.address.building} onChange={(e) => setA("building", e.target.value)} aria-invalid={!!ae.building} />
              </Field>
              <Field label="Suburb" error={ae.suburb} id="suburb">
                <select id="suburb" className="select" value={s.address.suburb} onChange={(e) => setA("suburb", e.target.value)} aria-invalid={!!ae.suburb}>
                  <option value="">Choose your suburb</option>
                  {[...delivery.regions].sort((a, b) => a.localeCompare(b)).map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </Field>
              <p className="hint">Suburb not listed? We don’t deliver there yet — message us and we’ll let you know when we do.</p>
              <div className="field" style={{ marginTop: 20 }}>
                <span className="label">City</span>
                <p className="input" style={{ background: "transparent", display: "flex", alignItems: "center", color: "var(--muted)" }}>
                  {delivery.city}, {delivery.province}
                </p>
              </div>
              <Field label="Delivery instructions" optional error={ae.instructions} id="instructions">
                <textarea id="instructions" className="textarea" maxLength={300} placeholder="Gate code, where to leave it, landmarks…" value={s.address.instructions} onChange={(e) => setA("instructions", e.target.value)} />
              </Field>
              <div className="co-actions">
                <button type="button" className="btn btn-outline" onClick={() => go(0)}>Back</button>
                <button className="btn">Continue</button>
              </div>
            </form>
          )}

          {step === 2 && (
            <div>
              <p className="lede" style={{ marginBottom: 8 }}>We deliver on <strong>Mondays</strong> only.</p>
              <p className="muted small" style={{ marginBottom: 24 }}>
                Choose your Monday. Orders close {describeCutoff(delivery.cutoffHours)} before each delivery.
              </p>
              <MondayPicker
                settings={delivery}
                value={s.deliveryDate}
                invalid={!!dateErr}
                onChange={(iso) => {
                  setS({ ...s, deliveryDate: iso });
                  setDateErr(null);
                }}
              />
              {s.deliveryDate ? (
                <div className="date-chosen" aria-live="polite">
                  <div>
                    <p className="eyebrow">Your delivery</p>
                    <p className="serif" style={{ fontSize: 24, marginTop: 4 }}>{formatDeliveryDate(s.deliveryDate)}</p>
                  </div>
                </div>
              ) : (
                <p className="hint" aria-live="polite">No date selected yet.</p>
              )}
              {dateErr && <p className="error" role="alert">{dateErr}</p>}
              <div className="co-actions">
                <button type="button" className="btn btn-outline" onClick={() => go(1)}>Back</button>
                <button type="button" className="btn" onClick={nextFromDelivery}>Continue</button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div>
              <section className="review-block">
                <header>
                  <h3>Your details</h3>
                  <button className="link small" onClick={() => go(0)}>Edit</button>
                </header>
                <p>{s.customer.firstName} {s.customer.surname}</p>
                <p className="muted">{s.customer.phone}</p>
                {s.customer.email && <p className="muted">{s.customer.email}</p>}
              </section>
              <section className="review-block">
                <header>
                  <h3>Delivery address</h3>
                  <button className="link small" onClick={() => go(1)}>Edit</button>
                </header>
                <p>{s.address.street}</p>
                {s.address.building && <p>{s.address.building}</p>}
                <p>{s.address.suburb}, {delivery.city}</p>
                {s.address.instructions && <p className="muted small" style={{ marginTop: 6 }}>“{s.address.instructions}”</p>}
              </section>
              <section className="review-block">
                <header>
                  <h3>Delivery day</h3>
                  <button className="link small" onClick={() => go(2)}>Change</button>
                </header>
                <p>{s.deliveryDate && formatDeliveryDate(s.deliveryDate)}</p>
              </section>
              <section className="review-block">
                <header>
                  <h3>Items</h3>
                  <Link className="link small" href="/basket">Edit basket</Link>
                </header>
                {b.items.map((it) => {
                  const line = check?.lines.find((l) => l.productId === it.productId && l.variantId === it.variantId);
                  const issue = issues.find((x) => x.productId === it.productId && x.variantId === it.variantId);
                  const unit = line?.unitPriceCents ?? it.priceCents;
                  return (
                    <div key={`${it.productId}:${it.variantId}`} style={{ padding: "10px 0", borderBottom: "1px solid var(--line)" }}>
                      <div className="row between" style={{ alignItems: "baseline" }}>
                        <span>
                          {it.quantity} × {it.name}
                          {it.variantName ? ` (${it.variantName})` : ""}
                        </span>
                        <span className="num">{formatZAR(unit * it.quantity)}</span>
                      </div>
                      <p className="small muted num">{formatZAR(unit)} each</p>
                      {line && line.unitPriceCents !== it.priceCents && (
                        <p className="small" style={{ color: "var(--warn)" }}>Price updated from {formatZAR(it.priceCents)}</p>
                      )}
                      {issue && <p className="error">{issue.message}</p>}
                    </div>
                  );
                })}
              </section>
            </div>
          )}
        </div>

        <aside className="summary" aria-label="Order summary">
          <h2 style={{ fontSize: 26, marginBottom: 14 }}>Summary</h2>
          {step < 3 && (
            <p className="small muted" style={{ marginBottom: 10 }}>
              {b.count} {b.count === 1 ? "item" : "items"}
            </p>
          )}
          <div className="sum-row"><span>Subtotal</span><span className="num">{formatZAR(shownSubtotal)}</span></div>
          <div className="sum-row"><span>Delivery</span><span className="num">{fee === 0 ? "Free" : formatZAR(fee)}</span></div>
          {s.deliveryDate && (
            <div className="sum-row small muted"><span>Delivery day</span><span>{formatDeliveryDate(s.deliveryDate).replace(/, \d{4}$/, "")}</span></div>
          )}
          <div className="sum-row sum-total"><span>Total</span><span className="num">{formatZAR(shownSubtotal + fee)}</span></div>

          {step === 3 && (
            <div style={{ marginTop: 20 }}>
              {!online ? (
                <p className="notice notice-warn small">
                  You’re offline. Everything is saved. Reconnect to send your order — we need the latest prices and stock first.
                </p>
              ) : checkErr ? (
                <p className="notice notice-warn small">Couldn’t check latest prices. They’ll be checked when you place the order.</p>
              ) : !check ? (
                <p className="hint">Checking latest prices and stock…</p>
              ) : issues.length > 0 ? (
                <p className="notice notice-danger small">
                  Some items have changed. <Link href="/basket" className="link">Update your basket</Link> to continue.
                </p>
              ) : (
                <p className="hint">Prices and stock confirmed just now.</p>
              )}
              <label className="check" style={{ marginTop: 14 }}>
                <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} />
                <span className="small">
                  I agree to the <Link href="/terms" className="link" target="_blank">terms</Link> and{" "}
                  <Link href="/privacy" className="link" target="_blank">privacy policy</Link>.
                </span>
              </label>
              <button
                className="btn btn-block btn-wa"
                style={{ marginTop: 14 }}
                disabled={submitting || !online || !agree || issues.length > 0 || !whatsappReady}
                onClick={placeOrder}
              >
                {submitting ? <span className="spinner" /> : "Place order via WhatsApp"}
              </button>
              {submitErr && <p className="error" role="alert">{submitErr}</p>}
              <p className="hint">
                We’ll save your order, then open WhatsApp with your order message. Payment is arranged when we confirm.
              </p>
              <div className="co-actions" style={{ marginTop: 16 }}>
                <button type="button" className="btn btn-outline btn-block" onClick={() => go(2)}>Back</button>
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}

function Field({
  label,
  error,
  hint,
  optional,
  id,
  children,
}: {
  label: string;
  error?: string;
  hint?: string;
  optional?: boolean;
  id: string;
  children: React.ReactNode;
}) {
  return (
    <div className="field">
      <label className="label" htmlFor={id}>
        {label} {optional && <span className="opt">(optional)</span>}
      </label>
      {children}
      {error ? (
        <p className="error" id={`${id}-err`} role="alert">
          {error}
        </p>
      ) : hint ? (
        <p className="hint">{hint}</p>
      ) : null}
    </div>
  );
}

function focusFirstError() {
  requestAnimationFrame(() => {
    const el = document.querySelector<HTMLElement>('[aria-invalid="true"]');
    el?.focus();
  });
}
