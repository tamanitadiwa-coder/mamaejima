"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import type { Category, Product } from "@/lib/types";
import { useCatalog } from "@/components/CatalogProvider";
import { CatalogState } from "@/components/CatalogState";
import { ProductCard } from "@/components/ProductCard";
import { SearchIcon } from "@/components/Icons";
import { categoryHref } from "@/lib/product";
import { BASE_PATH } from "@/lib/paths";

function searchProducts(products: Product[], categories: Category[], q: string): Product[] {
  const terms = q.toLowerCase().split(/\s+/).filter(Boolean);
  if (!terms.length) return [];
  const catName = new Map(categories.map((c) => [c.id, c.name.toLowerCase()]));
  return products
    .map((p) => {
      const hay = `${p.name} ${p.description} ${p.sku} ${catName.get(p.categoryId) ?? ""} ${p.variants.map((v) => v.name).join(" ")}`.toLowerCase();
      const name = p.name.toLowerCase();
      let score = 0;
      for (const t of terms) {
        if (!hay.includes(t)) return null;
        score += name.includes(t) ? 3 : 1;
      }
      return { p, score };
    })
    .filter((x): x is { p: Product; score: number } => !!x)
    .sort((a, b) => b.score - a.score)
    .map((x) => x.p);
}

function SearchInner() {
  const query = (useSearchParams().get("q") ?? "").trim().slice(0, 80);
  const { catalog } = useCatalog();
  const categories = catalog?.categories ?? [];
  const results = catalog && query ? searchProducts(catalog.products, categories, query) : [];
  const catById = new Map(categories.map((c) => [c.id, c]));

  return (
    <div className="wrap" style={{ paddingBottom: 96 }}>
      <div className="page-head" style={{ marginBottom: 24 }}>
        <p className="eyebrow">Search</p>
        <h1 style={{ marginTop: 10 }}>{query ? <>Results for “{query}”</> : "What are you looking for?"}</h1>
      </div>
      <form action={`${BASE_PATH}/search/`} className="row" style={{ gap: 0, marginBottom: 32, maxWidth: 640 }} role="search">
        <label htmlFor="q" className="sr-only">Search products</label>
        <input id="q" name="q" className="input" defaultValue={query} placeholder="Search products" enterKeyHint="search" style={{ borderRight: 0 }} />
        <button className="btn" aria-label="Search" style={{ padding: "0 18px" }}><SearchIcon /></button>
      </form>
      <CatalogState>
        {query && <p className="muted small" style={{ marginBottom: 24 }}>{results.length} {results.length === 1 ? "result" : "results"}</p>}
        {query && results.length === 0 && (
          <div className="empty" style={{ paddingTop: 24 }}>
            <h2>No matches</h2>
            <p className="muted">Try a different word, or browse a category.</p>
            <div className="chips" style={{ justifyContent: "center", flexWrap: "wrap" }}>
              {categories.map((c) => <Link key={c.id} href={categoryHref(c.slug)} className="chip">{c.name}</Link>)}
            </div>
          </div>
        )}
        {results.length > 0 && (
          <div className="grid grid-4">
            {results.map((p) => <ProductCard key={p.id} product={p} category={catById.get(p.categoryId)} />)}
          </div>
        )}
        {!query && (
          <div className="cat-list" style={{ maxWidth: 640 }}>
            {categories.map((c) => (
              <Link key={c.id} href={categoryHref(c.slug)} className="cat-row">
                <span className="serif" style={{ fontSize: 28 }}>{c.name}</span>
                <span className="arrow" aria-hidden>→</span>
              </Link>
            ))}
          </div>
        )}
      </CatalogState>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense>
      <SearchInner />
    </Suspense>
  );
}
