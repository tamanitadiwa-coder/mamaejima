import type { Metadata } from "next";
import Link from "next/link";
import { getCatalog, searchProducts } from "@/server/catalog";
import { ProductCard } from "@/components/ProductCard";
import { SearchIcon } from "@/components/Icons";

export const metadata: Metadata = { title: "Search" };

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q = "" } = await searchParams;
  const query = q.trim().slice(0, 80);
  const { products, categories } = await getCatalog();
  const results = query ? searchProducts(products, categories, query) : [];
  const catById = new Map(categories.map((c) => [c.id, c]));

  return (
    <div className="wrap" style={{ paddingBottom: 96 }}>
      <div className="page-head" style={{ marginBottom: 24 }}>
        <p className="eyebrow">Search</p>
        <h1 style={{ marginTop: 10 }}>{query ? <>Results for “{query}”</> : "What are you looking for?"}</h1>
      </div>
      <form action="/search" className="row" style={{ gap: 0, marginBottom: 32, maxWidth: 640 }} role="search">
        <label htmlFor="q" className="sr-only">Search products</label>
        <input id="q" name="q" className="input" defaultValue={query} placeholder="Search products" autoFocus={!query} enterKeyHint="search" style={{ borderRight: 0 }} />
        <button className="btn" aria-label="Search" style={{ padding: "0 18px" }}><SearchIcon /></button>
      </form>

      {query && (
        <p className="muted small" style={{ marginBottom: 24 }}>
          {results.length} {results.length === 1 ? "result" : "results"}
        </p>
      )}

      {query && results.length === 0 && (
        <div className="empty" style={{ paddingTop: 24 }}>
          <h2>No matches</h2>
          <p className="muted">Try a different word, or browse a category.</p>
          <div className="chips" style={{ justifyContent: "center", flexWrap: "wrap" }}>
            {categories.map((c) => (
              <Link key={c.id} href={`/shop/${c.slug}`} className="chip">{c.name}</Link>
            ))}
          </div>
        </div>
      )}

      {results.length > 0 && (
        <div className="grid grid-4">
          {results.map((p) => (
            <ProductCard key={p.id} product={p} category={catById.get(p.categoryId)} />
          ))}
        </div>
      )}

      {!query && (
        <div className="cat-list" style={{ maxWidth: 640 }}>
          {categories.map((c) => (
            <Link key={c.id} href={`/shop/${c.slug}`} className="cat-row">
              <span className="serif" style={{ fontSize: 28 }}>{c.name}</span>
              <span className="arrow" aria-hidden>→</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
