import Link from "next/link";
import type { StoreSettings } from "@/lib/types";
import { whatsappChatLink } from "@/lib/whatsapp";
import { formatPhone } from "@/lib/validation";
import { FooterInstall } from "./FooterInstall";

export function Footer({ settings }: { settings: StoreSettings }) {
  const wa = whatsappChatLink(settings.whatsappNumber);
  return (
    <footer className="footer">
      <div className="wrap">
        <div className="footer-grid">
          <div>
            <p className="wordmark" style={{ marginBottom: 12 }}>Mama Ejima</p>
            <p className="muted" style={{ maxWidth: 300 }}>
              Zimbabwean favourites in Cape Town. Delivered on Mondays.
            </p>
          </div>
          <div>
            <h4>Shop</h4>
            <ul>
              <li><Link href="/shop">All products</Link></li>
              <li><Link href="/search">Search</Link></li>
              <li><Link href="/basket">Basket</Link></li>
              <li><FooterInstall /></li>
            </ul>
          </div>
          <div>
            <h4>Help</h4>
            <ul>
              <li><Link href="/delivery">Delivery</Link></li>
              <li><Link href="/contact">Contact</Link></li>
              <li><Link href="/about">Our story</Link></li>
            </ul>
          </div>
          <div>
            <h4>Talk to us</h4>
            <ul>
              {wa ? (
                <li><a href={wa} target="_blank" rel="noopener noreferrer">WhatsApp {formatPhone(settings.whatsappNumber.replace(/\D/g, ""))}</a></li>
              ) : (
                <li className="muted">WhatsApp coming soon</li>
              )}
              {settings.contactEmail && <li><a href={`mailto:${settings.contactEmail}`}>{settings.contactEmail}</a></li>}
            </ul>
          </div>
        </div>
        <div className="footer-base">
          <span>© {new Date().getFullYear()} Mama Ejima · Cape Town</span>
          <span className="row" style={{ gap: 16 }}>
            <Link href="/privacy">Privacy</Link>
            <Link href="/terms">Terms</Link>
          </span>
        </div>
      </div>
    </footer>
  );
}
