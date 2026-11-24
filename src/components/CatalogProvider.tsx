"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import type { RecordModel } from "pocketbase";
import type { Category, Product, ProductVariant, StoreSettings } from "@/lib/types";
import { backendConfigured, pb } from "@/lib/pb";
import { idbGet, idbSet } from "@/lib/idb";
import { asset } from "@/lib/paths";

// Catalogue = products + categories + store settings.
// Shown from the IndexedDB copy immediately (works offline), then refreshed
// from PocketBase. Cached data is never treated as current for ordering:
// the server re-prices everything at checkout.

const CACHE_KEY = "catalog.v1";

export interface Catalog {
  products: Product[];
  categories: Category[];
  settings: StoreSettings;
  fetchedAt: string;
}

type Status = "loading" | "ready" | "error";

interface CatalogCtx {
  status: Status;
  catalog: Catalog | null;
  /** true when what's shown came from the device cache, not the server just now */
  fromCache: boolean;
  error: string | null;
  reload: () => void;
}

const Ctx = createContext<CatalogCtx | null>(null);

function fileUrl(r: RecordModel, name: string, thumb?: string) {
  return pb().files.getURL(r, name, thumb ? { thumb } : undefined);
}

function toProduct(r: RecordModel): Product {
  const images: string[] = Array.isArray(r.images) ? r.images : [];
  const variants: ProductVariant[] = Array.isArray(r.variants)
    ? r.variants.map((v: any) => ({
        id: String(v.id),
        name: String(v.name ?? ""),
        priceCents: Number(v.priceCents) || 0,
        stock: Number(v.stock) || 0,
        sku: String(v.sku ?? ""),
      }))
    : [];
  return {
    id: r.id,
    slug: r.slug,
    name: r.name,
    description: r.description ?? "",
    categoryId: r.category ?? "",
    priceCents: Number(r.priceCents) || 0,
    stock: Number(r.stock) || 0,
    sku: r.sku ?? "",
    images: images.map((f) => fileUrl(r, f, "800x1000")),
    available: !!r.available,
    featured: !!r.featured,
    popular: !!r.popular,
    variants,
    isPlaceholder: !!r.isPlaceholder,
    createdAt: r.created,
    updatedAt: r.updated,
  };
}

function toCategory(r: RecordModel): Category {
  return { id: r.id, slug: r.slug, name: r.name, description: r.description ?? "", sortOrder: Number(r.sortOrder) || 0 };
}

function toSettings(r: RecordModel): StoreSettings {
  return {
    storeName: r.storeName || "Mama Ejima",
    whatsappNumber: r.whatsappNumber || "",
    contactEmail: r.contactEmail || "",
    contactPhone: r.contactPhone || "",
    announcement: r.announcement || "",
    announcementActive: !!r.announcementActive,
    heroImage: r.heroImage ? fileUrl(r, r.heroImage, "1600x1200") : asset("/placeholders/hero.svg"),
    delivery: {
      feeCents: Number(r.deliveryFeeCents) || 0,
      freeOverCents: Number(r.freeOverCents) > 0 ? Number(r.freeOverCents) : null,
      cutoffHours: Number(r.cutoffHours) || 0,
      horizonWeeks: Number(r.horizonWeeks) || 8,
      blockedDates: Array.isArray(r.blockedDates) ? r.blockedDates : [],
      regions: Array.isArray(r.regions) ? r.regions : [],
      city: r.city || "Cape Town",
      province: r.province || "Western Cape",
    },
  };
}

export async function fetchCatalog(): Promise<Catalog> {
  const client = pb();
  const [products, categories, settings] = await Promise.all([
    client.collection("products").getFullList({ sort: "name", batch: 500 }),
    client.collection("categories").getFullList({ sort: "sortOrder,name" }),
    client.collection("settings").getFirstListItem("key='store'"),
  ]);
  return {
    products: products.map(toProduct),
    categories: categories.map(toCategory),
    settings: toSettings(settings),
    fetchedAt: new Date().toISOString(),
  };
}

export function CatalogProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<Status>("loading");
  const [catalog, setCatalog] = useState<Catalog | null>(null);
  const [fromCache, setFromCache] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const gotNetwork = useRef(false);

  const refresh = useCallback(async () => {
    if (!backendConfigured()) {
      setError("not_configured");
      setStatus((s) => (s === "loading" ? "error" : s));
      return;
    }
    try {
      const fresh = await fetchCatalog();
      gotNetwork.current = true;
      setCatalog(fresh);
      setFromCache(false);
      setError(null);
      setStatus("ready");
      idbSet(CACHE_KEY, fresh);
    } catch {
      setError("unreachable");
      setStatus((s) => (s === "loading" ? "error" : s));
    }
  }, []);

  useEffect(() => {
    let alive = true;
    idbGet<Catalog>(CACHE_KEY).then((cached) => {
      if (!alive || !cached || gotNetwork.current) return;
      setCatalog(cached);
      setFromCache(true);
      setStatus("ready");
    });
    refresh();
    const onOnline = () => refresh();
    const onVisible = () => document.visibilityState === "visible" && refresh();
    window.addEventListener("online", onOnline);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      alive = false;
      window.removeEventListener("online", onOnline);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [refresh]);

  return (
    <Ctx.Provider value={{ status, catalog, fromCache, error, reload: refresh }}>{children}</Ctx.Provider>
  );
}

export function useCatalog() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useCatalog outside CatalogProvider");
  return c;
}
