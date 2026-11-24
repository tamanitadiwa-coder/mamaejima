import type { Metadata, Viewport } from "next";
import "@fontsource/cormorant-garamond/500.css";
import "@fontsource/cormorant-garamond/600.css";
import "@fontsource/cormorant-garamond/500-italic.css";
import "@fontsource-variable/instrument-sans";
import "./globals.css";
import { asset } from "@/lib/paths";

export const metadata: Metadata = {
  title: { default: "Mama Ejima — Zimbabwean groceries in Cape Town", template: "%s · Mama Ejima" },
  description:
    "Zimbabwean favourites, traditional ingredients and everyday essentials. Delivered across Cape Town every Monday.",
  applicationName: "Mama Ejima",
  manifest: asset("/manifest.webmanifest"),
  appleWebApp: { capable: true, title: "Mama Ejima", statusBarStyle: "default" },
  formatDetection: { telephone: false },
  icons: {
    icon: [
      { url: asset("/icons/favicon-32.png"), sizes: "32x32", type: "image/png" },
      { url: asset("/icons/icon.svg"), type: "image/svg+xml" },
    ],
    apple: [{ url: asset("/icons/apple-touch-icon.png"), sizes: "180x180" }],
  },
};

export const viewport: Viewport = {
  themeColor: "#f6f1e8",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

// Marks <html> before first paint when opened from the Home Screen,
// so the branded splash shows only in the installed app.
const standaloneScript = `try{if(matchMedia('(display-mode: standalone)').matches||navigator.standalone===true){document.documentElement.classList.add('standalone')}}catch(e){}`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-ZA">
      <head>
        <script dangerouslySetInnerHTML={{ __html: standaloneScript }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
