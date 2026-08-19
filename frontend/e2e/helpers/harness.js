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

export async function api(path, { method = 'GET', body = null, token = null } = {}) {
  const res = await fetch(API + path, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
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

  customerSession = { accessToken: verify.body.tokens.accessToken };
  return customerSession;
}

/** Places a REAL quick_shop order. The engine picks the seller, not this code. */
export async function placeQuickOrder(token, { quantity = 1 } = {}) {
  const res = await api('/orders', {
    method: 'POST',
    token,
    body: {
      items: [{ productId: FIXTURES.productId, quantity }],
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
    localStorage.setItem('seller_token', access);
    localStorage.setItem('seller_refresh_token', refresh);
    localStorage.setItem('seller_data', data);
  }, [accessToken, refreshToken, JSON.stringify(seller)]);

  await page.goto(path);
  await dismissLocationPrompt(page);

  return { accessToken, seller };
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
