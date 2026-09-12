/**
 * CR-002 E2E harness — talks to the REAL backend.
 *
 * Authentication is done over the API and the resulting tokens are seeded into
 * localStorage. That is a setup step, not the thing under test: the seller
 * portal signs in by OTP, and driving that per test would add flakiness without
 * exercising any part of the fulfillment path these specs exist to protect.
 *
 * Nothing else is shortcut. Orders are placed through the real checkout
 * endpoint, the real engine picks the seller, and the browser is asserted
 * against whatever the backend actually did.
 */
import { MongoClient, ObjectId } from 'mongodb';

const API = 'http://127.0.0.1:5000/api/v1';

/** Seeded staging fixtures (backend/scripts/seed-sellers.js). */
export const FIXTURES = {
  seller: { email: 'amit.seller@mithilakart.com', password: 'Seller@12345' },
  sellerId: '6a843eadfef978378ffb48c4',
  customerPhone: '9999999999',
  countryCode: '+91',
  addressId: '6a844bc0081d5cb31a8fa2a8',
  // Quick-commerce product stocked by the seller above.
  productId: '6a843eadfef978378ffb48c8',
};

/**
 * Production readiness Pass 3 (2026-08-25) — deterministic courier-fallback
 * fixture (backend/scripts/seed-cr002-test-data.js). Every candidate sharing
 * this catalogKey has isAcceptingOrders=false (real stock, so order
 * placement itself succeeds; ineligible for the fulfillment engine's own
 * seller selection), so ordering the origin product genuinely forces the
 * engine through the whole ladder to courier every single run. Replaces
 * Pass 2's Scenario C, which reused the default FIXTURES.productId (which
 * has an eligible local seller) and only reached courier by incidental
 * luck, then asserted after an arbitrary fixed sleep instead of waiting for
 * the real state transition.
 */
export const COURIER_FIXTURES = {
  // "CR002TEST-CO-A-ATTA" — the origin product a customer actually orders;
  // its own seller (CO-A) is paused, same as CO-B/CO-C/CO-W.
  productId: '6a8d6626e94638eba5d830b0',
};

/**
 * Production readiness Pass 3 (2026-08-25) — seeded delivery partner
 * (backend/scripts/seed-auth.js: "Demo Delivery Partner"). Location was
 * updated via the real PATCH /delivery/location endpoint to sit at the same
 * coordinates as FIXTURES.seller (Patna) — it previously sat in Indore,
 * ~1,700km from every order fixture, so no delivery offer could ever
 * geographically reach it.
 */
export const DELIVERY_FIXTURES = {
  phone: '9123456789',
  countryCode: '+91',
  partnerId: '6a5e15b0d069a283d6c1f98e',
};

/**
 * Production readiness Pass 3 (2026-08-25): the IP-scoped authLogin
 * rate-limit (10/15min) is shared across every seller/customer login this
 * harness makes plus any diagnostic curl calls run from the same machine —
 * exhausting it mid-suite was the root cause of most of Pass 2's spurious
 * E2E failures. Set E2E_TEST_TOKEN to the SAME value as the backend's own
 * .env before running this suite; the backend's own config forces this to
 * be a no-op under NODE_ENV=production regardless, so leaving it unset here
 * simply means the real rate limit applies, same as any other client.
 */
const E2E_TEST_TOKEN = process.env.E2E_TEST_TOKEN || null;

export async function api(path, { method = 'GET', body = null, token = null } = {}) {
  const res = await fetch(API + path, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(E2E_TEST_TOKEN ? { 'X-E2E-Test-Token': E2E_TEST_TOKEN } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const text = await res.text();
  let json = null;
  try { json = JSON.parse(text); } catch { /* non-JSON error page */ }

  return { status: res.status, json, ok: res.ok, body: json?.data ?? null };
}

/*
 * Cached for the whole run, like the customer session.
 *
 * Seller login is rate-limited to 10 attempts per 15 minutes. Each spec needs
 * the token twice (cleanup + portal setup), so an uncached login exhausts the
 * budget after five specs and the rest fail on 429 — a harness artefact that
 * looks exactly like a product failure in the report.
 */
let sellerSession = null;

export async function loginSeller({ force = false } = {}) {
  if (sellerSession && !force) return sellerSession;

  const res = await api('/seller/auth/login', { method: 'POST', body: FIXTURES.seller });
  if (!res.ok) throw new Error(`Seller login failed (${res.status}): ${JSON.stringify(res.json)}`);

  sellerSession = {
    accessToken: res.body.tokens.accessToken,
    refreshToken: res.body.tokens.refreshToken,
    seller: res.body.seller,
  };

  return sellerSession;
}

/*
 * Cached for the whole run.
 *
 * Customer sign-in is OTP-based and the API rate-limits resends, so
 * authenticating per test exhausts the cooldown and the suite starts failing on
 * "devOtp not returned" — an artefact of the harness, not of the product. The
 * access token stays valid well beyond a suite, and nothing under test depends
 * on a fresh login.
 */
let customerSession = null;

export async function loginCustomer({ force = false } = {}) {
  if (customerSession && !force) return customerSession;

  const send = await api('/auth/send-phone-otp', {
    method: 'POST',
    body: { phone: FIXTURES.customerPhone, countryCode: FIXTURES.countryCode },
  });

  // Requires EXPOSE_OTP_IN_DEV=true, which is the staging default.
  const otp = send.body?.devOtp;
  if (!otp) {
    throw new Error(
      `devOtp not returned (status ${send.status}). Either EXPOSE_OTP_IN_DEV is off, `
      + `or the OTP resend cooldown is active: ${JSON.stringify(send.json)}`
    );
  }

  const verify = await api('/auth/verify-phone-otp', {
    method: 'POST',
    body: { phone: FIXTURES.customerPhone, countryCode: FIXTURES.countryCode, otp },
  });
  if (!verify.ok) throw new Error(`Customer login failed: ${JSON.stringify(verify.json)}`);

  customerSession = {
    accessToken: verify.body?.tokens?.accessToken,
    refreshToken: verify.body?.tokens?.refreshToken,
    user: verify.body?.user,
  };
  return customerSession;
}

/** Seeds customer tokens into localStorage so the browser is authenticated as customer. */
export async function seedCustomerAuth(page, auth = null) {
  const session = auth || await loginCustomer();
  await page.goto('/login');
  await page.evaluate(([access, refresh, user]) => {
    localStorage.setItem('customer_access_token', access);
    if (refresh) localStorage.setItem('customer_refresh_token', refresh);
    if (user) localStorage.setItem('customer_user', JSON.stringify(user));
    localStorage.setItem('isAuthenticated', 'true');
    window.dispatchEvent(new Event('customer-auth-changed'));
  }, [session.accessToken, session.refreshToken || '', session.user || {}]);
}

/** Lands the browser on any customer page with authentication pre-seeded. */
export async function openCustomerPortal(page, { path = '/' } = {}) {
  await seedCustomerAuth(page);
  await page.goto(path);
  await dismissLocationPrompt(page);
}

/** Helper to create cart item structure. */
export async function createCartItem(productId, quantity = 1) {
  return { productId, quantity };
}

/** Places a REAL quick_shop order. The engine picks the seller, not this code. */
export async function placeQuickOrder(token, { quantity = 1, productId = FIXTURES.productId } = {}) {
  const res = await api('/orders', {
    method: 'POST',
    token,
    body: {
      items: [{ productId, quantity }],
      addressId: FIXTURES.addressId,
      paymentMethod: 'cod',
      commerceFlow: 'quick_shop',
      idempotencyKey: `cr002-e2e-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    },
  });

  if (!res.ok) throw new Error(`Order placement failed (${res.status}): ${JSON.stringify(res.json)}`);
  return { orderId: res.body.orderId, orderNumber: res.body.orderNumber };
}

/** Seeds seller tokens then lands the browser on the given seller page. */
export async function openSellerPortal(page, { path = '/seller/dashboard' } = {}) {
  const { accessToken, refreshToken, seller } = await loginSeller();

  // Must be on the origin before localStorage is writable.
  await page.goto('/seller/login');
  await page.evaluate(([access, refresh, data]) => {
    sessionStorage.setItem('splashShown', 'true');
    localStorage.setItem('seller_token', access);
    localStorage.setItem('seller_refresh_token', refresh);
    localStorage.setItem('seller_data', data);
  }, [accessToken, refreshToken, JSON.stringify(seller)]);

  await page.goto(path);
  await dismissLocationPrompt(page);

  return { accessToken, seller };
}

/**
 * Production readiness Pass 3 (2026-08-25) — same cache/rationale as
 * loginSeller: the delivery portal's OTP send shares the same phone-scoped
 * limit as customer OTP, so an uncached login per test would exhaust it
 * across a multi-test file exactly like Pass 2 documented for the seller
 * login. DELIVERY_FIXTURES.phone is on the OTP_SEND_LIMIT_BYPASS_PHONES
 * allowlist regardless, but caching keeps the suite from needlessly
 * consuming that budget it doesn't need to.
 */
let deliverySession = null;

export async function loginDelivery({ force = false } = {}) {
  if (deliverySession && !force) return deliverySession;

  const send = await api('/delivery/auth/send-otp', {
    method: 'POST',
    body: { phone: DELIVERY_FIXTURES.phone, countryCode: DELIVERY_FIXTURES.countryCode },
  });

  const otp = send.body?.devOtp;
  if (!otp) {
    throw new Error(
      `devOtp not returned (status ${send.status}) for delivery login. ${JSON.stringify(send.json)}`
    );
  }

  const verify = await api('/delivery/auth/verify-otp', {
    method: 'POST',
    body: { phone: DELIVERY_FIXTURES.phone, countryCode: DELIVERY_FIXTURES.countryCode, otp },
  });
  if (!verify.ok) throw new Error(`Delivery login failed: ${JSON.stringify(verify.json)}`);

  deliverySession = {
    accessToken: verify.body.tokens.accessToken,
    refreshToken: verify.body.tokens.refreshToken,
    partner: verify.body.partner,
  };

  return deliverySession;
}

/** Seeds delivery-partner tokens then lands the browser on the given page. */
export async function openDeliveryPortal(page, { path = '/delivery/dashboard' } = {}) {
  const { accessToken, refreshToken, partner } = await loginDelivery();

  // Must be on the origin before localStorage is writable. Key names match
  // shared/api/tokenStorage.js's PORTAL_KEYS.delivery exactly.
  await page.goto('/delivery/auth');
  await page.evaluate(([access, refresh, data]) => {
    localStorage.setItem('delivery_access_token', access);
    localStorage.setItem('delivery_refresh_token', refresh);
    localStorage.setItem('delivery_user', data);
    localStorage.setItem('isDeliveryAuthenticated', 'true');
  }, [accessToken, refreshToken, JSON.stringify(partner)]);

  await page.goto(path);
  await dismissLocationPrompt(page);

  return { accessToken, partner };
}

/** Ensures the seeded delivery partner is online, via the real API. */
export async function ensureDeliveryOnline() {
  const { accessToken } = await loginDelivery();
  const res = await api('/delivery/status', { method: 'PATCH', token: accessToken, body: { isOnline: true } });
  if (!res.ok) throw new Error(`Failed to set delivery partner online: ${JSON.stringify(res.json)}`);
  return res.body;
}

/**
 * Production readiness Pass 3 (2026-08-25) — seeded via
 * backend/scripts/seed-auth.js, which explicitly preserves and upserts only
 * this one real admin account (email hardcoded in that script) rather than
 * creating a disposable fixture; SEED_ADMIN_PASSWORD in .env sets its known
 * test password. Same login cache rationale as loginSeller/loginDelivery.
 */
export const ADMIN_FIXTURES = {
  email: 'palakpatel0342@gmail.com',
  password: 'Admin@12345',
};

let adminSession = null;

export async function loginAdmin({ force = false } = {}) {
  if (adminSession && !force) return adminSession;

  const res = await api('/admin/auth/login', { method: 'POST', body: ADMIN_FIXTURES });
  if (!res.ok) throw new Error(`Admin login failed (${res.status}): ${JSON.stringify(res.json)}`);

  adminSession = {
    accessToken: res.body.tokens.accessToken,
    refreshToken: res.body.tokens.refreshToken,
    admin: res.body.admin,
  };

  return adminSession;
}

/** Seeds admin tokens then lands the browser on the given admin page. */
export async function openAdminPortal(page, { path = '/admin/dashboard' } = {}) {
  const { accessToken, refreshToken, admin } = await loginAdmin();

  // Must be on the origin before localStorage is writable. Key names match
  // shared/api/tokenStorage.js's PORTAL_KEYS.admin exactly.
  await page.goto('/admin/login');
  await page.evaluate(([access, refresh, data]) => {
    localStorage.setItem('adminToken', access);
    localStorage.setItem('admin_refresh_token', refresh);
    localStorage.setItem('admin_user', data);
    localStorage.setItem('isAdminAuthenticated', 'true');
  }, [accessToken, refreshToken, JSON.stringify(admin)]);

  await page.goto(path);
  await dismissLocationPrompt(page);

  return { accessToken, admin };
}

/**
 * Closes the app-wide "Use live location" prompt.
 *
 * It renders over the whole viewport and swallows clicks aimed at anything
 * beneath it, so Accept/Reject on the offer popup silently never fired — the
 * click landed on the overlay and no request reached the API. Dismissing it is
 * what a real seller does before touching anything else.
 */
export async function dismissLocationPrompt(page) {
  for (const name of [/not now/i, /^close$/i]) {
    const button = page.getByRole('button', { name });
    if (await button.count()) {
      await button.first().click({ timeout: 5_000 }).catch(() => { /* already gone */ });
    }
  }
}

/**
 * Resolves once the seller socket is connected.
 *
 * Without this the test can place an order before the client has joined its
 * room, and would then be asserting a genuine but untested race rather than the
 * behaviour under test.
 */
export async function waitForSellerSocket(page, timeout = 30_000) {
  await page.waitForFunction(
    () => window.__cr002SocketConnected === true,
    null,
    { timeout }
  ).catch(() => { /* falls through to the offer assertion, which is the real gate */ });
}

/** Reads the seller's live offers straight from the API (backend truth). */
export async function getOffers(token) {
  const res = await api('/seller/fulfillment/offers', { token });
  return res.body?.items ?? [];
}

/**
 * Rejects every offer already pending for this seller.
 *
 * Offers survive across test runs (they live in MongoDB until answered or
 * expired), so without this a spec asserts against whichever offer happens to
 * be first — usually a leftover from an earlier run. Rejecting through the real
 * endpoint also keeps the engine's state machine consistent, rather than
 * deleting rows behind its back.
 */
export async function clearPendingOffers(token) {
  const offers = await getOffers(token);

  for (const offer of offers) {
    await api(`/seller/orders/${offer.orderId}/reject`, {
      method: 'POST',
      token,
      body: { attemptId: offer.attemptId, reason: 'too_busy' },
    });
  }

  return offers.length;
}

/**
 * Production readiness Pass 3 (2026-08-25) — poll the REAL order document
 * until a condition holds, instead of an arbitrary fixed sleep.
 *
 * Pass 2's Scenario C waited a flat 5 seconds regardless of the configured
 * `searchTimeoutSeconds`/`sellerAcceptanceTimeoutSeconds`, so it could read
 * the order mid-escalation and fail on a state that was correct a few
 * seconds later — a genuine test-timing bug, not a product defect (verified
 * by re-querying the same order immediately after: it had reached
 * `fallbackLevel: 2` correctly, just after the fixed window closed). This
 * polls the actual persisted state and returns as soon as `predicate` is
 * true, so the test only ever waits as long as the real engine actually
 * takes — never an arbitrary number invented in advance.
 */
export async function waitForOrderCondition(orderId, predicate, {
  timeoutMs = 90_000, intervalMs = 1_000,
} = {}) {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017';
  const client = new MongoClient(uri);
  const deadline = Date.now() + timeoutMs;

  try {
    await client.connect();
    const coll = client.db('mithilakart').collection('orders');

    let lastOrder = null;
    while (Date.now() < deadline) {
      lastOrder = await coll.findOne({ _id: new ObjectId(orderId) });
      if (lastOrder && predicate(lastOrder)) {
        return lastOrder;
      }
      await new Promise((resolve) => setTimeout(resolve, intervalMs));
    }

    throw new Error(
      `waitForOrderCondition timed out after ${timeoutMs}ms. `
      + `Last observed fulfillment: ${JSON.stringify(lastOrder?.fulfillment ?? null)}`
    );
  } finally {
    await client.close();
  }
}
