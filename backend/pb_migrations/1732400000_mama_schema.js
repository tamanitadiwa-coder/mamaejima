/// <reference path="../pb_data/types.d.ts" />
// Mama Ejima schema: customers (users), categories, products, settings,
// addresses, carts, orders. Access rules are the security boundary:
//  - catalogue + settings: public read, superuser-only write
//  - addresses, carts, orders: owner-only read; orders created ONLY by the
//    server route (/api/mama/orders) which prices everything itself.

migrate(
  (app) => {
    const OWNER = "owner = @request.auth.id";
    const AUTHED_OWNER = "@request.auth.id != '' && @request.auth.collectionName = 'users' && owner = @request.auth.id";

    // ── users (customers) ──────────────────────────────────────
    const users = app.findCollectionByNameOrId("users");
    users.fields.add(new TextField({ name: "firstName", max: 60 }));
    users.fields.add(new TextField({ name: "surname", max: 60 }));
    users.fields.add(new TextField({ name: "phone", max: 20 }));
    users.listRule = "id = @request.auth.id";
    users.viewRule = "id = @request.auth.id";
    users.createRule = "";
    users.updateRule = "id = @request.auth.id";
    users.deleteRule = "id = @request.auth.id";
    app.save(users);

    // ── categories ─────────────────────────────────────────────
    const categories = new Collection({
      type: "base",
      name: "categories",
      listRule: "",
      viewRule: "",
      fields: [
        { type: "text", name: "name", required: true, max: 60 },
        { type: "text", name: "slug", required: true, max: 80, pattern: "^[a-z0-9-]+$" },
        { type: "text", name: "description", max: 300 },
        { type: "number", name: "sortOrder", onlyInt: true },
        { type: "autodate", name: "created", onCreate: true },
        { type: "autodate", name: "updated", onCreate: true, onUpdate: true },
      ],
      indexes: ["CREATE UNIQUE INDEX idx_categories_slug ON categories (slug)"],
    });
    app.save(categories);

    // ── products ───────────────────────────────────────────────
    const products = new Collection({
      type: "base",
      name: "products",
      listRule: "",
      viewRule: "",
      fields: [
        { type: "text", name: "name", required: true, max: 120 },
        { type: "text", name: "slug", required: true, max: 120, pattern: "^[a-z0-9-]+$" },
        { type: "text", name: "description", max: 4000 },
        { type: "relation", name: "category", collectionId: categories.id, maxSelect: 1, cascadeDelete: false },
        { type: "number", name: "priceCents", onlyInt: true, min: 0 },
        { type: "number", name: "stock", onlyInt: true },
        { type: "text", name: "sku", max: 60 },
        {
          type: "file",
          name: "images",
          maxSelect: 8,
          maxSize: 5 * 1024 * 1024,
          mimeTypes: ["image/jpeg", "image/png", "image/webp", "image/avif"],
          thumbs: ["400x500", "800x1000"],
        },
        { type: "bool", name: "available" },
        { type: "bool", name: "featured" },
        { type: "bool", name: "popular" },
        { type: "json", name: "variants", maxSize: 20000 },
        { type: "bool", name: "isPlaceholder" },
        { type: "autodate", name: "created", onCreate: true },
        { type: "autodate", name: "updated", onCreate: true, onUpdate: true },
      ],
      indexes: [
        "CREATE UNIQUE INDEX idx_products_slug ON products (slug)",
        "CREATE INDEX idx_products_category ON products (category)",
      ],
    });
    app.save(products);

    // ── settings (single record, key = 'store') ───────────────
    const settings = new Collection({
      type: "base",
      name: "settings",
      listRule: "",
      viewRule: "",
      fields: [
        { type: "text", name: "key", required: true, max: 20 },
        { type: "text", name: "storeName", max: 60 },
        { type: "text", name: "whatsappNumber", max: 20, pattern: "^[0-9]*$" },
        { type: "text", name: "contactEmail", max: 120 },
        { type: "text", name: "contactPhone", max: 30 },
        { type: "text", name: "announcement", max: 200 },
        { type: "bool", name: "announcementActive" },
        {
          type: "file",
          name: "heroImage",
          maxSelect: 1,
          maxSize: 8 * 1024 * 1024,
          mimeTypes: ["image/jpeg", "image/png", "image/webp", "image/avif"],
          thumbs: ["800x1000", "1600x1200"],
        },
        { type: "number", name: "deliveryFeeCents", onlyInt: true, min: 0 },
        { type: "number", name: "freeOverCents", onlyInt: true, min: 0 },
        { type: "number", name: "cutoffHours", onlyInt: true, min: 0, max: 168 },
        { type: "number", name: "horizonWeeks", onlyInt: true, min: 1, max: 26 },
        { type: "json", name: "blockedDates", maxSize: 20000 },
        { type: "json", name: "regions", maxSize: 50000 },
        { type: "text", name: "city", max: 60 },
        { type: "text", name: "province", max: 60 },
        { type: "autodate", name: "updated", onCreate: true, onUpdate: true },
      ],
      indexes: ["CREATE UNIQUE INDEX idx_settings_key ON settings (key)"],
    });
    app.save(settings);

    // ── addresses (saved delivery addresses, owner only) ──────
    const addresses = new Collection({
      type: "base",
      name: "addresses",
      listRule: OWNER,
      viewRule: OWNER,
      createRule: AUTHED_OWNER,
      updateRule: OWNER + " && (@request.body.owner:isset = false || @request.body.owner = @request.auth.id)",
      deleteRule: OWNER,
      fields: [
        { type: "relation", name: "owner", collectionId: users.id, maxSelect: 1, required: true, cascadeDelete: true },
        { type: "text", name: "label", max: 40 },
        { type: "text", name: "street", required: true, max: 120 },
        { type: "text", name: "building", max: 80 },
        { type: "text", name: "suburb", required: true, max: 60 },
        { type: "text", name: "instructions", max: 300 },
        { type: "bool", name: "isDefault" },
        { type: "autodate", name: "created", onCreate: true },
        { type: "autodate", name: "updated", onCreate: true, onUpdate: true },
      ],
      indexes: ["CREATE INDEX idx_addresses_owner ON addresses (owner)"],
    });
    app.save(addresses);

    // ── carts (one saved basket per customer, owner only) ─────
    const carts = new Collection({
      type: "base",
      name: "carts",
      listRule: OWNER,
      viewRule: OWNER,
      createRule: AUTHED_OWNER,
      updateRule: OWNER + " && (@request.body.owner:isset = false || @request.body.owner = @request.auth.id)",
      deleteRule: OWNER,
      fields: [
        { type: "relation", name: "owner", collectionId: users.id, maxSelect: 1, required: true, cascadeDelete: true },
        { type: "json", name: "items", maxSize: 50000 },
        { type: "autodate", name: "updated", onCreate: true, onUpdate: true },
      ],
      indexes: ["CREATE UNIQUE INDEX idx_carts_owner ON carts (owner)"],
    });
    app.save(carts);

    // ── orders (read-only to their owner) ─────────────────────
    const orders = new Collection({
      type: "base",
      name: "orders",
      listRule: OWNER,
      viewRule: OWNER,
      createRule: null,
      updateRule: null,
      deleteRule: null,
      fields: [
        { type: "relation", name: "owner", collectionId: users.id, maxSelect: 1, required: true, cascadeDelete: false },
        { type: "text", name: "checkoutId", required: true, max: 40 },
        { type: "text", name: "reference", required: true, max: 20 },
        {
          type: "select",
          name: "status",
          required: true,
          maxSelect: 1,
          values: ["awaiting_whatsapp", "confirmed", "preparing", "ready", "out_for_delivery", "delivered", "cancelled"],
        },
        { type: "json", name: "customer", maxSize: 5000 },
        { type: "json", name: "address", maxSize: 5000 },
        { type: "text", name: "deliveryDate", required: true, max: 10 },
        { type: "json", name: "lines", maxSize: 100000 },
        { type: "number", name: "subtotalCents", onlyInt: true },
        { type: "number", name: "deliveryFeeCents", onlyInt: true },
        { type: "number", name: "totalCents", onlyInt: true },
        { type: "text", name: "whatsappMessage", max: 20000 },
        { type: "bool", name: "stockReleased" },
        { type: "json", name: "statusHistory", maxSize: 20000 },
        { type: "autodate", name: "created", onCreate: true },
        { type: "autodate", name: "updated", onCreate: true, onUpdate: true },
      ],
      indexes: [
        "CREATE UNIQUE INDEX idx_orders_checkout ON orders (checkoutId)",
        "CREATE UNIQUE INDEX idx_orders_reference ON orders (reference)",
        "CREATE INDEX idx_orders_owner ON orders (owner)",
        "CREATE INDEX idx_orders_status ON orders (status)",
        "CREATE INDEX idx_orders_delivery ON orders (deliveryDate)",
      ],
    });
    app.save(orders);
  },
  (app) => {
    for (const n of ["orders", "carts", "addresses", "settings", "products", "categories"]) {
      try {
        app.delete(app.findCollectionByNameOrId(n));
      } catch (_) {}
    }
  },
);
