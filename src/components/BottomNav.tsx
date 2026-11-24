"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useBasket } from "./BasketProvider";

// Mobile-only tab bar. Flat, hairline top border, text + simple line glyphs.
const TABS = [
  { href: "/", label: "Home", d: "M4 11 12 4l8 7v9h-5v-6H9v6H4z" },
  { href: "/shop/", label: "Shop", d: "M4 5h16M4 12h16M4 19h10" },
  { href: "/search/", label: "Search", d: "M11 18a7 7 0 1 1 0-14 7 7 0 0 1 0 14Zm5-2 5 5" },
  { href: "/basket/", label: "Basket", d: "M5 8h14l-1 13H6L5 8Zm4 0V6a3 3 0 0 1 6 0v2" },
  { href: "/account/", label: "Account", d: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-7 9a7 7 0 0 1 14 0" },
];

export function BottomNav() {
  const path = usePathname() || "/";
  const { count, ready } = useBasket();
  const active = (href: string) =>
    href === "/" ? path === "/" : path === href || path.startsWith(href) || path + "/" === href;

  return (
    <nav
      aria-label="App"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-[var(--line)] bg-[var(--ivory)] pb-[env(safe-area-inset-bottom)] lg:hidden"
    >
      <ul className="m-0 flex h-16 list-none p-0">
        {TABS.map((t) => {
          const on = active(t.href);
          return (
            <li key={t.href} className="flex-1">
              <Link
                href={t.href}
                aria-current={on ? "page" : undefined}
                className={`relative flex h-full flex-col items-center justify-center gap-1 text-[11px] tracking-wide ${
                  on ? "text-[var(--ink)]" : "text-[var(--soft)]"
                }`}
              >
                {on && <span className="absolute inset-x-6 top-0 h-px bg-[var(--ink)]" aria-hidden />}
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={on ? 1.6 : 1.3} aria-hidden>
                  <path d={t.d} />
                </svg>
                <span>{t.label}</span>
                {t.label === "Basket" && ready && count > 0 && (
                  <span className="absolute right-[calc(50%-22px)] top-2 min-w-[16px] rounded-full bg-[var(--earth)] px-1 text-center text-[10px] font-semibold leading-4 text-[var(--ivory)]">
                    {count > 99 ? "99+" : count}
                  </span>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
