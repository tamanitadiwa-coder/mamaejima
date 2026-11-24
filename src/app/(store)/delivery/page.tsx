"use client";

import { useCatalog } from "@/components/CatalogProvider";
import { formatZAR } from "@/lib/money";
import { availableMondays, describeCutoff, formatDeliveryDate } from "@/lib/delivery";

export default function DeliveryPage() {
  const { catalog } = useCatalog();
  const d = catalog?.settings.delivery;
  const next = d ? availableMondays(d).slice(0, 3) : [];
  return (
    <div className="wrap">
      <header className="page-head">
        <p className="eyebrow">Delivery</p>
        <h1 style={{ marginTop: 10 }}>Mondays, across Cape Town.</h1>
      </header>
      <div className="prose">
        <p>We deliver on Mondays only, within Cape Town. You choose your Monday at checkout.</p>
        {d && (
          <div className="spec" style={{ marginTop: 28 }}>
            <div><span>Delivery day</span><span>Monday</span></div>
            <div><span>Order by</span><span>{describeCutoff(d.cutoffHours)} before</span></div>
            <div><span>Fee</span><span>{d.feeCents === 0 ? "Free" : formatZAR(d.feeCents)}{d.freeOverCents ? ` · free over ${formatZAR(d.freeOverCents)}` : ""}</span></div>
            <div><span>Next open Mondays</span><span style={{ textAlign: "right" }}>{next.length ? next.map(formatDeliveryDate).join(" · ") : "To be announced"}</span></div>
          </div>
        )}
        <h2>How it works</h2>
        <ul>
          <li>Place your order and choose a Monday.</li>
          <li>WhatsApp opens with your order. Send it to us.</li>
          <li>We confirm your order and how to pay on WhatsApp.</li>
          <li>We deliver on your Monday.</li>
        </ul>
        <h2>Where we deliver</h2>
        <p>
          {d?.regions.length
            ? `${d.regions.length} suburbs across ${d.city}. You’ll see the full list when you enter your address.`
            : "Suburbs across Cape Town."}{" "}
          Not on the list yet? Message us — we’re growing.
        </p>
      </div>
    </div>
  );
}
