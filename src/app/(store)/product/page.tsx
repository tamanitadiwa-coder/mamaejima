"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCatalog } from "@/components/CatalogProvider";
import { CatalogState } from "@/components/CatalogState";
import { ProductCard } from "@/components/ProductCard";
import { ProductBuy } from "@/components/ProductBuy";
import { Gallery } from "@/components/Gallery";
import { describeCutoff } from "@/lib/delivery";
import { categoryHref, productImages } from "@/lib/product";
import { asset } from "@/lib/paths";

function ProductInner() {
  const slug = useSearchParams().get("s") ?? "";
  const { catalog } = useCatalog();
  if (!catalog) return null;
  const product = catalog.products.find((p) => p.slug === slug);
  if (!product) {
    return (
      <div className="wrap empty">
        <h1>Product not found</h1>
        <p className="muted">It may have been removed or renamed.</p>
        <Link href="/shop/" className="btn">Back to the shop</Link>
      </div>
    );
  }
  const category = catalog.categories.find((c) => c.id === product.categoryId);
  const related = catalog.products
    .filter((p) => p.id !== product.id && p.categoryId === product.categoryId && p.available)
    .slice(0, 4);

  return (
    <>
      <title>{`${product.name} · Mama Ejima`}</title>
      <div className="wrap">
        <nav className="crumbs" aria-label="Breadcrumb">
          <Link href="/shop/">Shop</Link>
          <span aria-hidden>/</span>
          {category && (
            <>
              <Link href={categoryHref(category.slug)}>{category.name}</Link>
              <span aria-hidden>/</span>
            </>
          )}
          <span style={{ color: "var(--ink)" }}>{product.name}</span>
        </nav>
        <div className="pdp">
          <Gallery images={productImages(product).map(asset)} alt={product.name} />
          <div className="pdp-info stack" style={{ ["--s" as string]: "22px" }}>
            <div>
              {category && <p className="eyebrow">{category.name}</p>}
              <h1 style={{ marginTop: 10, fontSize: "clamp(36px, 5vw, 54px)" }}>{product.name}</h1>
              {product.isPlaceholder && (
                <p className="notice notice-warn small" style={{ marginTop: 14 }}>
                  Sample product. The real range is being added.
                </p>
              )}
            </div>
            <ProductBuy product={product} />
            {product.description && <p style={{ whiteSpace: "pre-line" }}>{product.description}</p>}
            <div className="spec">
              <div><span>Delivery</span><span>Mondays, Cape Town</span></div>
              <div><span>Order by</span><span>{describeCutoff(catalog.settings.delivery.cutoffHours)}</span></div>
              {product.sku && <div><span>SKU</span><span className="num">{product.sku}</span></div>}
            </div>
          </div>
        </div>
      </div>
      {related.length > 0 && (
        <section className="section" style={{ borderTop: "1px solid var(--line)" }}>
          <div className="wrap">
            <div className="section-head"><h2>You may also like</h2></div>
            <div className="rail">
              {related.map((p) => <ProductCard key={p.id} product={p} category={category} />)}
            </div>
          </div>
        </section>
      )}
    </>
  );
}

export default function ProductPage() {
  return (
    <CatalogState>
      <Suspense>
        <ProductInner />
      </Suspense>
    </CatalogState>
  );
}
