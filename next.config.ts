import type { NextConfig } from "next";

// Static export: the storefront is plain files, hosted free (GitHub Pages /
// Cloudflare Pages). All data comes from PocketBase in the browser.
// NEXT_PUBLIC_BASE_PATH is "/mamaejima" on GitHub Pages, "" on a custom domain.
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

const nextConfig: NextConfig = {
  output: "export",
  basePath,
  trailingSlash: true,
  reactStrictMode: true,
  images: { unoptimized: true },
};

export default nextConfig;
