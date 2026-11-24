"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { BasketItem } from "@/lib/types";

const KEY = "me.basket.v1";

interface BasketCtx {
  items: BasketItem[];
  ready: boolean;
  count: number;
  subtotalCents: number;
  add: (item: Omit<BasketItem, "quantity">, qty: number) => void;
  setQty: (productId: string, variantId: string | null, qty: number) => void;
  remove: (productId: string, variantId: string | null) => void;
  /** Replace snapshot data (prices/names) after a server check. */
  refresh: (updates: (Partial<BasketItem> & { productId: string; variantId: string | null })[]) => void;
  clear: () => void;
  toast: { text: string; key: number } | null;
  showToast: (text: string) => void;
}

const Ctx = createContext<BasketCtx | null>(null);
const same = (a: { productId: string; variantId: string | null }, pid: string, vid: string | null) =>
  a.productId === pid && (a.variantId ?? null) === (vid ?? null);

export function BasketProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<BasketItem[]>([]);
  const [ready, setReady] = useState(false);
  const [toast, setToast] = useState<{ text: string; key: number } | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setItems(JSON.parse(raw));
    } catch {}
    setReady(true);
    // Keep tabs in sync
    const onStorage = (e: StorageEvent) => {
      if (e.key === KEY) {
        try {
          setItems(e.newValue ? JSON.parse(e.newValue) : []);
        } catch {}
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(KEY, JSON.stringify(items));
    } catch {}
  }, [items, ready]);

  const showToast = useCallback((text: string) => {
    setToast({ text, key: Date.now() });
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setToast(null), 3200);
  }, []);

  const add: BasketCtx["add"] = useCallback((item, qty) => {
    setItems((prev) => {
      const i = prev.findIndex((x) => same(x, item.productId, item.variantId));
      if (i >= 0) {
        const next = [...prev];
        next[i] = { ...next[i], ...item, quantity: Math.min(50, next[i].quantity + qty) };
        return next;
      }
      return [...prev, { ...item, quantity: Math.min(50, qty) }];
    });
  }, []);

  const setQty: BasketCtx["setQty"] = useCallback((pid, vid, qty) => {
    setItems((prev) =>
      qty <= 0
        ? prev.filter((x) => !same(x, pid, vid))
        : prev.map((x) => (same(x, pid, vid) ? { ...x, quantity: Math.min(50, qty) } : x)),
    );
  }, []);

  const remove: BasketCtx["remove"] = useCallback((pid, vid) => {
    setItems((prev) => prev.filter((x) => !same(x, pid, vid)));
  }, []);

  const refresh: BasketCtx["refresh"] = useCallback((updates) => {
    setItems((prev) =>
      prev.map((x) => {
        const u = updates.find((y) => same(y, x.productId, x.variantId));
        return u ? { ...x, ...u } : x;
      }),
    );
  }, []);

  const clear = useCallback(() => setItems([]), []);

  const value = useMemo<BasketCtx>(
    () => ({
      items,
      ready,
      count: items.reduce((s, i) => s + i.quantity, 0),
      subtotalCents: items.reduce((s, i) => s + i.priceCents * i.quantity, 0),
      add,
      setQty,
      remove,
      refresh,
      clear,
      toast,
      showToast,
    }),
    [items, ready, add, setQty, remove, refresh, clear, toast, showToast],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useBasket() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useBasket outside BasketProvider");
  return c;
}
