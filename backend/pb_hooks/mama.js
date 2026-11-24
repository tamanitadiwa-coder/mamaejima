// Mama Ejima — server-side business rules (runs inside PocketBase's JS engine).
// Mirrors src/lib/{delivery,validation,whatsapp}.ts on the frontend. The browser
// copies are for instant feedback only; THESE are the ones that decide.
// Note: PocketBase's JS engine has no Intl, so formatting is done by hand.

const SAST_OFFSET_MS = 2 * 60 * 60 * 1000; // South Africa: UTC+2, no DST
const DAY = 86400000;

// ── Dates ─────────────────────────────────────────────────────
function todaySAST(now) {
  return new Date((now || new Date()).getTime() + SAST_OFFSET_MS).toISOString().slice(0, 10);
}
function parseISODate(iso) {
  if (typeof iso !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return null;
  const d = new Date(iso + "T00:00:00Z");
  if (isNaN(d.getTime()) || d.toISOString().slice(0, 10) !== iso) return null;
  return d;
}
function isMonday(iso) {
  const d = parseISODate(iso);
  return !!d && d.getUTCDay() === 1;
}
function cutoffFor(iso, cutoffHours) {
  return parseISODate(iso).getTime() - SAST_OFFSET_MS - cutoffHours * 3600000;
}
function mondayState(iso, s, now) {
  now = now || new Date();
  if (now.getTime() >= cutoffFor(iso, s.cutoffHours)) return "closed";
  const days = (parseISODate(iso).getTime() - parseISODate(todaySAST(now)).getTime()) / DAY;
  if (days > s.horizonWeeks * 7) return "beyond";
  if ((s.blockedDates || []).indexOf(iso) >= 0) return "blocked";
  return "available";
}
function isDeliverableDate(iso, s, now) {
  return isMonday(iso) && mondayState(iso, s, now) === "available";
}
const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
function formatDeliveryDate(iso) {
  const d = parseISODate(iso);
  if (!d) return iso;
  return DAYS[d.getUTCDay()] + ", " + d.getUTCDate() + " " + MONTHS[d.getUTCMonth()] + " " + d.getUTCFullYear();
}

// ── Money ─────────────────────────────────────────────────────
function plainZAR(cents) {
  return "R" + (cents / 100).toFixed(2);
}
function deliveryFeeFor(subtotal, s) {
  if (subtotal <= 0) return 0;
  if (s.freeOverCents > 0 && subtotal >= s.freeOverCents) return 0;
  return s.deliveryFeeCents;
}

// ── Validation ────────────────────────────────────────────────
function clean(v, max) {
  return typeof v === "string" ? v.trim().replace(/\s+/g, " ").slice(0, max || 300) : "";
}
function normalisePhone(input) {
  const digits = String(input || "").replace(/[^\d+]/g, "");
  let n = digits.replace(/^\+/, "");
  if (/^0\d{9}$/.test(n)) n = "27" + n.slice(1);
  if (/^27[6-8]\d{8}$/.test(n)) return n;
  if (/^\+\d{9,15}$/.test(digits)) return digits.slice(1);
  if (/^00\d{9,15}$/.test(digits)) return digits.slice(2);
  return null;
}
function formatPhone(n) {
  if (/^27\d{9}$/.test(n)) return "+27 " + n.slice(2, 4) + " " + n.slice(4, 7) + " " + n.slice(7);
  return "+" + n;
}
const NAME_RE = /^[A-Za-zÀ-ÖØ-öø-ÿ][A-Za-zÀ-ÖØ-öø-ÿ' .-]{0,59}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function normSuburb(v) {
  return String(v || "").trim().replace(/\s+/g, " ").toLowerCase();
}
function canonicalSuburb(suburb, s) {
  const n = normSuburb(suburb);
  for (let i = 0; i < s.regions.length; i++) if (normSuburb(s.regions[i]) === n) return s.regions[i];
  return null;
}

function validateCustomer(c) {
  const e = {};
  if (!c.firstName) e.firstName = "Please enter your first name.";
  else if (!NAME_RE.test(c.firstName)) e.firstName = "Please use letters only.";
  if (!c.surname) e.surname = "Please enter your surname.";
  else if (!NAME_RE.test(c.surname)) e.surname = "Please use letters only.";
  if (!c.phone) e.phone = "We need a number to confirm your order on WhatsApp.";
  else if (!normalisePhone(c.phone)) e.phone = "Enter a valid mobile number, e.g. 082 123 4567 or +263 77 123 4567.";
  if (c.email && !EMAIL_RE.test(c.email)) e.email = "That email address doesn't look right.";
  return e;
}
function validateAddress(a, s) {
  const e = {};
  if (!a.street) e.street = "Please enter your street address.";
  else if (a.street.length < 5 || !/\d/.test(a.street) || !/[a-z]/i.test(a.street))
    e.street = "Include your house or unit number and street name.";
  if (!a.suburb) e.suburb = "Please choose your suburb.";
  else if (!canonicalSuburb(a.suburb, s))
    e.suburb = "We don't deliver to " + a.suburb + " yet. We currently deliver within " + s.city + " only.";
  return e;
}
function hasErrors(e) {
  for (const k in e) if (e[k]) return true;
  return false;
}

// ── Settings ──────────────────────────────────────────────────
function loadSettings(app) {
  const r = app.findFirstRecordByFilter("settings", "key = 'store'");
  return {
    record: r,
    storeName: r.getString("storeName") || "Mama Ejima",
    whatsappNumber: r.getString("whatsappNumber"),
    deliveryFeeCents: r.getInt("deliveryFeeCents"),
    freeOverCents: r.getInt("freeOverCents"),
    cutoffHours: r.getInt("cutoffHours"),
    horizonWeeks: r.getInt("horizonWeeks") || 8,
    blockedDates: jsonArray(r, "blockedDates"),
    regions: jsonArray(r, "regions"),
    city: r.getString("city") || "Cape Town",
  };
}
// JSON fields come back as raw bytes in the JS engine: read them via getString.
function jsonField(r, name) {
  const raw = r.getString(name);
  if (!raw) return null;
  try { return JSON.parse(raw); } catch (_) { return null; }
}
function jsonArray(r, name) {
  const v = jsonField(r, name);
  return Array.isArray(v) ? v : [];
}
function toJS(v) {
  if (v === null || v === undefined) return null;
  if (typeof v === "string") {
    try { return JSON.parse(v); } catch (_) { return v; }
  }
  try { return JSON.parse(JSON.stringify(v)); } catch (_) { return v; }
}
function toArray(v) {
  const x = toJS(v);
  return Array.isArray(x) ? x : [];
}

// ── Pricing ───────────────────────────────────────────────────
const MAX_QTY = 50;
const MAX_LINES = 60;

function parseItems(raw) {
  const out = [];
  const list = Array.isArray(raw) ? raw.slice(0, MAX_LINES) : [];
  const merged = {};
  for (let i = 0; i < list.length; i++) {
    const it = list[i] || {};
    if (typeof it.productId !== "string" || !it.productId) continue;
    const vid = typeof it.variantId === "string" && it.variantId ? it.variantId.slice(0, 40) : null;
    const key = it.productId + "::" + (vid || "");
    const q = Number(it.quantity);
    if (merged[key]) merged[key].quantity += q;
    else {
      merged[key] = { productId: it.productId.slice(0, 40), variantId: vid, quantity: q };
      out.push(merged[key]);
    }
  }
  return out;
}

/** Price items using only database values. `getProduct(id)` returns a Record or null. */
function priceItems(items, getProduct, settings) {
  const lines = [];
  const issues = [];
  for (let i = 0; i < items.length; i++) {
    const it = items[i];
    const ref = { productId: it.productId, variantId: it.variantId };
    if (!(it.quantity >= 1 && it.quantity <= MAX_QTY && Math.floor(it.quantity) === it.quantity)) {
      issues.push(Object.assign(ref, { kind: "invalid_quantity", message: "Invalid quantity." }));
      continue;
    }
    const p = getProduct(it.productId);
    if (!p) {
      issues.push(Object.assign(ref, { kind: "missing", message: "This product is no longer available." }));
      continue;
    }
    const name = p.getString("name");
    const variants = jsonArray(p, "variants");
    let variant = null;
    if (it.variantId) {
      for (let j = 0; j < variants.length; j++) if (variants[j].id === it.variantId) variant = variants[j];
      if (!variant) {
        issues.push(Object.assign(ref, { kind: "missing", message: name + ": this option is no longer available." }));
        continue;
      }
    } else if (variants.length > 0) {
      issues.push(Object.assign(ref, { kind: "missing", message: name + ": please choose an option." }));
      continue;
    }
    if (!p.getBool("available")) {
      issues.push(Object.assign(ref, { kind: "unavailable", message: name + " is currently unavailable." }));
      continue;
    }
    const stock = variant ? Number(variant.stock) || 0 : p.getInt("stock");
    const label = name + (variant ? " (" + variant.name + ")" : "");
    if (stock < it.quantity) {
      issues.push(
        Object.assign(ref, {
          kind: "insufficient_stock",
          availableQty: Math.max(0, stock),
          message: stock <= 0 ? label + " is out of stock." : "Only " + stock + " of " + label + " left.",
        }),
      );
      continue;
    }
    const unit = variant ? Math.round(Number(variant.priceCents) || 0) : p.getInt("priceCents");
    lines.push({
      productId: p.id,
      variantId: variant ? variant.id : null,
      name: name,
      variantName: variant ? variant.name : null,
      sku: variant ? variant.sku || p.getString("sku") : p.getString("sku"),
      unitPriceCents: unit,
      quantity: it.quantity,
      lineTotalCents: unit * it.quantity,
      available: stock,
    });
  }
  let subtotal = 0;
  for (let i = 0; i < lines.length; i++) subtotal += lines[i].lineTotalCents;
  const fee = deliveryFeeFor(subtotal, settings);
  return { lines: lines, issues: issues, subtotalCents: subtotal, deliveryFeeCents: fee, totalCents: subtotal + fee };
}

// ── WhatsApp message ──────────────────────────────────────────
function buildMessage(o, storeName) {
  const c = o.customer, a = o.address;
  const L = [];
  L.push("*New order — " + storeName + "*");
  L.push("Ref: *" + o.reference + "*");
  L.push("");
  L.push("*Name:* " + c.firstName + " " + c.surname);
  L.push("*Contact:* " + formatPhone(c.phone));
  if (c.email) L.push("*Email:* " + c.email);
  L.push("");
  L.push("*Delivery:* " + formatDeliveryDate(o.deliveryDate));
  L.push("*Address:*");
  L.push(a.street);
  if (a.building) L.push(a.building);
  L.push(a.suburb + ", Cape Town");
  if (a.instructions) L.push("_Note: " + a.instructions + "_");
  L.push("");
  L.push("*Items*");
  for (let i = 0; i < o.lines.length; i++) {
    const l = o.lines[i];
    const n = l.variantName ? l.name + " (" + l.variantName + ")" : l.name;
    L.push("• " + l.quantity + " × " + n + " @ " + plainZAR(l.unitPriceCents) + " = " + plainZAR(l.lineTotalCents));
  }
  L.push("");
  L.push("Subtotal: " + plainZAR(o.subtotalCents));
  L.push("Delivery: " + (o.deliveryFeeCents === 0 ? "Free" : plainZAR(o.deliveryFeeCents)));
  L.push("*Total: " + plainZAR(o.totalCents) + "*");
  L.push("");
  L.push("Please confirm my order. Thank you.");
  return L.join("\n");
}

const REF_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
function newReference(now) {
  const yymm = (now || new Date()).toISOString().slice(2, 7).replace("-", "");
  return "ME-" + yymm + "-" + $security.randomStringWithAlphabet(5, REF_ALPHABET);
}

const STATUSES = ["awaiting_whatsapp", "confirmed", "preparing", "ready", "out_for_delivery", "delivered", "cancelled"];
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/** What the customer (owner) and admin get back. */
function exportOrder(r) {
  return {
    id: r.id,
    checkoutId: r.getString("checkoutId"),
    reference: r.getString("reference"),
    status: r.getString("status"),
    customer: jsonField(r, "customer"),
    address: jsonField(r, "address"),
    deliveryDate: r.getString("deliveryDate"),
    lines: jsonArray(r, "lines"),
    subtotalCents: r.getInt("subtotalCents"),
    deliveryFeeCents: r.getInt("deliveryFeeCents"),
    totalCents: r.getInt("totalCents"),
    whatsappMessage: r.getString("whatsappMessage"),
    statusHistory: jsonArray(r, "statusHistory"),
    created: r.getString("created"),
  };
}

function checkAddress(e) {
  const s = loadSettings(e.app);
  const sub = canonicalSuburb(e.record.getString("suburb"), s);
  if (!sub)
    throw new BadRequestError("We don't deliver to that suburb yet.", {
      suburb: { code: "unsupported", message: "We don't deliver to that suburb yet." },
    });
  e.record.set("suburb", sub);
  e.next();
}

function checkCart(e) {
  const raw = jsonArray(e.record, "items").slice(0, 60);
  const items = raw
    .filter((i) => i && typeof i.productId === "string")
    .map((i) => ({
      productId: String(i.productId).slice(0, 40),
      variantId: typeof i.variantId === "string" && i.variantId ? i.variantId.slice(0, 40) : null,
      quantity: Math.max(1, Math.min(50, Math.floor(Number(i.quantity) || 1))),
    }));
  e.record.set("items", items);
  e.next();
}

module.exports = {
  checkAddress, checkCart,
  todaySAST, parseISODate, isMonday, mondayState, isDeliverableDate, formatDeliveryDate,
  plainZAR, deliveryFeeFor, clean, normalisePhone, formatPhone, canonicalSuburb,
  validateCustomer, validateAddress, hasErrors, loadSettings, toJS, toArray, jsonField, jsonArray,
  parseItems, priceItems, buildMessage, newReference, exportOrder, STATUSES, UUID_RE,
};
