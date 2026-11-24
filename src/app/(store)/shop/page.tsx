import type { Metadata } from "next";
import { getCatalog } from "@/server/catalog";
import { Catalogue } from "@/components/Catalogue";

export const metadata: Metadata = { title: "Shop" };

export default async function ShopPage({ searchParams }: { searchParams: Promise<{ sort?: string }> }) {
  const { products, categories } = await getCatalog();
  const { sort } = await searchParams;
  return <Catalogue products={products} categories={categories} activeCategory={null} sort={sort} />;
}
