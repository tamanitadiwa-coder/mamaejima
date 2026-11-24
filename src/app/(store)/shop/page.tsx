"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useCatalog } from "@/components/CatalogProvider";
import { CatalogState } from "@/components/CatalogState";
import { Catalogue } from "@/components/Catalogue";

function ShopInner() {
  const params = useSearchParams();
  const c = params.get("c");
  const sort = params.get("sort") ?? undefined;
  const { catalog } = useCatalog();
  if (!catalog) return null;
  const cat = c ? catalog.categories.find((x) => x.slug === c) ?? null : null;
  const products = cat ? catalog.products.filter((p) => p.categoryId === cat.id) : catalog.products;
  return <Catalogue products={products} categories={catalog.categories} activeCategory={cat} sort={sort} unknownCategory={!!c && !cat} />;
}

export default function ShopPage() {
  return (
    <CatalogState>
      <Suspense>
        <ShopInner />
      </Suspense>
    </CatalogState>
  );
}
