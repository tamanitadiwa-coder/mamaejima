import type { Metadata } from "next";
import { store } from "@/server/store";
import { BasketView } from "@/components/BasketView";

export const metadata: Metadata = { title: "Basket" };

export default async function BasketPage() {
  const settings = await store.getSettings();
  return <BasketView delivery={settings.delivery} />;
}
