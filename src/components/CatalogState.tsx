"use client";

import { useCatalog } from "./CatalogProvider";

/** Loading / unreachable / stale-data messaging shared by catalogue pages. */
export function CatalogState({ children }: { children: React.ReactNode }) {
  const { status, catalog, fromCache, error, reload } = useCatalog();

  if (status === "loading" && !catalog) {
    return (
      <div className="wrap" style={{ padding: "48px var(--gutter)" }} aria-busy="true">
        <div className="grid grid-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="card">
              <div className="card-media" />
              <div style={{ height: 14, width: "70%", background: "var(--sand)" }} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!catalog) {
    return (
      <div className="wrap empty">
        <p className="eyebrow">Store</p>
        <h2>We can’t reach the store right now</h2>
        <p className="muted" style={{ maxWidth: 420 }}>
          {error === "not_configured"
            ? "The shop is being set up. Please check back soon."
            : "Check your connection and try again. If you’re online, the shop may be briefly unavailable."}
        </p>
        <button className="btn btn-outline" onClick={reload}>Try again</button>
      </div>
    );
  }

  return (
    <>
      {fromCache && (
        <div className="notice notice-warn small" style={{ borderRadius: 0, borderLeft: 0, borderRight: 0, textAlign: "center" }}>
          Showing products saved on this device. Prices and stock are confirmed when you check out.
        </div>
      )}
      {children}
    </>
  );
}
