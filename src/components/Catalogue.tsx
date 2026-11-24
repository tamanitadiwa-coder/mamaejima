"use client";

import Link from "next/link";
import type { Category, Product } from "@/lib/types";
import { ProductCard } from "./ProductCard";
import { categoryHref, fromPrice, isInStock } from "@/lib/product";
import { SearchIcon } from "./Icons";

const SORTS = [
  { v: "", label: "Featured" },
  { v: "price-asc", label: "Price: low to high" },
  { v: "price-desc", label: "Price: high to low" },
  { v: "name", label: "A–Z" },
];

function sortProducts(list: Product[], sort?: string) {
  const s = [...list];
  if (sort === "price-asc") s.sort((a, b) => fromPrice(a).cents - fromPrice(b).cents);
  else if (sort === "price-desc") s.sort((a, b) => fromPrice(b).cents - fromPrice(a).cents);
  else if (sort === "name") s.sort((a, b) => a.name.localeCompare(b.name));
  else
    s.sort(
      (a, b) =>
        Number(isInStock(b)) - Number(isInStock(a)) ||
        Number(b.featured) - Number(a.featured) ||
        a.name.localeCompare(b.name),
    );
  return s;
}

export function Catalogue({
  products,
  categories,
  activeCategory,
  sort,
  unknownCategory,
}: {
  products: Product[];
  categories: Category[];
  activeCategory: Category | null;
  sort?: string;
  unknownCategory?: boolean;
}) {
  const catById = new Map(categories.map((c) => [c.id, c]));
  const list = sortProducts(products, sort);
  const base = activeCategory ? categoryHref(activeCategory.slug) : "/shop/";

  return (
    <div className="wrap">
      <div className="page-head" style={{ marginBottom: 24 }}>
        <p className="eyebrow">{activeCategory ? "Category" : "Shop"}</p>
        <h1 style={{ marginTop: 10 }}>{activeCategory?.name ?? "All products"}</h1>
        {activeCategory?.description && (
          <p className="muted" style={{ marginTop: 12 }}>
            {activeCategory.description}
          </p>
        )}
      </div>

      <form action={`${process.env.NEXT_PUBLIC_BASE_PATH || ""}/search/`} className="row" style={{ marginBottom: 16, gap: 0 }} role="search">
        <label htmlFor="shop-q" className="sr-only">
          Search products
        </label>
        <input id="shop-q" name="q" className="input" placeholder="Search products" style={{ borderRight: 0 }} />
        <button className="btn" aria-label="Search" style={{ padding: "0 18px" }}>
          <SearchIcon />
        </button>
      </form>

      <nav className="chips" aria-label="Categories" style={{ marginBottom: 20 }}>
        <Link href="/shop/" className="chip" aria-current={!activeCategory ? "page" : undefined}>
          All
        </Link>
        {categories.map((c) => (
          <Link
            key={c.id}
            href={categoryHref(c.slug)}
            className="chip"
            aria-current={activeCategory?.id === c.id ? "page" : undefined}
          >
            {c.name}
          </Link>
        ))}
      </nav>

      <div className="row between" style={{ marginBottom: 24, fontSize: 13 }}>
        <span className="muted">
          {list.length} {list.length === 1 ? "product" : "products"}
        </span>
        <SortSelect base={base} sort={sort} />
      </div>

      {unknownCategory && (
        <p className="notice notice-warn small" style={{ marginBottom: 20 }}>That category no longer exists. Showing everything.</p>
      )}
      {list.length === 0 ? (
        <div className="empty">
          <h2>Nothing here yet</h2>
          <p className="muted">New products are added regularly.</p>
          <Link href="/shop/" className="btn btn-outline">
            See all products
          </Link>
        </div>
      ) : (
        <div className="grid grid-4" style={{ paddingBottom: 96 }}>
          {list.map((p, i) => (
            <ProductCard key={p.id} product={p} category={catById.get(p.categoryId)} priority={i < 4} />
          ))}
        </div>
      )}
    </div>
  );
}

function SortSelect({ base, sort }: { base: string; sort?: string }) {
  // Links rather than JS: works offline from cache and without hydration.
  return (
    <span className="row" style={{ gap: 6, flexWrap: "wrap", justifyContent: "flex-end" }} aria-label="Sort">
      {SORTS.map((s) => (
        <Link
          key={s.v}
          href={s.v ? `${base}${base.includes("?") ? "&" : "?"}sort=${s.v}` : base}
          style={{
            borderBottom: (sort ?? "") === s.v ? "1px solid var(--ink)" : "1px solid transparent",
            color: (sort ?? "") === s.v ? "var(--ink)" : "var(--muted)",
            padding: "4px 0",
            marginLeft: 8,
          }}
          scroll={false}
        >
          {s.label}
        </Link>
      ))}
    </span>
  );
}
