/// <reference path="../pb_data/types.d.ts" />
// PLACEHOLDER DATA ONLY — not real Mama Ejima products or prices.
// Replace from the admin dashboard. Sample prices exist so checkout can be tested.

const CAPE_TOWN_SUBURBS = [
  "Athlone", "Bellville", "Belhar", "Bergvliet", "Bishopscourt", "Bloubergstrand", "Bo-Kaap",
  "Bothasig", "Brackenfell", "Camps Bay", "Cape Town CBD", "Century City", "Claremont",
  "Constantia", "Delft", "Diep River", "Durbanville", "Edgemead", "Elsies River", "Epping",
  "Fish Hoek", "Gardens", "Goodwood", "Green Point", "Gugulethu", "Hout Bay", "Kenilworth",
  "Khayelitsha", "Kraaifontein", "Kuils River", "Langa", "Lansdowne", "Maitland", "Milnerton",
  "Mitchells Plain", "Mowbray", "Muizenberg", "Newlands", "Observatory", "Oranjezicht",
  "Parklands", "Parow", "Pinelands", "Plumstead", "Rondebosch", "Rosebank", "Salt River",
  "Sea Point", "Table View", "Tamboerskloof", "Thornton", "Tokai", "Vredehoek", "Woodstock",
  "Wynberg", "Zonnebloem",
];

migrate(
  (app) => {
    // App settings: name, rate limits (protects login + ordering).
    const s = app.settings();
    s.meta.appName = "Mama Ejima";
    s.rateLimits.enabled = true;
    s.rateLimits.rules = [
      { label: "*:auth", maxRequests: 5, duration: 60, audience: "" },
      { label: "*:create", maxRequests: 30, duration: 60, audience: "" },
      { label: "/api/mama/orders", maxRequests: 10, duration: 600, audience: "" },
      { label: "/api/mama/basket/validate", maxRequests: 60, duration: 60, audience: "" },
      { label: "/api/", maxRequests: 300, duration: 10, audience: "" },
    ];
    app.save(s);

    const settings = new Record(app.findCollectionByNameOrId("settings"));
    settings.load({
      key: "store",
      storeName: "Mama Ejima",
      whatsappNumber: "", // Not invented — set in Admin → Settings
      contactEmail: "",
      contactPhone: "",
      announcement: "",
      announcementActive: false,
      deliveryFeeCents: 5000, // PLACEHOLDER — set your real fee in Admin → Delivery
      freeOverCents: 0, // 0 = no free-delivery threshold
      cutoffHours: 36, // orders for a Monday close Saturday 12:00
      horizonWeeks: 8,
      blockedDates: [],
      regions: CAPE_TOWN_SUBURBS,
      city: "Cape Town",
      province: "Western Cape",
    });
    app.save(settings);

    const catCol = app.findCollectionByNameOrId("categories");
    const cats = {};
    [
      ["pantry", "Pantry", "Everyday staples."],
      ["flours-grains", "Flours & Grains", "Meal, flour and grains."],
      ["sauces-spices", "Sauces & Spices", "Flavour for the pot."],
      ["snacks", "Snacks & Treats", "Something small."],
      ["drinks", "Drinks", "Cold and hot."],
      ["household", "Household", "Home essentials."],
    ].forEach(([slug, name, description], i) => {
      const r = new Record(catCol);
      r.load({ slug, name, description, sortOrder: i + 1 });
      app.save(r);
      cats[slug] = r.id;
    });

    const prodCol = app.findCollectionByNameOrId("products");
    const sample = (n, cat, price, extra) => {
      const code = String(n).padStart(2, "0");
      const r = new Record(prodCol);
      r.load(
        Object.assign(
          {
            name: "Sample product " + code,
            slug: "sample-product-" + code,
            description:
              "Placeholder product. Replace the name, photograph, description and price from the admin dashboard.",
            category: cats[cat],
            priceCents: price,
            stock: 25,
            sku: "ME-SAMPLE-" + code,
            available: true,
            featured: false,
            popular: false,
            variants: [],
            isPlaceholder: true,
          },
          extra || {},
        ),
      );
      app.save(r);
    };
    sample(1, "flours-grains", 8500, {
      featured: true,
      variants: [
        { id: "v1", name: "Small (sample)", priceCents: 8500, stock: 20, sku: "ME-SAMPLE-01-S" },
        { id: "v2", name: "Large (sample)", priceCents: 15500, stock: 10, sku: "ME-SAMPLE-01-L" },
      ],
    });
    sample(2, "pantry", 4500, { featured: true });
    sample(3, "sauces-spices", 3500, { featured: true, popular: true });
    sample(4, "snacks", 2500, { featured: true, popular: true });
    sample(5, "drinks", 3000, { popular: true });
    sample(6, "pantry", 6000, { popular: true });
    sample(7, "household", 5500);
    sample(8, "flours-grains", 9500, { stock: 0 });
    sample(9, "snacks", 2000);
    sample(10, "sauces-spices", 4000, { available: false });
    sample(11, "drinks", 4500);
    sample(12, "pantry", 7000, { popular: true });
  },
  (app) => {
    for (const n of ["products", "categories", "settings"]) {
      const recs = app.findAllRecords(n);
      for (const r of recs) app.delete(r);
    }
  },
);
