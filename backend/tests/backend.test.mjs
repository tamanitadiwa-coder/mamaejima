// End-to-end tests for the Mama Ejima PocketBase backend.
// Run with the server up:  node tests/backend.test.mjs [baseUrl]
const BASE = process.argv[2] || "http://127.0.0.1:8090";
const ADMIN = { identity: "admin@mamaejima.test", password: "TestAdmin-2026!" };
let pass = 0, fail = 0;
const ok = (cond, name, extra) => { cond ? pass++ : fail++; console.log(`${cond ? "✓" : "✗"} ${name}${!cond && extra !== undefined ? "  → " + JSON.stringify(extra).slice(0, 300) : ""}`); };

async function api(path, { method = "GET", token, body } = {}) {
  const r = await fetch(BASE + path, {
    method,
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: token } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  let data = null; try { data = await r.json(); } catch {}
  return { status: r.status, data };
}
const uuid = () => crypto.randomUUID();
function nextMondays(n) { // Mondays at least 3 days away (past the 36h cutoff)
  const out = []; const d = new Date(Date.now() + 2 * 3600e3); d.setUTCHours(0,0,0,0);
  d.setUTCDate(d.getUTCDate() + 3);
  while (out.length < n) { if (d.getUTCDay() === 1) out.push(d.toISOString().slice(0,10)); d.setUTCDate(d.getUTCDate()+1); }
  return out;
}
function nextTuesday() { const d = new Date(); d.setUTCDate(d.getUTCDate()+3); while (d.getUTCDay()!==2) d.setUTCDate(d.getUTCDate()+1); return d.toISOString().slice(0,10); }

async function register(email) {
  const r = await api("/api/collections/users/records", { method: "POST", body: { email, password: "Customer-Pass-1", passwordConfirm: "Customer-Pass-1", firstName: "Test", surname: "Customer", phone: "082 123 4567" } });
  const a = await api("/api/collections/users/auth-with-password", { method: "POST", body: { identity: email, password: "Customer-Pass-1" } });
  return { id: r.data?.id, token: a.data?.token, phone: r.data?.phone };
}

const customer = { firstName: "Tendai", surname: "Moyo", phone: "082 123 4567", email: "" };
const address = { street: "12 Albert Road", building: "", suburb: "woodstock", instructions: "Blue gate" };

(async () => {
  const admin = (await api("/api/collections/_superusers/auth-with-password", { method: "POST", body: ADMIN })).data.token;
  ok(!!admin, "admin can sign in");

  const prods = await api("/api/collections/products/records?perPage=50");
  ok(prods.status === 200 && prods.data.items.length === 12, "public can list products", prods.status);
  const simple = prods.data.items.find((p) => p.slug === "sample-product-02");
  const varied = prods.data.items.find((p) => p.slug === "sample-product-01");
  const soldOut = prods.data.items.find((p) => p.slug === "sample-product-08");
  const settings = (await api("/api/collections/settings/records?filter=(key='store')")).data.items[0];
  ok(settings && settings.regions.length > 10, "public can read store settings");

  const pw = await api(`/api/collections/products/records/${simple.id}`, { method: "PATCH", body: { priceCents: 1 } });
  ok(pw.status === 403 || pw.status === 404, "public cannot change a price", pw.status);

  const A = await register(`a${Date.now()}@test.local`);
  const B = await register(`b${Date.now()}@test.local`);
  ok(A.token && B.token, "customers can register and sign in");
  ok(A.phone === "27821234567", "phone normalised on profile", A.phone);

  const userPw = await api(`/api/collections/products/records/${simple.id}`, { method: "PATCH", token: A.token, body: { priceCents: 1 } });
  ok(userPw.status >= 400, "customer cannot change a price", userPw.status);

  const [mon1, mon2] = nextMondays(2);
  const items = [{ productId: simple.id, variantId: null, quantity: 2, priceCents: 1 }, { productId: varied.id, variantId: "v2", quantity: 1 }];

  const v = await api("/api/mama/basket/validate", { method: "POST", body: { items } });
  ok(v.status === 200 && v.data.subtotalCents === 4500 * 2 + 15500 && v.data.deliveryFeeCents === 5000, "basket validated with server prices", v.data);

  const guest = await api("/api/mama/orders", { method: "POST", body: { checkoutId: uuid(), customer, address, deliveryDate: mon1, items } });
  ok(guest.status === 401, "guest cannot place an order (account required)", guest.status);

  const noWa = await api("/api/mama/orders", { method: "POST", token: A.token, body: { checkoutId: uuid(), customer, address, deliveryDate: mon1, items } });
  ok(noWa.status === 503, "ordering closed until WhatsApp number is configured", noWa);

  const setWa = await api(`/api/collections/settings/records/${settings.id}`, { method: "PATCH", token: admin, body: { whatsappNumber: "27000000000" } });
  ok(setWa.status === 200, "admin can set WhatsApp number", setWa.data);
  const userSet = await api(`/api/collections/settings/records/${settings.id}`, { method: "PATCH", token: A.token, body: { whatsappNumber: "27111111111" } });
  ok(userSet.status >= 400, "customer cannot change settings", userSet.status);

  const tue = await api("/api/mama/orders", { method: "POST", token: A.token, body: { checkoutId: uuid(), customer, address, deliveryDate: nextTuesday(), items } });
  ok(tue.status === 422 && tue.data.code === "invalid_date", "Tuesday delivery rejected", tue.data);

  const far = await api("/api/mama/orders", { method: "POST", token: A.token, body: { checkoutId: uuid(), customer, address: { ...address, suburb: "Stellenbosch" }, deliveryDate: mon1, items } });
  ok(far.status === 422 && far.data.address?.suburb, "unsupported suburb rejected", far.data);

  const oos = await api("/api/mama/orders", { method: "POST", token: A.token, body: { checkoutId: uuid(), customer, address, deliveryDate: mon1, items: [{ productId: soldOut.id, quantity: 1 }] } });
  ok(oos.status === 409, "out-of-stock item rejected", oos.data);

  // Block mon1, try it
  await api(`/api/collections/settings/records/${settings.id}`, { method: "PATCH", token: admin, body: { blockedDates: [mon1] } });
  const blocked = await api("/api/mama/orders", { method: "POST", token: A.token, body: { checkoutId: uuid(), customer, address, deliveryDate: mon1, items } });
  ok(blocked.status === 422, "admin-blocked Monday rejected", blocked.status);

  const checkoutId = uuid();
  const good = await api("/api/mama/orders", { method: "POST", token: A.token, body: { checkoutId, customer, address, deliveryDate: mon2, items, totalCents: 1 } });
  ok(good.status === 201, "order placed", good.data);
  const o = good.data.order;
  ok(o.totalCents === 4500 * 2 + 15500 + 5000, "totals computed by server (browser total ignored)", o.totalCents);
  ok(o.status === "awaiting_whatsapp" && /^ME-\d{4}-[A-Z2-9]{5}$/.test(o.reference), "status + reference", [o.status, o.reference]);
  ok(o.address.suburb === "Woodstock" && o.customer.phone === "27821234567", "address + phone normalised", o.address);
  ok(o.whatsappMessage.includes(o.reference) && o.whatsappMessage.includes("R295.00"), "WhatsApp message built", o.whatsappMessage);

  const after = (await api(`/api/collections/products/records/${simple.id}`)).data;
  ok(after.stock === 23, "stock reserved", after.stock);

  const retry = await api("/api/mama/orders", { method: "POST", token: A.token, body: { checkoutId, customer, address, deliveryDate: mon2, items } });
  ok(retry.status === 200 && retry.data.existing && retry.data.order.reference === o.reference, "retry returns same order", retry.data);
  ok((await api(`/api/collections/products/records/${simple.id}`)).data.stock === 23, "retry does not reserve stock twice");

  const steal = await api("/api/mama/orders", { method: "POST", token: B.token, body: { checkoutId, customer, address, deliveryDate: mon2, items } });
  ok(steal.status === 400, "other customer cannot reuse a checkout id", steal.status);

  ok((await api(`/api/collections/orders/records/${o.id}`, { token: B.token })).status === 404, "other customer cannot view the order");
  ok((await api(`/api/collections/orders/records`, { token: B.token })).data.items.length === 0, "other customer's order list is empty");
  ok((await api(`/api/collections/orders/records`, { token: A.token })).data.items.length === 1, "owner sees their order history");
  ok((await api(`/api/collections/orders/records`)).data.items.length === 0, "public sees no orders");

  const direct = await api("/api/collections/orders/records", { method: "POST", token: A.token, body: { owner: A.id, checkoutId: uuid(), reference: "X", status: "confirmed", deliveryDate: mon2, totalCents: 1 } });
  ok(direct.status === 403, "customer cannot create orders directly", direct.status);
  const edit = await api(`/api/collections/orders/records/${o.id}`, { method: "PATCH", token: A.token, body: { status: "delivered" } });
  ok(edit.status >= 400, "customer cannot change order status", edit.status);
  const userStatus = await api(`/api/mama/admin/orders/${o.id}/status`, { method: "POST", token: A.token, body: { status: "confirmed" } });
  ok(userStatus.status === 401 || userStatus.status === 403, "customer cannot use admin status route", userStatus.status);

  const conf = await api(`/api/mama/admin/orders/${o.id}/status`, { method: "POST", token: admin, body: { status: "confirmed" } });
  ok(conf.status === 200 && conf.data.order.status === "confirmed", "admin confirms order", conf.data);
  const view = await api(`/api/collections/orders/records/${o.id}`, { token: A.token });
  ok(view.data.status === "confirmed", "customer sees status update");
  const cancel = await api(`/api/mama/admin/orders/${o.id}/status`, { method: "POST", token: admin, body: { status: "cancelled" } });
  ok(cancel.status === 200, "admin cancels order");
  const restored = (await api(`/api/collections/products/records/${simple.id}`)).data;
  const restoredV = (await api(`/api/collections/products/records/${varied.id}`)).data.variants.find((x) => x.id === "v2");
  ok(restored.stock === 25 && restoredV.stock === 10, "stock released on cancel", [restored.stock, restoredV.stock]);
  const twice = await api(`/api/mama/admin/orders/${o.id}/status`, { method: "POST", token: admin, body: { status: "confirmed" } });
  ok(twice.status === 400, "cancelled order can't be reopened");

  // Carts
  const cartA = await api("/api/collections/carts/records", { method: "POST", token: A.token, body: { owner: A.id, items: [{ productId: simple.id, quantity: 3 }] } });
  ok(cartA.status === 200, "customer saves basket to account", cartA.data);
  ok((await api(`/api/collections/carts/records/${cartA.data.id}`, { token: B.token })).status === 404, "other customer cannot read basket");
  const forge = await api("/api/collections/carts/records", { method: "POST", token: B.token, body: { owner: A.id, items: [] } });
  ok(forge.status >= 400, "cannot create basket for someone else", forge.status);
  const hijack = await api(`/api/collections/carts/records/${cartA.data.id}`, { method: "PATCH", token: B.token, body: { items: [] } });
  ok(hijack.status === 404, "cannot edit someone else's basket", hijack.status);
  // Re-login restores basket
  const relog = await api("/api/collections/users/auth-with-password", { method: "POST", body: { identity: (await api(`/api/collections/users/records/${A.id}`, { token: A.token })).data.email, password: "Customer-Pass-1" } });
  const restoredCart = await api(`/api/collections/carts/records?filter=(owner='${A.id}')`, { token: relog.data.token });
  ok(restoredCart.data.items[0]?.items[0]?.quantity === 3, "basket restored after signing in again");

  // Addresses
  const addrBad = await api("/api/collections/addresses/records", { method: "POST", token: A.token, body: { owner: A.id, street: "1 Main Rd", suburb: "Paarl" } });
  ok(addrBad.status === 400, "saved address outside Cape Town rejected", addrBad.status);
  const addrOk = await api("/api/collections/addresses/records", { method: "POST", token: A.token, body: { owner: A.id, street: "1 Main Rd", suburb: "sea point" } });
  ok(addrOk.status === 200 && addrOk.data.suburb === "Sea Point", "saved address accepted", addrOk.data);
  ok((await api("/api/collections/addresses/records", { token: B.token })).data.items.length === 0, "other customer can't see saved addresses");

  // Profiles
  ok((await api(`/api/collections/users/records/${A.id}`, { token: B.token })).status === 404, "other customer can't view a profile");
  ok((await api(`/api/collections/users/records`)).data.items.length === 0, "public can't list customers");

  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
