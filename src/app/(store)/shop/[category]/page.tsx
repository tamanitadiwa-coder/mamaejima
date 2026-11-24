import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCatalog } from "@/server/catalog";
import { Catalogue } from "@/components/Catalogue";
import { store } from "@/server/store";

type Props = { params: Promise<{ category: string }>; searchParams: Promise<{ sort?: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { category } = await params;
  const cats = await store.listCategories();
  const c = cats.find((x) => x.slug === category);
  return { title: c?.name ?? "Shop" };
}

export default async function CategoryPage({ params, searchParams }: Props) {
  const { category } = await params;
  const { sort } = await searchParams;
  const { products, categories } = await getCatalog();
  const cat = categories.find((c) => c.slug === category);
  if (!cat) notFound();
  return (
    <Catalogue
      products={products.filter((p) => p.categoryId === cat.id)}
      categories={categories}
      activeCategory={cat}
      sort={sort}
    />
  );
}
