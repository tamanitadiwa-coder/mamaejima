"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BasketProvider, useBasket } from "./BasketProvider";
import { InstallProvider, useInstall } from "./InstallProvider";
import { useOnline } from "./useOnline";
import { BagIcon, CloseIcon, MenuIcon, SearchIcon, Mark } from "./Icons";
import { CatalogProvider, useCatalog } from "./CatalogProvider";
import { Footer } from "./Footer";
import { BottomNav } from "./BottomNav";

export function StoreShell({ children }: { children: React.ReactNode }) {
  return (
    <InstallProvider>
      <CatalogProvider>
        <BasketProvider>
          <Splash />
          <OfflineBar />
          <Announcement />
          <Header />
          <main id="main" className="pb-[calc(64px+env(safe-area-inset-bottom))] lg:pb-0">
            {children}
          </main>
          <Footer />
          <BottomNav />
          <Toast />
        </BasketProvider>
      </CatalogProvider>
    </InstallProvider>
  );
}

function Announcement() {
  const { catalog } = useCatalog();
  const s = catalog?.settings;
  if (!s?.announcementActive || !s.announcement.trim()) return null;
  return <div className="announce">{s.announcement}</div>;
}

/** Branded launch screen; visible only when opened from the Home Screen (see layout head script). */
function Splash() {
  const [hide, setHide] = useState(false);
  const [gone, setGone] = useState(false);
  useEffect(() => {
    const t1 = setTimeout(() => setHide(true), 650);
    const t2 = setTimeout(() => setGone(true), 1100);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);
  if (gone) return null;
  return (
    <div className={`splash${hide ? " hide" : ""}`} aria-hidden>
      <Mark size={56} />
      <span className="wordmark">Mama Ejima</span>
    </div>
  );
}

function OfflineBar() {
  const online = useOnline();
  if (online) return null;
  return (
    <div className="offline-bar" role="status">
      You’re offline. You can browse and keep your basket — prices and stock will update when you reconnect.
    </div>
  );
}

function Toast() {
  const { toast } = useBasket();
  if (!toast) return null;
  return (
    <div className="toast" role="status" key={toast.key}>
      <span>{toast.text}</span>
      <Link href="/basket">View basket</Link>
    </div>
  );
}

const NAV = [
  { href: "/shop", label: "Shop" },
  { href: "/about", label: "Our Story" },
  { href: "/contact", label: "Contact" },
];

function Header() {
  const { count, ready } = useBasket();
  const inst = useInstall();
  const path = usePathname();
  const [menu, setMenu] = useState(false);

  useEffect(() => setMenu(false), [path]);
  useEffect(() => {
    document.body.style.overflow = menu ? "hidden" : "";
  }, [menu]);

  const isCurrent = (href: string) => (path === href || path.startsWith(href + "/") ? "page" : undefined);

  return (
    <header className="header">
      <div className="wrap header-inner">
        <div className="header-left">
          <button className="icon-btn menu-toggle" aria-label="Open menu" onClick={() => setMenu(true)}>
            <MenuIcon />
          </button>
          <Link href="/" className="wordmark only-desktop-left" aria-label="Mama Ejima home">
            <span className="wm-desktop">Mama Ejima</span>
          </Link>
        </div>
        <Link href="/" className="wordmark wm-center" aria-label="Mama Ejima home">
          Mama Ejima
        </Link>
        <nav className="nav" aria-label="Main">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} aria-current={isCurrent(n.href)}>
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="header-actions">
          {inst.showInstall && (
            <button className="install-link" onClick={() => inst.open()}>
              Install app
            </button>
          )}
          <Link href="/search" className="icon-btn" aria-label="Search">
            <SearchIcon />
          </Link>
          <Link href="/basket" className="icon-btn" aria-label={`Basket, ${count} items`}>
            <BagIcon />
            {ready && count > 0 && <span className="bag-count">{count > 99 ? "99+" : count}</span>}
          </Link>
        </div>
      </div>

      {menu && (
        <div className="menu-sheet" role="dialog" aria-modal="true" aria-label="Menu">
          <div className="wrap header-inner" style={{ borderBottom: "1px solid var(--line)" }}>
            <div className="header-left">
              <button className="icon-btn" aria-label="Close menu" onClick={() => setMenu(false)}>
                <CloseIcon />
              </button>
            </div>
            <span className="wordmark wm-center">Mama Ejima</span>
            <div />
          </div>
          <nav aria-label="Mobile">
            <Link href="/">Home</Link>
            {NAV.map((n) => (
              <Link key={n.href} href={n.href}>
                {n.label}
              </Link>
            ))}
            <Link href="/delivery">Delivery</Link>
            <Link href="/basket">Basket{ready && count > 0 ? ` (${count})` : ""}</Link>
          </nav>
          <div className="menu-foot">
            {inst.showInstall ? (
              <button
                className="btn btn-outline btn-block"
                onClick={() => {
                  setMenu(false);
                  inst.open();
                }}
              >
                Install Mama Ejima
              </button>
            ) : (
              <p className="muted small">Delivering across Cape Town, every Monday.</p>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
