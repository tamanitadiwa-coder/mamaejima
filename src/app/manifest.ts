import type { MetadataRoute } from "next";
import { asset } from "@/lib/paths";

export const dynamic = "force-static";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: asset("/"),
    name: "Mama Ejima",
    short_name: "Mama Ejima",
    description: "Zimbabwean favourites, delivered across Cape Town every Monday.",
    start_url: asset("/?source=pwa"),
    scope: asset("/"),
    display: "standalone",
    orientation: "portrait",
    background_color: "#3b2a1e",
    theme_color: "#f6f1e8",
    lang: "en-ZA",
    categories: ["shopping", "food"],
    icons: [
      { src: asset("/icons/icon-192.png"), sizes: "192x192", type: "image/png", purpose: "any" },
      { src: asset("/icons/icon-512.png"), sizes: "512x512", type: "image/png", purpose: "any" },
      { src: asset("/icons/maskable-192.png"), sizes: "192x192", type: "image/png", purpose: "maskable" },
      { src: asset("/icons/maskable-512.png"), sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "Shop", url: asset("/shop"), icons: [{ src: asset("/icons/icon-192.png"), sizes: "192x192" }] },
      { name: "Basket", url: asset("/basket"), icons: [{ src: asset("/icons/icon-192.png"), sizes: "192x192" }] },
    ],
  };
}
