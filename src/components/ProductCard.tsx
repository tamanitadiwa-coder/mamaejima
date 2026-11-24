import Link from "next/link";
import type { Category, Product } from "@/lib/types";
import { formatZAR } from "@/lib/money";
import { fromPrice, isInStock } from "@/lib/product";

export function ProductCard({ product, category, priority }: { product: Product; category?: Category; priority?: boolean }) {
  const price = fromPrice(product);
  const inStock = isInStock(product);
  const img = product.images[0] ?? "/placeholders/product-1.svg";
  return (
    <Link href={`/product/${product.slug}`} className="card">
      <div className="card-media">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={img} alt={product.name} loading={priority ? "eager" : "lazy"} decoding="async" />
        {!inStock && <span className="tag card-badge">{product.available ? "Sold out" : "Unavailable"}</span>}
        {inStock && product.isPlaceholder && <span className="tag card-badge">Sample</span>}
      </div>
      <div>
        {category && <p className="card-cat">{category.name}</p>}
        <div className="card-meta">
          <span className="card-name">{product.name}</span>
        </div>
        <p className="price small" style={{ marginTop: 4 }}>
          {price.from ? "From " : ""}
          {formatZAR(price.cents)}
        </p>
      </div>
    </Link>
  );
}
