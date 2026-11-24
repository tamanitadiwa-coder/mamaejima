// Prefix for plain URLs (img src, form actions, service worker) when the site
// lives under a sub-path such as GitHub Pages' /mamaejima. next/link and the
// router add this automatically; raw strings don't.
export const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || "";

export function asset(path: string): string {
  if (!path || /^(https?:|data:|blob:)/.test(path)) return path;
  return BASE_PATH + (path.startsWith("/") ? path : "/" + path);
}
