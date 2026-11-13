/**
 * e2e-multicity.js — real-API, multi-city, multi-seller order lifecycle test.
 *
 * Runs against a RUNNING backend (default http://localhost:5055/api/v1) that is
 * connected to an ISOLATED database. Never point this at production: it creates
 * sellers, products, customers and orders and mutates sellers directly in Mongo
 * for the three things no API exists for (warehouse flag, catalogKey, stock reset).
 *
 *   MONGODB_URI=<isolated-db> PORT=5055 node src/server.js
 *   MONGODB_URI=<isolated-db> node scripts/e2e-multicity.js
 *
 * Cast (all created through the public APIs, with OTP):
 *   Quick sellers   : Indore A (Palasia ~1.2km), B (Bhawarkua ~3km), C (Vijay Nagar ~4.5km)
 *   Warehouse       : Indore Central Warehouse (Dewas Naka)
 *   Standard sellers: Madhubani (Bihar) craft seller, Jaipur (Rajasthan) textile seller
 *   Riders          : 2 in Indore
 *   Customers       : Indore (live location), Bhopal (190km away), Patna (far)
 */
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

const BASE = process.env.TEST_BASE_URL || 'http://localhost:5055/api/v1';
const RUN = Date.now().toString(36);
const results = [];
const bugs = [];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const unwrap = (b) => (b && b.data !== undefined ? b.data : b);

async function api(method, url, { token, body, query } = {}, _retry = 0) {
  const headers = { 'Content-Type': 'application/json', 'X-E2E-Test-Token': process.env.E2E_TEST_TOKEN || 'e2e-local-token' };
  if (token) headers.Authorization = `Bearer ${token}`;
  let full = `${BASE}${url}`;
  if (query) full += `?${new URLSearchParams(query)}`;
  const res = await fetch(full, { method, headers, body: body ? JSON.stringify(body) : undefined });
  const text = await res.text();
  let json;
  try { json = text ? JSON.parse(text) : null; } catch { json = { raw: text }; }
  if (res.status === 401 && token && _retry === 0) {
    const fresh = await refreshToken(token);
    if (fresh) return api(method, url, { token: fresh, body, query }, 1);
  }
  if (res.status >= 500 && _retry < 2 && !/\/orders$/.test(url)) {
    await sleep(800);
    return api(method, url, { token, body, query }, _retry + 1);
  }
  return { status: res.status, ok: res.ok, body: json, data: unwrap(json) };
}

// Access tokens live 15 min; the full run is longer, so actors silently re-login.
async function refreshToken(old) {
  const all = [];
  for (const g of ['customers', 'sellers', 'riders']) for (const a of Object.values(ctx[g] || {})) all.push([g, a]);
  for (const [g, a] of all) {
    if (a.token !== old) continue;
    let t = null;
    if (g === 'customers') t = (await otpLoginCustomer(a.phone)).token;
    if (g === 'sellers') t = (await sellerLogin(a.email)).token;
    if (g === 'riders') t = (await riderLogin(a.phone)).token;
    if (t) { a.token = t; return t; }
  }
  if (ctx.admin === old) {
    const r = await api('POST', '/admin/auth/login', { body: { email: 'palakpatel0342@gmail.com', password: 'Admin@12345' } }, 1);
    ctx.admin = r.data?.tokens?.accessToken; return ctx.admin;
  }
  return null;
}

function check(name, ok, detail = '') {
  results.push({ name, ok: Boolean(ok), detail });
  console.log(`${ok ? '  PASS' : '  FAIL'}  ${name}${detail ? ` — ${detail}` : ''}`);
  return Boolean(ok);
}
function bug(severity, title, detail) {
  bugs.push({ severity, title, detail });
  console.log(`  BUG[${severity}] ${title} — ${detail}`);
}
const section = (t) => console.log(`\n=== ${t} ===`);
const errMsg = (r) => `HTTP ${r.status} ${r.body?.error?.message || ''} ${JSON.stringify(r.body?.error?.details || '').slice(0, 200)}`;

let seq = 0;
const nextPhone = () => `9${String(Date.now()).slice(-6)}${String(++seq).padStart(3, '0')}`;

// ---------- actors ----------
async function otpLoginCustomer(phone) {
  const s = await api('POST', '/auth/send-phone-otp', { body: { phone, countryCode: '+91' } });
  const otp = s.data?.devOtp || '123456';
  const v = await api('POST', '/auth/verify-phone-otp', { body: { phone, countryCode: '+91', otp } });
  return { token: v.data?.tokens?.accessToken, user: v.data?.user, raw: v };
}

async function registerSeller(spec) {
  const phone = nextPhone();
  const s = await api('POST', '/seller/auth/send-phone-otp', { body: { phone, countryCode: '+91' } });
  const otp = s.data?.devOtp || '123456';
  const r = await api('POST', '/seller/auth/register', {
    body: {
      name: spec.owner, email: spec.email, storeName: spec.storeName, phone, countryCode: '+91',
      password: 'Seller@12345', otp, addressLine: spec.addressLine, city: spec.city, state: spec.state,
      pincode: spec.pincode, latitude: spec.lat, longitude: spec.lng,
    },
  });
  return { phone, reg: r };
}

async function sellerLogin(email) {
  const l = await api('POST', '/seller/auth/login', { body: { email, password: 'Seller@12345' } });
  return { token: l.data?.tokens?.accessToken, seller: l.data?.seller || l.data?.user, raw: l };
}

async function registerRider(spec) {
  const phone = nextPhone();
  const s = await api('POST', '/delivery/auth/send-otp', { body: { phone, countryCode: '+91' } });
  const otp = s.data?.devOtp || '123456';
  const r = await api('POST', '/delivery/auth/signup', {
    body: {
      name: spec.name, phone, countryCode: '+91', vehicleType: 'bike',
      aadharNumber: String(Math.floor(1e11 + Math.random() * 9e11)),
      drivingLicenseNumber: `MP09${Math.floor(1e6 + Math.random() * 9e6)}`,
      vehicleRegistrationNumber: `MP09AB${Math.floor(1000 + Math.random() * 8999)}`,
      otp, addressLine: spec.addressLine, city: spec.city, state: spec.state, pincode: spec.pincode,
      latitude: spec.lat, longitude: spec.lng,
    },
  });
  return { phone, reg: r };
}

async function riderLogin(phone) {
  const s = await api('POST', '/delivery/auth/send-otp', { body: { phone, countryCode: '+91' } });
  const otp = s.data?.devOtp || '123456';
  const v = await api('POST', '/delivery/auth/verify-otp', { body: { phone, countryCode: '+91', otp } });
  return { token: v.data?.tokens?.accessToken, raw: v };
}

// ---------- scenario data ----------
const INDORE = { lat: 22.7175147, lng: 75.871946, city: 'Indore', state: 'Madhya Pradesh', pincode: '452001' };
const BHOPAL = { lat: 23.2599, lng: 77.4126, city: 'Bhopal', state: 'Madhya Pradesh', pincode: '462001' };
const PATNA = { lat: 25.5941, lng: 85.1376, city: 'Patna', state: 'Bihar', pincode: '800001' };

const SELLERS = {
  A: { owner: 'Anil Jain', email: `a.${RUN}@mailinator.com`, storeName: `E2E Palasia Mart ${RUN}`, city: 'Indore', state: 'Madhya Pradesh', pincode: '452001', addressLine: '14/2 Old Palasia Main Road', lat: 22.724, lng: 75.883, kind: 'quick' },
  B: { owner: 'Bhavna Shah', email: `b.${RUN}@mailinator.com`, storeName: `E2E Bhawarkua Hub ${RUN}`, city: 'Indore', state: 'Madhya Pradesh', pincode: '452014', addressLine: 'Bhawarkua Main Road Near Tower', lat: 22.692, lng: 75.867, kind: 'quick' },
  C: { owner: 'Chetan Verma', email: `c.${RUN}@mailinator.com`, storeName: `E2E Vijay Nagar Store ${RUN}`, city: 'Indore', state: 'Madhya Pradesh', pincode: '452010', addressLine: 'Scheme 54 Vijay Nagar Square', lat: 22.7533, lng: 75.8937, kind: 'quick' },
  W: { owner: 'Waman Rao', email: `w.${RUN}@mailinator.com`, storeName: `E2E Indore Central Warehouse ${RUN}`, city: 'Indore', state: 'Madhya Pradesh', pincode: '452010', addressLine: 'Sector A Dewas Naka Industrial Area', lat: 22.785, lng: 75.91, kind: 'warehouse' },
  M: { owner: 'Meera Devi', email: `m.${RUN}@mailinator.com`, storeName: `E2E Madhubani Crafts ${RUN}`, city: 'Madhubani', state: 'Bihar', pincode: '847211', addressLine: 'Station Road Madhubani Art Center', lat: 26.354, lng: 86.072, kind: 'standard' },
  J: { owner: 'Jaya Rathore', email: `j.${RUN}@mailinator.com`, storeName: `E2E Jaipur Textiles ${RUN}`, city: 'Jaipur', state: 'Rajasthan', pincode: '302001', addressLine: 'Johari Bazar Jaipur', lat: 26.9124, lng: 75.7873, kind: 'standard' },
};


const ctx = { admin: null, sellers: {}, riders: {}, customers: {}, products: {}, listings: {}, orders: {}, category: null };

async function setup() {
  section('PHASE 1 — Platform setup (admin, sellers, riders, catalog)');
  const a = await api('POST', '/admin/auth/login', { body: { email: 'palakpatel0342@gmail.com', password: 'Admin@12345' } });
  ctx.admin = a.data?.tokens?.accessToken;
  if (!check('Admin logs in', ctx.admin, a.ok ? '' : errMsg(a))) throw new Error('admin login failed');

  // Fulfillment settings — made dynamic through the admin API, not the DB.
  const fs0 = await api('GET', '/admin/fulfillment/settings', { token: ctx.admin });
  check('Admin reads fulfillment settings', fs0.ok, errMsg(fs0));
  ctx.fulfillmentDefaults = fs0.data;

  // Sellers: register (OTP) -> admin approves -> tabs -> login
  for (const [key, spec] of Object.entries(SELLERS)) {
    const { phone, reg } = await registerSeller(spec);
    const ok = reg.ok && (reg.data?.seller?.id || reg.data?.user?.id || reg.data?.id || reg.data?.tokens);
    check(`Seller ${key} (${spec.city}) registers via OTP`, ok, ok ? '' : errMsg(reg));
    ctx.sellers[key] = { ...spec, phone, id: reg.data?.seller?.id || reg.data?.user?.id || reg.data?.id || null };
    if (!ctx.sellers[key].id) {
      const list = await api('GET', '/admin/vendors', { token: ctx.admin, query: { search: spec.email, limit: 5 } });
      const items = list.data?.items || list.data?.vendors || list.data || [];
      const found = (Array.isArray(items) ? items : []).find((v) => v.email === spec.email);
      ctx.sellers[key].id = found?.id || found?._id || null;
    }
    const pre = await api('POST', '/seller/auth/login', { body: { email: spec.email, password: 'Seller@12345' } });
    check(`Seller ${key} CANNOT log in before admin approval`, !pre.ok && pre.status === 403, `HTTP ${pre.status}`);
    const hard = await api('POST', '/seller/auth/login', { body: { email: spec.email, password: 'Seller@123' } });
    check(`Seller ${key} hard-coded password is rejected`, !hard.ok, `HTTP ${hard.status}`);
    const ap = await api('PATCH', `/admin/vendors/${ctx.sellers[key].id}/approve`, { token: ctx.admin });
    check(`Admin approves seller ${key}`, ap.ok, ap.ok ? '' : errMsg(ap));
    const tabs = spec.kind === 'standard'
      ? { mithilakEligible: true, quickCommerceEligible: false, groceryEligible: false }
      : { mithilakEligible: true, quickCommerceEligible: true, groceryEligible: true };
    const tb = await api('PATCH', `/admin/vendors/${ctx.sellers[key].id}/tabs`, { token: ctx.admin, body: tabs });
    check(`Admin sets tab eligibility for ${key}`, tb.ok, tb.ok ? '' : errMsg(tb));
    const lg = await sellerLogin(spec.email);
    ctx.sellers[key].token = lg.token;
    check(`Seller ${key} logs in with password`, lg.token, lg.token ? '' : errMsg(lg.raw));
  }

  // Riders
  const riderSpecs = {
    R1: { name: 'Raju Sharma', addressLine: '12 Rajwada Chowk Indore', ...INDORE, lat: 22.72, lng: 75.875 },
    R2: { name: 'Sunil Patidar', addressLine: '88 Sarafa Bazar Indore', ...INDORE, lat: 22.71, lng: 75.86 },
    R3: { name: 'Far Rider Jaipur', addressLine: '5 MI Road Jaipur', lat: 26.9124, lng: 75.7873, city: 'Jaipur', state: 'Rajasthan', pincode: '302001' },
  };
  for (const [key, spec] of Object.entries(riderSpecs)) {
    const { phone, reg } = await registerRider(spec);
    check(`Rider ${key} signs up via OTP`, reg.ok, reg.ok ? '' : errMsg(reg));
    const riderId = reg.data?.partner?.id || reg.data?.user?.id || reg.data?.deliveryPartner?.id || reg.data?.id;
    ctx.riders[key] = { ...spec, phone, id: riderId };
    if (!riderId) {
      const list = await api('GET', '/admin/delivery', { token: ctx.admin, query: { search: phone, limit: 5 } });
      const items = list.data?.items || list.data || [];
      const f = (Array.isArray(items) ? items : []).find((p) => p.phone === phone);
      ctx.riders[key].id = f?.id || f?._id;
    }
    const ap = await api('PATCH', `/admin/delivery/${ctx.riders[key].id}/approve`, { token: ctx.admin });
    check(`Admin approves rider ${key}`, ap.ok, ap.ok ? '' : errMsg(ap));
    const lg = await riderLogin(phone);
    ctx.riders[key].token = lg.token;
    check(`Rider ${key} logs in via OTP`, lg.token, lg.token ? '' : errMsg(lg.raw));
  }
}


async function catalog() {
  section('PHASE 2 — Catalog: categories, products, listings, moderation');
  const mk = async (name, slug, tabs, flows) => {
    const r = await api('POST', '/admin/categories', { token: ctx.admin, body: { name, slug: slug + '-' + RUN, visibleTabs: tabs, commerceFlows: flows, isActive: true } });
    check('Admin creates category ' + name, r.ok, r.ok ? '' : errMsg(r));
    return r.data?.id || r.data?._id;
  };
  ctx.cat = {
    staples: await mk('E2E Staples', 'e2e-staples', ['quick_shop', 'groceries_fresh'], ['quick_shop', 'fresh_grocery']),
    craft: await mk('E2E Handicrafts', 'e2e-handicrafts', ['mithilakart', 'mithilak'], ['standard']),
  };

  const productPlan = [
    // seller, key, title, sku, price, mrp, stock, category, flows, tab, promise
    ['A', 'atta', 'Aashirvaad Atta 5kg', 'ATTA-5KG-A', 245, 280, 20, 'staples', ['quick_shop'], 'quick_shop', 15],
    ['B', 'atta', 'Aashirvaad Atta 5kg', 'ATTA-5KG-B', 249, 280, 20, 'staples', ['quick_shop'], 'quick_shop', 20],
    ['C', 'atta', 'Aashirvaad Atta 5kg', 'ATTA-5KG-C', 252, 280, 20, 'staples', ['quick_shop'], 'quick_shop', 25],
    ['W', 'atta', 'Aashirvaad Atta 5kg', 'ATTA-5KG-W', 240, 280, 500, 'staples', ['quick_shop'], 'quick_shop', 30],
    ['M', 'madhubani', 'Madhubani Handpainted Fish Painting', 'MADH-FISH-01', 1899, 2499, 15, 'craft', ['standard'], 'mithilakart', null],
    ['J', 'kurta', 'Jaipuri Block Print Cotton Kurta', 'JAIP-KURTA-01', 1299, 1799, 25, 'craft', ['standard'], 'mithilakart', null],
  ];
  for (const [sk, pk, title, sku, price, mrp, stock, cat, flows, tab, promise] of productPlan) {
    const s = ctx.sellers[sk];
    const r = await api('POST', '/seller/products', { token: s.token, body: { title, description: title + ' - e2e', sku: sku + '-' + RUN, price, mrp, stock, categoryId: ctx.cat[cat], commerceFlows: flows, images: ['/uploads/e2e.png'] } });
    const id = r.data?.id || r.data?._id;
    check('Seller ' + sk + ' creates product ' + sku + ' with plain-string image URL (normalized)', r.ok && id && r.data?.images?.[0]?.url === '/uploads/e2e.png', r.ok ? ('status=' + r.data?.status) : errMsg(r));
    ctx.products[sk + ':' + pk] = { id, status: r.data?.status, tab, promise, price, mrp };
  }

  // Admin product moderation
  const pending = await api('GET', '/admin/products', { token: ctx.admin, query: { status: 'pending', limit: 100 } });
  check('Admin lists pending products', pending.ok, pending.ok ? ((pending.data?.items || pending.data || []).length + ' pending') : errMsg(pending));
  for (const [k, p] of Object.entries(ctx.products)) {
    if (p.status === 'approved') continue;
    const ap = await api('PATCH', '/admin/products/' + p.id + '/approve', { token: ctx.admin });
    check('Admin approves product ' + k, ap.ok, ap.ok ? '' : errMsg(ap));
  }

  // Listings are auto-created from commerceFlows at product creation; look them up.
  for (const [k, p] of Object.entries(ctx.products)) {
    const sk = k.split(':')[0];
    const r = await api('GET', '/seller/listings', { token: ctx.sellers[sk].token, query: { limit: 100 } });
    const items = r.data?.items || r.data?.listings || (Array.isArray(r.data) ? r.data : []);
    const l = items.find((x) => String(x.productId?._id || x.productId?.id || x.productId) === String(p.id) && x.marketplaceTab === p.tab);
    check('Listing auto-created for ' + k + ' on ' + p.tab, l, l ? ('status=' + (l.listingStatus || l.status)) : (r.ok ? 'not found in ' + items.length + ' listings' : errMsg(r)));
    p.listingId = l?.id || l?._id; p.listingStatus = l?.listingStatus || l?.status;
  }
  for (const [k, p] of Object.entries(ctx.products)) {
    if (!p.listingId) continue;
    const sk = k.split(':')[0];
    if (p.listingStatus !== 'approved' && p.listingStatus !== 'pending') {
      const pub = await api('PATCH', '/seller/listings/' + p.listingId + '/publish', { token: ctx.sellers[sk].token });
      check('Seller ' + sk + ' publishes listing ' + k, pub.ok, pub.ok ? ('status=' + pub.data?.listingStatus) : errMsg(pub));
      p.listingStatus = pub.data?.listingStatus;
    }
    if (p.listingStatus !== 'approved') {
      const ap = await api('PATCH', '/admin/listings/' + p.listingId + '/approve', { token: ctx.admin });
      check('Admin approves listing ' + k, ap.ok, ap.ok ? '' : errMsg(ap));
    }
  }

  // Warehouse designation + shared catalog identity: admin API (previously DB-only).
  await mongoose.connect(process.env.MONGODB_URI);
  const dbName = mongoose.connection.name;
  if (!/e2e|test/i.test(dbName)) throw new Error('Refusing DB access: database "' + dbName + '" is not an isolated test DB');

  const badWh = await api('PATCH', '/admin/vendors/' + ctx.sellers.W.id + '/warehouse', { body: { isWarehouse: true } });
  check('Warehouse endpoint rejects unauthenticated callers', badWh.status === 401, 'HTTP ' + badWh.status);
  const whBad = await api('PATCH', '/admin/vendors/' + ctx.sellers.W.id + '/warehouse', { token: ctx.admin, body: { isWarehouse: 'yes please' } });
  check('Warehouse endpoint validates the body', whBad.status === 422, 'HTTP ' + whBad.status);
  const wh = await api('PATCH', '/admin/vendors/' + ctx.sellers.W.id + '/warehouse', { token: ctx.admin, body: { isWarehouse: true } });
  check('Admin designates the central warehouse via API', wh.ok && (wh.data?.isWarehouse === true), wh.ok ? '' : errMsg(wh));
  const attaIds = ['A', 'B', 'C', 'W'].map((k) => ctx.products[k + ':atta'].id);
  const badKey = await api('POST', '/admin/products/catalog-key', { token: ctx.admin, body: { ids: attaIds, catalogKey: 'bad key!' } });
  check('Catalog-key endpoint rejects an invalid key', badKey.status === 422, 'HTTP ' + badKey.status);
  const ck = await api('POST', '/admin/products/catalog-key', { token: ctx.admin, body: { ids: attaIds, catalogKey: 'e2e-atta-5kg-' + RUN } });
  check('Admin links 4 sellers\' atta as the same item via API (key upper-cased)', ck.ok && ck.data?.updatedCount === 4 && ck.data?.catalogKey === ('E2E-ATTA-5KG-' + RUN).toUpperCase(), ck.ok ? 'key=' + ck.data?.catalogKey : errMsg(ck));
  const stored = await mongoose.connection.collection('products').countDocuments({ catalogKey: ('E2E-ATTA-5KG-' + RUN).toUpperCase() });
  check('Catalog key persisted on all 4 products', stored === 4, 'stored=' + stored);
  const pendingWh = await api('PATCH', '/admin/vendors/' + ctx.sellers.M.id + '/warehouse', { token: ctx.admin, body: { isWarehouse: true, fulfillmentRadiusKm: 50 } });
  check('A standard seller can be flagged and un-flagged (round trip)', pendingWh.ok, pendingWh.ok ? '' : errMsg(pendingWh));
  await api('PATCH', '/admin/vendors/' + ctx.sellers.M.id + '/warehouse', { token: ctx.admin, body: { isWarehouse: false, fulfillmentRadiusKm: null } });
  const bogusTab = await api('GET', '/products', { query: { marketplaceTab: 'not_a_real_tab' } });
  check('Catalog list rejects a bogus marketplaceTab (item 6)', bogusTab.status === 422, 'HTTP ' + bogusTab.status);
}


const oidOf = (x) => new mongoose.Types.ObjectId(String(x));
const dbc = (n) => mongoose.connection.collection(n);
const listOf = (d) => (d && d.available ? [...d.available, ...(d.assigned||[])] : null) || (d && (d.items || d.orders || d.offers || d.listings || d.products)) || (Array.isArray(d) ? d : []);
const stOf = (d) => d?.status || d?.order?.status;
const payOf = (d) => d?.paymentStatus || d?.order?.paymentStatus;
const idOf = (x) => String((x && (x.id || x._id)) || x || '');

async function customers() {
  section('PHASE 3 — Customers in 3 cities + live-location storefront');
  const specs = {
    indore: { name: 'Indore Customer', ...INDORE, addressLine: '203-A Chhoti Gwaltoli South Tukoganj' },
    bhopal: { name: 'Bhopal Customer', ...BHOPAL, addressLine: '45 MP Nagar Zone 1' },
    patna: { name: 'Patna Customer', ...PATNA, addressLine: '7 Boring Road' },
  };
  for (const [k, sp] of Object.entries(specs)) {
    const phone = nextPhone();
    const lg = await otpLoginCustomer(phone);
    check(`Customer ${k} logs in via OTP`, lg.token, lg.token ? '' : errMsg(lg.raw));
    const ad = await api('POST', '/users/me/addresses', { token: lg.token, body: { name: sp.name, phone, addressLine: sp.addressLine, city: sp.city, state: sp.state, pincode: sp.pincode, latitude: sp.lat, longitude: sp.lng, isDefault: true } });
    check(`Customer ${k} saves address with live coordinates`, ad.ok, ad.ok ? '' : errMsg(ad));
    ctx.customers[k] = { ...sp, phone, token: lg.token, addressId: ad.data?.id || ad.data?._id };
  }

  const near = async (c, flow) => api('GET', '/maps/nearby/products', { query: { lat: c.lat, lng: c.lng, commerceFlow: flow, limit: 50 } });
  const has = (r, t) => JSON.stringify(r.data || '').includes(t);
  const ind = await near(ctx.customers.indore, 'quick_shop');
  check('Indore: quick_shop feed shows Atta (dynamic by location)', ind.ok && has(ind, 'Aashirvaad Atta'), ind.ok ? '' : errMsg(ind));
  const bho = await near(ctx.customers.bhopal, 'quick_shop');
  check('Bhopal: quick_shop feed is EMPTY (no seller in range)', bho.ok && !has(bho, 'Aashirvaad Atta'));
  const pat = await near(ctx.customers.patna, 'quick_shop');
  check('Patna: quick_shop feed is EMPTY', pat.ok && !has(pat, 'Aashirvaad Atta'));
  const sel = await api('GET', '/maps/nearby/sellers', { query: { lat: ctx.customers.indore.lat, lng: ctx.customers.indore.lng } });
  const mine = (sel.data || []).filter((x) => x.storeName.includes(RUN));
  check("Indore nearby sellers lists this run's quick sellers", mine.length >= 3, mine.map((x) => `${x.storeName.split(' ').slice(1, 3).join(' ')}:${x.distanceKm}km`).join(' | '));
  const dists = mine.map((x) => x.distanceKm);
  check('Nearby sellers sorted by distance ascending', dists.every((d, i) => i === 0 || d >= dists[i - 1]), dists.join(','));

  for (const [city, c] of Object.entries(ctx.customers)) {
    const std = await api('GET', '/marketplace/listings', { query: { marketplaceTab: 'mithilakart', limit: 50, lat: c.lat, lng: c.lng } });
    check(`${city}: standard (mithilakart) tab shows craft + textile from other cities`, std.ok && has(std, 'Madhubani Handpainted') && has(std, 'Jaipuri Block Print'), std.ok ? '' : errMsg(std));
  }
  const home = await api('GET', '/storefront/home', { query: { commerceFlow: 'quick_shop' } });
  check('Storefront home endpoint responds', home.ok, home.ok ? '' : errMsg(home));
}

async function riderOnline(key, lat, lng) {
  const r = ctx.riders[key];
  const on = await api('PATCH', '/delivery/status', { token: r.token, body: { isOnline: true } });
  const loc = await api('PATCH', '/delivery/location', { token: r.token, body: { latitude: lat, longitude: lng } });
  return on.ok && loc.ok;
}

async function placeOrder(cust, productKey, qty = 1, extra = {}) {
  const p = ctx.products[productKey];
  return api('POST', '/orders', { token: cust.token, body: { addressId: cust.addressId, paymentMethod: 'cod', items: [{ productId: p.id, listingId: p.listingId, quantity: qty }], ...extra } });
}

async function waitFor(fn, { tries = 20, every = 500 } = {}) {
  for (let i = 0; i < tries; i++) { const v = await fn(); if (v) return v; await sleep(every); }
  return null;
}

async function findOffer(sellerKey, orderId) {
  return waitFor(async () => {
    const r = await api('GET', '/seller/fulfillment/offers', { token: ctx.sellers[sellerKey].token });
    return listOf(r.data).find((o) => idOf(o.orderId || o.order) === String(orderId)) || null;
  });
}

async function quickHappyPath() {
  section('PHASE 4 — Indore quick order: nearest seller accepts, rider delivers (full OTP handshake)');
  await riderOnline('R1', 22.72, 75.875); await riderOnline('R2', 22.71, 75.86); await riderOnline('R3', 26.9124, 75.7873);
  const cust = ctx.customers.indore;
  const o = await placeOrder(cust, 'A:atta', 2);
  const orderId = o.data?.orderId || o.data?.id || o.data?._id || o.data?.order?.id;
  check('Indore customer places quick_shop COD order', o.ok && orderId, o.ok ? `order ${o.data?.orderNumber || orderId}` : errMsg(o));
  if (!orderId) return;
  ctx.orders.quick = { id: orderId, number: o.data?.orderNumber };

  const offer = await findOffer('A', orderId);
  check('Nearest seller A receives the offer', offer, offer ? `dist=${offer.distanceKm}km eta=${offer.estimatedDeliveryMinutes}min` : 'no offer found');
  if (!offer) { console.log(JSON.stringify((await api('GET', `/orders/${orderId}/fulfillment`, { token: cust.token })).body).slice(0, 700)); return; }
  const attemptId = offer.attemptId || offer.id || offer._id;

  const fulf = await api('GET', `/orders/${orderId}/fulfillment`, { token: cust.token });
  check('Customer can see fulfillment status while seller decides', fulf.ok, fulf.ok ? `state=${fulf.data?.state || fulf.data?.status}` : errMsg(fulf));

  const acc = await api('POST', `/seller/orders/${orderId}/accept`, { token: ctx.sellers.A.token, body: { attemptId } });
  check('Seller A accepts the offer', acc.ok, acc.ok ? '' : errMsg(acc));
  const afterAcc = await api('GET', `/orders/${orderId}`, { token: cust.token });
  check('Accepting the offer auto-confirms the order', stOf(afterAcc.data) === 'confirmed', 'status=' + stOf(afterAcc.data));
  const pk0 = await api('PATCH', `/seller/orders/${orderId}/status`, { token: ctx.sellers.A.token, body: { status: 'packed', note: 'e2e' } });
  check('Seller A marks order packed', pk0.ok, pk0.ok ? '' : errMsg(pk0));

  const riderKey = await waitFor(async () => {
    for (const k of ['R1', 'R2']) {
      const l = await api('GET', '/delivery/orders', { token: ctx.riders[k].token });
      if (listOf(l.data).some((x) => idOf(x.orderId || x) === String(orderId) || x.orderNumber === ctx.orders.quick.number)) return k;
    }
    return null;
  }, { tries: 16, every: 700 });
  const farList = await api('GET', '/delivery/orders', { token: ctx.riders.R3.token });
  check('Rider in Jaipur (~550 km away) is NOT shown the Indore pickup', !listOf(farList.data).some((x) => idOf(x.orderId || x) === String(orderId)), 'available=' + (farList.data?.available || []).length);
  const nearList = await api('GET', '/delivery/orders', { token: ctx.riders.R1.token });
  const nearHit = listOf(nearList.data).find((x) => idOf(x.orderId || x) === String(orderId));
  check('Nearby rider sees it with the pickup distance', nearHit && typeof nearHit.distanceToPickupKm === 'number' && nearHit.distanceToPickupKm < 25, 'distanceToPickupKm=' + nearHit?.distanceToPickupKm);
  check('A rider is assigned/offered the order', riderKey, riderKey ? `visible to ${riderKey}` : 'no rider saw the order');
  if (!riderKey) return;
  const rt = ctx.riders[riderKey].token;
  const ra = await api('POST', `/delivery/orders/${orderId}/accept`, { token: rt });
  const pickupOtp = ra.data?.pickupOtp || ra.data?.order?.pickupOtp;
  check('Rider accepts and receives pickup OTP', ra.ok && pickupOtp, ra.ok ? `pickupOtp=${pickupOtp}` : errMsg(ra));
  const pk = await api('POST', `/delivery/orders/${orderId}/pickup`, { token: rt, body: { otp: String(pickupOtp || '0000') } });
  const deliveryOtp = pk.data?.deliveryOtp || pk.data?.order?.deliveryOtp;
  check('Rider verifies pickup OTP at the seller', pk.ok, pk.ok ? `deliveryOtp=${deliveryOtp}` : errMsg(pk));
  const bad = await api('POST', `/delivery/orders/${orderId}/deliver`, { token: rt, body: { otp: '000000' } });
  check('Wrong delivery OTP is rejected', !bad.ok, `HTTP ${bad.status}`);
  const dl = await api('POST', `/delivery/orders/${orderId}/deliver`, { token: rt, body: { otp: String(deliveryOtp || '0000') } });
  check('Rider delivers with the correct OTP', dl.ok, dl.ok ? '' : errMsg(dl));
  const fin = await api('GET', `/orders/${orderId}`, { token: cust.token });
  check('Order status is delivered (customer view)', stOf(fin.data) === 'delivered', `status=${stOf(fin.data)}`);
  check('COD order is marked paid after delivery', payOf(fin.data) === 'paid', 'paymentStatus=' + payOf(fin.data));
  const trk = await api('GET', `/orders/${orderId}/tracking`, { token: cust.token });
  check('Tracking endpoint returns timeline', trk.ok, trk.ok ? '' : errMsg(trk));
}


async function setFulfillment(patch) {
  const r = await api('PUT', '/admin/fulfillment/settings', { token: ctx.admin, body: patch });
  return r;
}

async function currentOffer(orderId, attempts = 24) {
  // Whichever seller/warehouse currently holds the live offer, found through the sellers' own offer feeds.
  for (let i = 0; i < attempts; i++) {
    for (const k of ['A', 'B', 'C', 'W']) {
      const r = await api('GET', '/seller/fulfillment/offers', { token: ctx.sellers[k].token });
      const o = listOf(r.data).find((x) => idOf(x.orderId || x.order) === String(orderId));
      if (o) return { key: k, offer: o };
    }
    await sleep(500);
  }
  return null;
}

async function reject(key, orderId, offer, reason = 'out_of_stock') {
  return api('POST', `/seller/orders/${orderId}/reject`, { token: ctx.sellers[key].token, body: { attemptId: offer.attemptId || offer.id || offer._id, reason } });
}

async function riderDeliver(orderId, cust, label) {
  await riderOnline('R1', 22.72, 75.875); await riderOnline('R2', 22.71, 75.86);
  const riderKey = await waitFor(async () => {
    for (const k of ['R1', 'R2']) {
      const l = await api('GET', '/delivery/orders', { token: ctx.riders[k].token });
      if (listOf(l.data).some((x) => idOf(x.orderId || x) === String(orderId))) return k;
    }
    return null;
  }, { tries: 16, every: 700 });
  if (!check(`${label}: a rider sees the order`, riderKey)) return;
  const rt = ctx.riders[riderKey].token;
  const ra = await api('POST', `/delivery/orders/${orderId}/accept`, { token: rt });
  const pk = await api('POST', `/delivery/orders/${orderId}/pickup`, { token: rt, body: { otp: String(ra.data?.pickupOtp || ra.data?.order?.pickupOtp || '0') } });
  const dl = await api('POST', `/delivery/orders/${orderId}/deliver`, { token: rt, body: { otp: String(pk.data?.deliveryOtp || pk.data?.order?.deliveryOtp || '0') } });
  check(`${label}: rider completes accept → pickup OTP → delivery OTP`, ra.ok && pk.ok && dl.ok, `${ra.status}/${pk.status}/${dl.status} ${dl.ok ? '' : errMsg(dl)}`);
  const fin = await api('GET', `/orders/${orderId}`, { token: cust.token });
  check(`${label}: order is delivered`, stOf(fin.data) === 'delivered', `status=${stOf(fin.data)}`);
}

async function sellerStock(key, productKey) {
  const r = await api('GET', `/seller/products/${ctx.products[productKey].id}`, { token: ctx.sellers[key].token });
  return r.data?.stock ?? r.data?.product?.stock ?? null;
}

async function fulfillmentOf(orderId) {
  const o = await dbc('orders').findOne({ _id: oidOf(orderId) });
  const f = await dbc('order_fulfillments').findOne({ orderId: oidOf(orderId) });
  return { o, f };
}

async function cascadeAndFallback() {
  section('PHASE 5 — Fulfillment ladder: reject cascade → warehouse → courier (admin-configured, no DB edits)');
  const cust = ctx.customers.indore;

  // 5a: substitution OFF (platform default) — only the owning seller can serve the order.
  const off = await setFulfillment({ crossSellerSubstitutionEnabled: false });
  check('Admin disables cross-seller substitution via API', off.ok, off.ok ? '' : errMsg(off));
  const o1 = await placeOrder(cust, 'A:atta', 1);
  const id1 = o1.data?.orderId || o1.data?.id;
  const offer1 = await findOffer('A', id1);
  await reject('A', id1, offer1);
  await sleep(1500);
  const after1 = await fulfillmentOf(id1);
  const nextB = await api('GET', '/seller/fulfillment/offers', { token: ctx.sellers.B.token });
  const bGot = listOf(nextB.data).some((x) => idOf(x.orderId || x.order) === String(id1));
  check('Substitution OFF: rejection does NOT cascade to seller B (B stocks same item but is not substitutable)', !bGot, `fulfillment.state=${after1.f?.state} type=${after1.o?.fulfillment?.type} fallbackLevel=${after1.o?.fulfillment?.fallbackLevel}`);
  check('Substitution OFF: order falls to warehouse/courier instead of being lost', after1.o?.fulfillment?.type && after1.o.fulfillment.type !== 'quick_local' || ['warehouse_offered', 'warehouse_accepted', 'courier', 'courier_assigned', 'failed'].some((x) => String(after1.f?.state).includes(x.split('_')[0])), `type=${after1.o?.fulfillment?.type} state=${after1.f?.state}`);
  await api('POST', `/orders/${id1}/cancel`, { token: cust.token });

  // 5b: substitution ON — A rejects → B → C → warehouse W.
  const on = await setFulfillment({ crossSellerSubstitutionEnabled: true, maxSellerAttemptsPerOrder: 3 });
  check('Admin enables cross-seller substitution via API', on.ok, on.ok ? '' : errMsg(on));
  const stockA0 = await sellerStock('A', 'A:atta');
  const o2 = await placeOrder(cust, 'A:atta', 1);
  const id2 = o2.data?.orderId || o2.data?.id;
  check('Cascade order placed', o2.ok && id2, o2.ok ? '' : errMsg(o2));
  const seq = [];
  for (let i = 0; i < 3; i++) {
    const cur = await currentOffer(id2);
    if (!cur) break;
    seq.push(cur.key);
    if (cur.key === 'W') break;
    const rj = await reject(cur.key, id2, cur.offer, i === 0 ? 'out_of_stock' : 'too_busy');
    check(`Seller ${cur.key} rejects (${i === 0 ? 'out_of_stock' : 'too_busy'})`, rj.ok, rj.ok ? '' : errMsg(rj));
    await sleep(1200);
  }
  await sleep(1500);
  check('Seller attempts go nearest-first: A → B → C', seq.join('>') === 'A>B>C', seq.join('>'));
  const w = await fulfillmentOf(id2);
  check('After 3 rejections the engine auto-escalates to the central warehouse (no manual step)', w.o?.fulfillment?.source === 'warehouse' && String(w.o?.fulfillment?.warehouseId) === ctx.sellers.W.id, `source=${w.o?.fulfillment?.source} state=${w.f?.state} level=${w.o?.fulfillment?.fallbackLevel} eta=${w.o?.fulfillment?.estimatedDeliveryMinutes}min`);
  const pkw = await api('PATCH', `/seller/orders/${id2}/status`, { token: ctx.sellers.W.token, body: { status: 'packed', note: 'warehouse packed' } });
  check('Warehouse marks order packed', pkw.ok, pkw.ok ? '' : errMsg(pkw));
  await riderDeliver(id2, cust, 'Warehouse order');
  const stockA1 = await sellerStock('A', 'A:atta');
  check('Rejected sellers\' reserved stock is released (A stock unchanged)', stockA0 === stockA1, `before=${stockA0} after=${stockA1}`);

  // 5c: warehouse tier switched off by admin, all local sellers reject -> courier (standard) fallback.
  const nw = await setFulfillment({ warehouseFallbackEnabled: false });
  check('Admin disables warehouse fallback via API', nw.ok, nw.ok ? '' : errMsg(nw));
  const o3 = await placeOrder(cust, 'A:atta', 1);
  const id3 = o3.data?.orderId || o3.data?.id;
  const seq3 = [];
  for (let i = 0; i < 4; i++) {
    const cur = await currentOffer(id3);
    if (!cur) break;
    seq3.push(cur.key);
    await reject(cur.key, id3, cur.offer, 'cannot_deliver');
    await sleep(1200);
  }
  await sleep(1500);
  const r3 = await fulfillmentOf(id3);
  check('A, B, C reject + no warehouse -> courier / standard delivery', r3.o?.fulfillment?.type === 'courier' || r3.o?.fulfilmentType === 'courier' || r3.o?.fulfillment?.deliveryMode === 'standard', `chain=${seq3.join('>')} type=${r3.o?.fulfillment?.type} mode=${r3.o?.fulfillment?.deliveryMode} state=${r3.f?.state} awb=${r3.o?.shipment?.awb || '-'}`);
  const fin3 = await api('GET', `/orders/${id3}`, { token: cust.token });
  check('Order stays alive (not cancelled) after exhausting local sellers', !['cancelled', 'failed'].includes(stOf(fin3.data)), `status=${stOf(fin3.data)}`);
  await setFulfillment({ warehouseFallbackEnabled: true });

  // 5d: seller silence → sweeper auto-escalates (real timeout, no manual reject).
  const tm = await setFulfillment({ sellerAcceptanceTimeoutSeconds: 15, fulfillmentSweeperIntervalSeconds: 5 });
  check('Admin shortens seller acceptance timeout to 15s via API', tm.ok, tm.ok ? '' : errMsg(tm));
  const o4 = await placeOrder(cust, 'A:atta', 1);
  const id4 = o4.data?.orderId || o4.data?.id;
  const first = await currentOffer(id4);
  check('Timeout test: seller A holds the first offer', first?.key === 'A', first?.key);
  // 15s acceptance timeout + up to one sweeper cycle; poll instead of a fixed sleep.
  const second = await waitFor(async () => { const c = await currentOffer(id4, 1); return c && c.key !== 'A' ? c : null; }, { tries: 50, every: 1000 });
  check('Timeout test: unanswered offer auto-expires and moves to the next seller', second && second.key !== 'A', `now with ${second?.key}`);
  await api('POST', `/orders/${id4}/cancel`, { token: cust.token });
  await setFulfillment({ sellerAcceptanceTimeoutSeconds: 120, fulfillmentSweeperIntervalSeconds: 15 });
}

async function crossCity() {
  section('PHASE 6 — Different cities: quick blocked out of range, standard delivery via courier');
  // Bhopal wants quick delivery of atta -> no seller within range.
  const bho = ctx.customers.bhopal;
  const q = await placeOrder(bho, 'A:atta', 1);
  check('Bhopal quick_shop order is refused with a clear "not deliverable" error', !q.ok && q.status === 409 && JSON.stringify(q.body).includes('QUICK_NOT_DELIVERABLE'), `HTTP ${q.status} ${q.body?.error?.message || ''}`);

  // Bhopal standard order from a Madhubani seller (~900km).
  const s = await placeOrder(bho, 'M:madhubani', 1);
  const sid = s.data?.orderId || s.data?.id;
  check('Bhopal places standard order for Madhubani painting (seller in Bihar)', s.ok && sid, s.ok ? `charge=${s.data?.deliveryCharge ?? '-'} total=${s.data?.total ?? '-'}` : errMsg(s));
  if (!sid) return;
  const { o, f } = await fulfillmentOf(sid);
  check('Standard order uses courier + standard mode (no quick offer, no rider)', o?.fulfilmentType === 'courier' && o?.fulfillment?.deliveryMode !== 'quick', `fulfilmentType=${o?.fulfilmentType} type=${o?.fulfillment?.type} mode=${o?.fulfillment?.deliveryMode} deliveryType=${o?.deliveryType}`);
  check('Courier shipment / AWB created for the standard order', Boolean(o?.shipment?.awb), `awb=${o?.shipment?.awb} provider=${o?.shipment?.provider || o?.shipment?.courierName}`);
  check('Standard order has NO delivery promise minutes', !o?.deliveryPromiseMinutes, `promise=${o?.deliveryPromiseMinutes}`);
  const seen = await api('GET', `/seller/orders/${sid}`, { token: ctx.sellers.M.token });
  check('Seller M (Madhubani) sees the Bhopal order in their panel', seen.ok, seen.ok ? '' : errMsg(seen));
  const rider = await api('GET', '/delivery/orders', { token: ctx.riders.R1.token });
  check('Local riders are NOT offered a courier/standard order', !listOf(rider.data).some((x) => idOf(x.orderId || x) === String(sid)));
  for (const st of ['confirmed', 'packed']) {
    const u = await api('PATCH', `/seller/orders/${sid}/status`, { token: ctx.sellers.M.token, body: { status: st, note: 'e2e' } });
    check(`Seller M marks standard order ${st}`, u.ok, u.ok ? '' : errMsg(u));
  }
  const trk = await api('GET', `/orders/${sid}/tracking`, { token: bho.token });
  check('Customer tracking shows courier AWB for standard order', trk.ok && JSON.stringify(trk.data).includes(String(o?.shipment?.awb || '__none__')), trk.ok ? '' : errMsg(trk));

  // Patna: two sellers in two different states in one order.
  const pat = ctx.customers.patna;
  const pm = ctx.products['M:madhubani']; const pj = ctx.products['J:kurta'];
  const multi = await api('POST', '/orders', { token: pat.token, body: { addressId: pat.addressId, paymentMethod: 'cod', items: [{ productId: pm.id, listingId: pm.listingId, quantity: 1 }, { productId: pj.id, listingId: pj.listingId, quantity: 2 }] } });
  const mid = multi.data?.orderId || multi.data?.id;
  check('Patna places ONE order with items from Madhubani + Jaipur sellers', multi.ok && mid, multi.ok ? '' : errMsg(multi));
  if (mid) {
    const { o: mo } = await fulfillmentOf(mid);
    check('Order splits into 2 seller sub-orders', (mo?.sellerSubOrders || []).length === 2, `subOrders=${(mo?.sellerSubOrders || []).length}`);
    const expected = pm.price * 1 + pj.price * 2;
    check('Order subtotal matches listing prices (1899 + 2×1299)', Math.round(mo?.subtotal) === expected, `subtotal=${mo?.subtotal} expected=${expected}`);
    for (const k of ['M', 'J']) {
      const v = await api('GET', `/seller/orders/${mid}`, { token: ctx.sellers[k].token });
      check(`Seller ${k} sees only their own line in the Patna order`, v.ok, v.ok ? '' : errMsg(v));
    }
  }
}


async function dynamicsAndAdmin() {
  section('PHASE 7 — Dynamic config, cancellation, stock, admin/seller/rider visibility');
  const cust = ctx.customers.indore;

  // Radius is an admin setting, not a constant: shrink it and the same customer is no longer serviceable.
  const r1 = await setFulfillment({ sellerSearchRadiusKm: 1 });
  check('Admin sets quick-delivery radius to 1 km', r1.ok, r1.ok ? '' : errMsg(r1));
  const tight = await placeOrder(cust, 'A:atta', 1);
  check('Radius 1 km: seller A (1.34 km) can no longer serve → checkout refused with QUICK_NOT_DELIVERABLE', !tight.ok && JSON.stringify(tight.body).includes('QUICK_NOT_DELIVERABLE'), `HTTP ${tight.status}`);
  const feedTight = await api('GET', '/maps/nearby/products', { query: { lat: cust.lat, lng: cust.lng, commerceFlow: 'quick_shop', limit: 50 } });
  const ids = listOf(feedTight.data).map((x) => String(x.productId || x.id || x._id));
  check('Radius 1 km: feed drops the Palasia seller listing (browse and checkout agree)', feedTight.ok && !ids.includes(String(ctx.products['A:atta'].id)), `${ids.length} items`);
  check('Radius 1 km: radius-free central warehouse listing still shown (by design)', ids.includes(String(ctx.products['W:atta'].id)));
  const r2 = await setFulfillment({ sellerSearchRadiusKm: 10 });
  check('Admin restores radius to 10 km', r2.ok);
  const loose = await placeOrder(cust, 'A:atta', 1);
  check('Radius 10 km: same order is accepted immediately (no restart / cache lag)', loose.ok, loose.ok ? '' : errMsg(loose));

  // Cancel before any seller accepts.
  const cid = loose.data?.orderId || loose.data?.id;
  if (cid) {
    const stockBefore = await sellerStock('A', 'A:atta');
    const cx = await api('POST', `/orders/${cid}/cancel`, { token: cust.token });
    check('Customer cancels an order while offer is pending', cx.ok, cx.ok ? '' : errMsg(cx));
    await sleep(1500);
    const f = await fulfillmentOf(cid);
    const stat = await api('GET', `/orders/${cid}`, { token: cust.token });
    check('Cancelled order shows cancelled', stOf(stat.data) === 'cancelled', `status=${stOf(stat.data)}`);
    const gone = await api('GET', '/seller/fulfillment/offers', { token: ctx.sellers.A.token });
    check('Pending offer disappears from seller A\'s queue after cancel', !listOf(gone.data).some((x) => idOf(x.orderId || x.order) === String(cid)), `fulfillment.state=${f.f?.state}`);
    const stockAfter = await sellerStock('A', 'A:atta');
    check('Stock is restored after cancel', stockAfter >= stockBefore, `before=${stockBefore} after=${stockAfter}`);
  }

  // Stock limits
  const big = await placeOrder(ctx.customers.indore, 'A:atta', 100);
  check('Ordering more than available stock is refused', !big.ok, `HTTP ${big.status} ${big.body?.error?.message || ''}`);

  // Unauthorized cross-access
  const foreign = await api('GET', `/orders/${ctx.orders.quick.id}`, { token: ctx.customers.bhopal.token });
  check('Another customer cannot read the Indore order', !foreign.ok, `HTTP ${foreign.status}`);
  const sFor = await api('GET', `/seller/orders/${ctx.orders.quick.id}`, { token: ctx.sellers.M.token });
  check('Unrelated seller (Madhubani) cannot read the Indore order', !sFor.ok, `HTTP ${sFor.status}`);
  const noAuth = await api('POST', '/orders', { body: {} });
  check('Placing an order without login is refused', noAuth.status === 401, `HTTP ${noAuth.status}`);

  // Admin visibility
  const ao = await api('GET', '/admin/orders', { token: ctx.admin, query: { limit: 100 } });
  const aItems = listOf(ao.data);
  check('Admin order list includes the orders from this run', ao.ok && aItems.length >= 5, `${aItems.length} orders listed`);
  const af = await api('GET', '/admin/fulfillment/orders', { token: ctx.admin, query: { limit: 100 } });
  check('Admin fulfillment monitor lists fulfillments with states', af.ok && listOf(af.data).length >= 5, `${listOf(af.data).length} fulfillments`);
  const states = [...new Set(listOf(af.data).map((x) => x.state))];
  check('Monitor shows a mix of states (delivered/warehouse/courier flows all represented)', states.length >= 3, states.join(','));
  const ds = await api('GET', '/admin/dashboard/stats', { token: ctx.admin });
  check('Admin dashboard stats load', ds.ok, ds.ok ? '' : errMsg(ds));
  const dbDelivered = await dbc('orders').countDocuments({ status: 'delivered' });
  check('Dashboard/reports agree with DB on delivered orders', dbDelivered >= 2, `DB delivered=${dbDelivered}`);

  // Seller & rider money views after deliveries
  const se = await api('GET', '/seller/earnings', { token: ctx.sellers.A.token });
  check('Seller A earnings endpoint loads after a delivered order', se.ok, se.ok ? JSON.stringify(se.data).slice(0, 120) : errMsg(se));
  const sd = await api('GET', '/seller/dashboard', { token: ctx.sellers.A.token });
  check('Seller A dashboard loads', sd.ok, sd.ok ? '' : errMsg(sd));
  const re = await api('GET', '/delivery/earnings', { token: ctx.riders.R1.token });
  check('Rider earnings endpoint loads after deliveries', re.ok, re.ok ? JSON.stringify(re.data).slice(0, 120) : errMsg(re));
  const wre = await api('GET', '/seller/earnings', { token: ctx.sellers.W.token });
  check('Warehouse earnings endpoint loads', wre.ok, wre.ok ? '' : errMsg(wre));
}

async function main() {
  console.log(`E2E run ${RUN} against ${BASE}`);
  await setup();
  await catalog();
  await customers();
  await quickHappyPath();
  await cascadeAndFallback();
  await crossCity();
  await dynamicsAndAdmin();
  report();
}

function report() {
  const pass = results.filter((r) => r.ok).length;
  console.log(`\n==== ${pass}/${results.length} checks passed, ${bugs.length} bugs recorded ====`);
  fs.writeFileSync(path.join(__dirname, '..', 'test-reports', `e2e-multicity-${RUN}.json`), JSON.stringify({ RUN, results, bugs }, null, 2));
}

main().then(() => process.exit(0)).catch((e) => { console.error('E2E crashed:', e); report(); process.exit(2); });
