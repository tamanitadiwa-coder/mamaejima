"use client";

import { useCatalog } from "@/components/CatalogProvider";
import { whatsappChatLink } from "@/lib/whatsapp";
import { formatPhone } from "@/lib/validation";

export default function ContactPage() {
  const { catalog } = useCatalog();
  const s = catalog?.settings;
  const wa = s ? whatsappChatLink(s.whatsappNumber, "Hi Mama Ejima, ") : null;
  return (
    <div className="wrap">
      <header className="page-head">
        <p className="eyebrow">Contact</p>
        <h1 style={{ marginTop: 10 }}>Talk to us.</h1>
      </header>
      <div className="prose">
        <p>The quickest way to reach us is WhatsApp. We reply during the day, Monday to Saturday.</p>
        <div className="spec" style={{ marginTop: 28 }}>
          <div>
            <span>WhatsApp</span>
            {wa && s ? <a className="link" href={wa} target="_blank" rel="noopener noreferrer">{formatPhone(s.whatsappNumber)}</a> : <span className="muted">Coming soon</span>}
          </div>
          {s?.contactEmail && <div><span>Email</span><a className="link" href={`mailto:${s.contactEmail}`}>{s.contactEmail}</a></div>}
          {s?.contactPhone && <div><span>Phone</span><a className="link" href={`tel:${s.contactPhone.replace(/\s/g, "")}`}>{s.contactPhone}</a></div>}
          <div><span>Area</span><span>Cape Town, Western Cape</span></div>
        </div>
        {wa && <p style={{ marginTop: 32 }}><a href={wa} className="btn" target="_blank" rel="noopener noreferrer">Message us on WhatsApp</a></p>}
      </div>
    </div>
  );
}
