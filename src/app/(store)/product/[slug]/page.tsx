import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getCatalog } from "@/server/catalog";
import { store } from "@/server/store";
import { ProductCard } from "@/components/ProductCard";
import { ProductBuy } from "@/components/ProductBuy";
import { Gallery } from "@/components/Gallery";
import { describeCutoff } from "@/lib/delivery";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const p = await store.getProductBySlug(slug);
  if (!p) return { title: "Product" };
  return { title: p.name, description: p.description.slice(0, 160) };
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const { products, categories, settings } = await getCatalog();
  const product = products.find((p) => p.slug === slug);
  if (!product) notFound();
  const category = categories.find((c) => c.id === product.categoryId);
  const related = products
    .filter((p) => p.id !== product.id && p.categoryId === product.categoryId && p.available)
    .slice(0, 4);

  return (
    <>
      <div className="wrap">
        <nav className="crumbs" aria-label="Breadcrumb">
          <Link href="/shop">Shop</Link>
          <span aria-hidden>/</span>
          {category && (
            <>
              <Link href={`/shop/${category.slug}`}>{category.name}</Link>
              <span aria-hidden>/</span>
            </>
          )}
          <span style={{ color: "var(--ink)" }}>{product.name}</span>
        </nav>
        <div className="pdp">
          <Gallery images={product.images.length ? product.images : ["/placeholders/product-1.svg"]} alt={product.name} />
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
            {product.description && (
              <div>
                <p style={{ whiteSpace: "pre-line" }}>{product.description}</p>
              </div>
            )}
            <div className="spec">
              <div>
                <span>Delivery</span>
                <span>Mondays, Cape Town</span>
              </div>
              <div>
                <span>Order by</span>
                <span>{describeCutoff(settings.delivery.cutoffHours)}</span>
              </div>
              <div>
                <span>SKU</span>
                <span className="num">{product.sku}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {related.length > 0 && (
        <section className="section" style={{ borderTop: "1px solid var(--line)" }}>
          <div className="wrap">
            <div className="section-head">
              <h2>You may also like</h2>
            </div>
            <div className="rail">
              {related.map((p) => (
                <ProductCard key={p.id} product={p} category={category} />
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
