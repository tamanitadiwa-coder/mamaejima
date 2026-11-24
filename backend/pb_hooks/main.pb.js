/// <reference path="../pb_data/types.d.ts" />
// Mama Ejima custom API routes and record hooks.
// Each handler runs in its own JS context, so shared code is require()d inside.

// ── Re-price a basket (read-only, nothing reserved) ─────────────
routerAdd("POST", "/api/mama/basket/validate", (e) => {
  const m = require(`${__hooks}/mama.js`);
  const body = e.requestInfo().body || {};
  const settings = m.loadSettings($app);
  const items = m.parseItems(body.items);
  const cache = {};
  const get = (id) => {
    if (!(id in cache)) {
      try { cache[id] = $app.findRecordById("products", id); } catch (_) { cache[id] = null; }
    }
    return cache[id];
  };
  const priced = m.priceItems(items, get, settings);
  const snapshots = items.map((it) => {
    const p = get(it.productId);
    if (!p) return null;
    const variants = m.jsonArray(p, "variants");
    const v = it.variantId ? variants.find((x) => x.id === it.variantId) : null;
    const images = p.get("images") || [];
    return {
      productId: p.id,
      variantId: it.variantId,
      name: p.getString("name"),
      variantName: v ? v.name : null,
      priceCents: v ? v.priceCents : p.getInt("priceCents"),
      image: images.length ? images[0] : null,
      slug: p.getString("slug"),
    };
  });
  return e.json(200, Object.assign(priced, { snapshots, checkedAt: new Date().toISOString() }));
});

// ── Place an order (signed-in customers only) ───────────────────
// The browser sends ids + quantities. Prices, stock, fee, totals and the
// WhatsApp message are computed here. Same checkoutId → same order (no duplicates).
routerAdd(
  "POST",
  "/api/mama/orders",
  (e) => {
    const m = require(`${__hooks}/mama.js`);
    const user = e.auth;
    if (!user || user.collection().name !== "users") throw new ForbiddenError("Please sign in to order.");
    const b = e.requestInfo().body || {};

    const checkoutId = typeof b.checkoutId === "string" ? b.checkoutId : "";
    if (!m.UUID_RE.test(checkoutId)) throw new BadRequestError("Invalid checkout session.");

    // Retry of an order already saved?
    try {
      const existing = $app.findFirstRecordByFilter("orders", "checkoutId = {:c}", { c: checkoutId });
      if (existing.getString("owner") !== user.id) throw new BadRequestError("Invalid checkout session.");
      return e.json(200, { order: m.exportOrder(existing), existing: true, whatsappNumber: m.loadSettings($app).whatsappNumber });
    } catch (err) {
      if (err instanceof BadRequestError) throw err; // not found → continue
    }

    const c = b.customer || {};
    const a = b.address || {};
    const customer = {
      firstName: m.clean(c.firstName, 60),
      surname: m.clean(c.surname, 60),
      phone: m.clean(c.phone, 30),
      email: m.clean(c.email, 120).toLowerCase() || user.getString("email"),
    };
    const address = {
      street: m.clean(a.street, 120),
      building: m.clean(a.building, 80),
      suburb: m.clean(a.suburb, 60),
      instructions: m.clean(a.instructions, 300),
    };
    const deliveryDate = m.clean(b.deliveryDate, 10);
    const items = m.parseItems(b.items);

    // Business-rule failures return a JSON body with a `code` the app understands.
    let result = null;
    let fail = null;
    const reject = (status, message, extra) => {
      fail = { status, body: Object.assign({ message, status }, extra) };
      throw new Error("mama:reject"); // rolls back the transaction
    };
    try {
    $app.runInTransaction((tx) => {
      const settings = m.loadSettings(tx);
      if (!settings.whatsappNumber)
        reject(503, "Online ordering isn't open yet. Please contact the store directly.", { code: "not_configured" });
      if (items.length === 0) reject(400, "Your basket is empty.", { code: "empty" });

      const ce = m.validateCustomer(customer);
      const ae = m.validateAddress(address, settings);
      if (m.hasErrors(ce) || m.hasErrors(ae))
        reject(422, "Please check your details.", { code: "invalid_details", customer: ce, address: ae });

      if (!m.isDeliverableDate(deliveryDate, settings))
        reject(422, "That delivery Monday is no longer available. Please choose another Monday.", { code: "invalid_date" });

      const products = {};
      const get = (id) => {
        if (!(id in products)) {
          try { products[id] = tx.findRecordById("products", id); } catch (_) { products[id] = null; }
        }
        return products[id];
      };
      const priced = m.priceItems(items, get, settings);
      if (priced.issues.length) reject(409, "Some items in your basket have changed.", { code: "pricing", issues: priced.issues });

      // Reserve stock
      for (const l of priced.lines) {
        const p = products[l.productId];
        if (l.variantId) {
          const vs = m.jsonArray(p, "variants");
          for (const v of vs) if (v.id === l.variantId) v.stock = (Number(v.stock) || 0) - l.quantity;
          p.set("variants", vs);
        } else {
          p.set("stock", p.getInt("stock") - l.quantity);
        }
        tx.save(p);
      }

      let reference = m.newReference();
      for (let i = 0; i < 5; i++) {
        let taken = true;
        try { tx.findFirstRecordByFilter("orders", "reference = {:r}", { r: reference }); } catch (_) { taken = false; }
        if (!taken) break;
        reference = m.newReference();
      }

      const lines = priced.lines.map((l) => {
        const o = Object.assign({}, l);
        delete o.available;
        return o;
      });
      const now = new Date().toISOString();
      const data = {
        reference,
        customer: Object.assign({}, customer, { phone: m.normalisePhone(customer.phone) }),
        address: Object.assign({}, address, { suburb: m.canonicalSuburb(address.suburb, settings) }),
        deliveryDate,
        lines,
        subtotalCents: priced.subtotalCents,
        deliveryFeeCents: priced.deliveryFeeCents,
        totalCents: priced.totalCents,
      };
      const msg = m.buildMessage(data, settings.storeName);
      const rec = new Record(tx.findCollectionByNameOrId("orders"));
      rec.load(
        Object.assign(data, {
          owner: user.id,
          checkoutId,
          status: "awaiting_whatsapp",
          whatsappMessage: msg,
          stockReleased: false,
          statusHistory: [{ status: "awaiting_whatsapp", at: now }],
        }),
      );
      tx.save(rec);

      // Empty the customer's saved basket
      try {
        const cart = tx.findFirstRecordByFilter("carts", "owner = {:o}", { o: user.id });
        cart.set("items", []);
        tx.save(cart);
      } catch (_) {}

      result = { order: m.exportOrder(rec), existing: false, whatsappNumber: settings.whatsappNumber };
    });
    } catch (err) {
      if (fail) return e.json(fail.status, fail.body);
      throw err;
    }
    return e.json(201, result);
  },
  $apis.requireAuth("users"),
);

// ── Admin: change order status (releases stock on cancel) ───────
routerAdd(
  "POST",
  "/api/mama/admin/orders/{id}/status",
  (e) => {
    const m = require(`${__hooks}/mama.js`);
    const id = e.request.pathValue("id");
    const status = String((e.requestInfo().body || {}).status || "");
    if (m.STATUSES.indexOf(status) < 0) throw new BadRequestError("Unknown status.");
    let out = null;
    $app.runInTransaction((tx) => {
      const o = tx.findRecordById("orders", id);
      if (o.getString("status") === status) {
        out = m.exportOrder(o);
        return;
      }
      if (o.getString("status") === "cancelled") throw new BadRequestError("Cancelled orders can't be reopened.");
      const now = new Date().toISOString();
      if (status === "cancelled" && !o.getBool("stockReleased")) {
        for (const l of m.jsonArray(o, "lines")) {
          let p;
          try { p = tx.findRecordById("products", l.productId); } catch (_) { continue; }
          if (l.variantId) {
            const vs = m.jsonArray(p, "variants");
            for (const v of vs) if (v.id === l.variantId) v.stock = (Number(v.stock) || 0) + l.quantity;
            p.set("variants", vs);
          } else p.set("stock", p.getInt("stock") + l.quantity);
          tx.save(p);
        }
        o.set("stockReleased", true);
      }
      const hist = m.jsonArray(o, "statusHistory");
      hist.push({ status, at: now });
      o.set("statusHistory", hist);
      o.set("status", status);
      tx.save(o);
      out = m.exportOrder(o);
    });
    return e.json(200, { order: out });
  },
  $apis.requireSuperuserAuth(),
);

// ── Customer profile: normalise phone on save ───────────────────
onRecordCreateRequest((e) => {
  const m = require(`${__hooks}/mama.js`);
  const phone = e.record.getString("phone");
  if (phone) {
    const n = m.normalisePhone(phone);
    if (!n) throw new BadRequestError("Enter a valid mobile number.", { phone: { code: "invalid", message: "Enter a valid mobile number." } });
    e.record.set("phone", n);
  }
  e.next();
}, "users");

onRecordUpdateRequest((e) => {
  const m = require(`${__hooks}/mama.js`);
  const phone = e.record.getString("phone");
  if (phone) {
    const n = m.normalisePhone(phone);
    if (!n) throw new BadRequestError("Enter a valid mobile number.");
    e.record.set("phone", n);
  }
  e.next();
}, "users");

// ── Saved addresses must be inside the delivery area ───────────
onRecordCreateRequest((e) => require(`${__hooks}/mama.js`).checkAddress(e), "addresses");
onRecordUpdateRequest((e) => require(`${__hooks}/mama.js`).checkAddress(e), "addresses");

// ── Saved basket: keep it small and well-formed ─────────────────
onRecordCreateRequest((e) => require(`${__hooks}/mama.js`).checkCart(e), "carts");
onRecordUpdateRequest((e) => require(`${__hooks}/mama.js`).checkCart(e), "carts");
