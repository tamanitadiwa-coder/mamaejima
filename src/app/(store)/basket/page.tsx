"use client";

import { useCatalog } from "@/components/CatalogProvider";
import { BasketView } from "@/components/BasketView";
import { DEFAULT_DELIVERY } from "@/lib/defaults";

export default function BasketPage() {
  const { catalog } = useCatalog();
  return <BasketView delivery={catalog?.settings.delivery ?? DEFAULT_DELIVERY} />;
}
