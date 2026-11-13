// @ts-check
/**
 * UI sweep — logs into each portal through its real login form, discovers every
 * navigation link, visits each page and records: uncaught page errors, console
 * errors, failed API calls (>=400, ignoring 401 before login), horizontal
 * overflow on mobile, and empty screens. Screenshots go to e2e-shots/.
 *
 * Needs: backend on :5000 against an ISOLATED database, vite on :3000.
 * Env:   SWEEP_SELLER_EMAIL / SWEEP_SELLER_PASSWORD (a seller approved in that DB)
 */
import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const OUT = path.resolve('e2e-shots');
fs.mkdirSync(OUT, { recursive: true });
const REPORT = path.join(OUT, 'ui-sweep-report.json');
const issues = [];
const visited = [];

const INDORE = { latitude: 22.7175147, longitude: 75.871946 };
const SELLER_EMAIL = process.env.SWEEP_SELLER_EMAIL || 'seller@example.com';
const SELLER_PASSWORD = process.env.SWEEP_SELLER_PASSWORD || 'Seller@12345';

function watch(page, portal) {
  const cur = { url: '' };
  page.on('pageerror', (e) => issues.push({ portal, kind: 'pageerror', url: page.url(), msg: String(e.message).slice(0, 300) }));
  page.on('console', (m) => {
    if (m.type() !== 'error') return;
    const t = m.text();
    if (/favicon|Download the React DevTools|Failed to load resource.*(401|404)/i.test(t)) return;
    issues.push({ portal, kind: 'console', url: page.url(), msg: t.slice(0, 300) });
  });
  page.on('response', (r) => {
    const u = r.url();
    if (!u.includes('/api/v1/')) return;
    if (r.status() >= 500 || (r.status() >= 400 && r.status() !== 401 && r.status() !== 404 && r.status() !== 409 && r.status() !== 422)) {
      issues.push({ portal, kind: 'api', url: page.url(), msg: `${r.request().method()} ${u.replace(/^.*\/api\/v1/, '')} -> ${r.status()}` });
    }
    if (r.status() >= 500) return;
  });
  return cur;
}

async function inspect(page, portal, label) {
  await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(600);
  const m = await page.evaluate(() => ({
    textLen: (document.body.innerText || '').trim().length,
    overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    broken: [...document.images].filter((i) => i.complete && i.naturalWidth === 0 && i.src && !i.src.startsWith('data:')).length,
    errorText: /something went wrong|cannot read prop|undefined is not|unexpected error/i.test(document.body.innerText || ''),
  }));
  const rec = { portal, label, url: page.url(), ...m };
  visited.push(rec);
  if (m.textLen < 25) issues.push({ portal, kind: 'blank', url: page.url(), msg: `page has only ${m.textLen} chars of text` });
  if (m.overflow > 4) issues.push({ portal, kind: 'overflow', url: page.url(), msg: `horizontal overflow ${m.overflow}px` });
  if (m.broken > 0) issues.push({ portal, kind: 'broken-image', url: page.url(), msg: `${m.broken} broken <img>` });
  if (m.errorText) issues.push({ portal, kind: 'error-text', url: page.url(), msg: 'error message visible on screen' });
  const file = `${portal}-${label.replace(/[^a-z0-9]+/gi, '_').slice(0, 50)}.png`;
  await page.screenshot({ path: path.join(OUT, file), fullPage: false }).catch(() => {});
}

async function crawl(page, portal, prefix, max = 40) {
  const hrefs = await page.$$eval(`a[href^="${prefix}"]`, (as) => [...new Set(as.map((a) => a.getAttribute('href')))]);
  const targets = hrefs.filter((h) => h && !h.includes(':') && !/logout/i.test(h)).slice(0, max);
  for (const h of targets) {
    await page.goto(h, { waitUntil: 'domcontentloaded' }).catch(() => {});
    await inspect(page, portal, h);
  }
  return targets.length;
}

test.afterAll(() => {
  fs.writeFileSync(REPORT, JSON.stringify({ visited, issues }, null, 2));
});

test.describe.configure({ mode: 'serial' });
test.setTimeout(480_000);

test('Customer (mobile, live location Indore): login, browse every tab, buy from Quick Shop', async ({ browser }) => {
  const ctx = await browser.newContext({
    viewport: { width: 390, height: 844 },
    geolocation: INDORE,
    permissions: ['geolocation'],
  });
  const page = await ctx.newPage();
  watch(page, 'customer');
  await page.goto('/login', { waitUntil: 'domcontentloaded' });
  await inspect(page, 'customer', 'login');
  const allow = page.getByRole('button', { name: /allow live location/i });
  if (await allow.isVisible().catch(() => false)) await allow.click();
  const phone = '9' + String(Date.now()).slice(-9);
  await page.locator('input[type=tel]').fill(phone);
  await page.getByRole('button', { name: /send otp/i }).click();
  // OTP boxes: either six single inputs or one input
  const otpInputs = page.locator('input[inputmode="numeric"], input[autocomplete="one-time-code"], input[maxlength="1"]');
  await otpInputs.first().waitFor({ state: 'visible', timeout: 15000 }).catch(() => {});
  const n = await otpInputs.count();
  if (n >= 6) { for (let i = 0; i < 6; i++) await otpInputs.nth(i).fill('123456'[i]); }
  else if (n >= 1) { await otpInputs.first().fill('123456'); }
  await page.getByRole('button', { name: /^s*(verify|login|log in|submit)/i }).last().click().catch(() => {});
  await page.waitForTimeout(2000);
  await inspect(page, 'customer', 'after-login');
  const loggedIn = await page.evaluate(() => Object.keys(localStorage).some((k) => /token|auth|user/i.test(k)));
  if (!loggedIn) issues.push({ portal: 'customer', kind: 'login', url: page.url(), msg: 'no auth state after OTP login via UI' });
  expect(loggedIn).toBeTruthy();

  for (const route of ['/', '/quick-shop', '/mithilak', '/fresh-grocery', '/search', '/cart', '/wishlist', '/wallet', '/profile', '/profile/orders', '/profile/addresses', '/categories', '/deals']) {
    await page.goto(route, { waitUntil: 'domcontentloaded' }).catch(() => {});
    await inspect(page, 'customer', route);
  }

  // Real purchase attempt in Quick Shop.
  await page.goto('/quick-shop', { waitUntil: 'networkidle' }).catch(() => {});
  await page.waitForTimeout(1500);
  const hasAtta = await page.getByText(/Aashirvaad Atta/i).first().isVisible().catch(() => false);
  if (!hasAtta) issues.push({ portal: 'customer', kind: 'flow', url: page.url(), msg: 'Quick Shop shows no product for a customer standing in Indore with live location granted' });
  await inspect(page, 'customer', 'quickshop-feed');
  await page.getByText(/Aashirvaad Atta/i).first().click().catch(() => {});
  await page.waitForLoadState('networkidle').catch(() => {});
  await inspect(page, 'customer', 'product-detail');
  const add = page.getByRole('button', { name: /add to bag/i }).first();
  if (await add.isVisible().catch(() => false)) {
    await add.click();
    await page.waitForTimeout(1200);
    await page.goto('/cart', { waitUntil: 'networkidle' }).catch(() => {});
    await inspect(page, 'customer', 'cart-with-item');
    const inCart = await page.getByText(/Aashirvaad Atta/i).first().isVisible().catch(() => false);
    if (!inCart) issues.push({ portal: 'customer', kind: 'flow', url: page.url(), msg: 'Item added to bag does not show in cart' });
    const checkout = page.getByRole('button', { name: /checkout|place order|proceed/i }).first();
    if (await checkout.isVisible().catch(() => false)) {
      await checkout.click();
      await page.waitForTimeout(2000);
      await inspect(page, 'customer', 'checkout');
      const noAddr = await page.getByText(/no address provided/i).first().isVisible().catch(() => false);
      if (noAddr) {
        // New customer: the live location must be offered as the delivery address.
        const useLive = page.getByRole('button', { name: /use my current location/i });
        if (await useLive.isVisible().catch(() => false)) {
          await useLive.click();
          await page.waitForTimeout(2500);
          await inspect(page, 'customer', 'checkout-live-address');
          const stillNone = await page.getByText(/no address provided/i).first().isVisible().catch(() => false);
          if (stillNone) issues.push({ portal: 'customer', kind: 'flow', url: page.url(), msg: 'Use-my-current-location did not set a delivery address' });
        } else {
          issues.push({ portal: 'customer', kind: 'flow', url: page.url(), msg: 'New customer with live location sees no "Use my current location" action at checkout' });
        }
      }
      await page.getByRole('button', { name: /continue/i }).last().click().catch(() => {});
      await page.waitForTimeout(2000);
      await inspect(page, 'customer', 'checkout-after-continue');
      const cod = page.getByText(/cash on delivery|cod/i).first();
      if (await cod.isVisible().catch(() => false)) await cod.click().catch(() => {});
      const place = page.getByRole('button', { name: /place order|confirm order|pay/i }).last();
      if (await place.isVisible().catch(() => false)) {
        await place.click();
        await page.waitForTimeout(3500);
        await inspect(page, 'customer', 'after-place-order');
        if (!/order-confirmation|orders/.test(page.url())) issues.push({ portal: 'customer', kind: 'flow', url: page.url(), msg: 'Placing order from checkout did not reach confirmation' });
      } else {
        issues.push({ portal: 'customer', kind: 'flow', url: page.url(), msg: 'No place-order button on checkout' });
      }
    } else {
      issues.push({ portal: 'customer', kind: 'flow', url: page.url(), msg: 'No checkout button on cart page' });
    }
  } else {
    issues.push({ portal: 'customer', kind: 'flow', url: page.url(), msg: 'No Add to Bag button on product page' });
  }
  await ctx.close();
});

test('Seller panel: login form, every nav page', async ({ page }) => {
  watch(page, 'seller');
  await page.setViewportSize({ width: 1366, height: 800 });
  await page.goto('/seller/login', { waitUntil: 'domcontentloaded' });
  await page.locator('input[type=email]').fill(SELLER_EMAIL);
  await page.locator('input[type=password]').fill(SELLER_PASSWORD);
  await page.getByRole('button', { name: /sign in/i }).click();
  await page.waitForURL(/\/seller\/(?!login)/, { timeout: 20000 }).catch(() => {});
  await inspect(page, 'seller', 'dashboard');
  if (/login/.test(page.url())) issues.push({ portal: 'seller', kind: 'login', url: page.url(), msg: 'seller login via UI did not leave /seller/login' });
  const n = await crawl(page, 'seller', '/seller');
  expect(n).toBeGreaterThan(3);
});

test('Admin panel: login form, every nav page', async ({ page }) => {
  watch(page, 'admin');
  await page.setViewportSize({ width: 1366, height: 800 });
  await page.goto('/admin/login', { waitUntil: 'domcontentloaded' });
  await page.locator('input[type=text]').first().fill('palakpatel0342@gmail.com');
  await page.locator('input[type=password]').fill('Admin@12345');
  await page.getByRole('button', { name: /sign in/i }).click();
  await page.waitForURL(/\/admin\/(?!login)/, { timeout: 20000 }).catch(() => {});
  await inspect(page, 'admin', 'dashboard');
  if (/login/.test(page.url())) issues.push({ portal: 'admin', kind: 'login', url: page.url(), msg: 'admin login via UI did not leave /admin/login' });
  const n = await crawl(page, 'admin', '/admin', 60);
  expect(n).toBeGreaterThan(5);
});

test('Delivery app (mobile): OTP login, dashboard, orders', async ({ browser }) => {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, geolocation: INDORE, permissions: ['geolocation'] });
  const page = await ctx.newPage();
  watch(page, 'delivery');
  await page.goto('/delivery/auth', { waitUntil: 'domcontentloaded' });
  await page.locator('input[type=text]').first().fill('9123456789');
  await page.getByRole('button', { name: /send otp/i }).click();
  const otpInputs = page.locator('input[inputmode="numeric"], input[autocomplete="one-time-code"], input[maxlength="1"]');
  await otpInputs.first().waitFor({ state: 'visible', timeout: 15000 }).catch(() => {});
  const n = await otpInputs.count();
  if (n >= 6) { for (let i = 0; i < 6; i++) await otpInputs.nth(i).fill('123456'[i]); }
  else if (n >= 1) { await otpInputs.first().fill('123456'); }
  else { await page.locator('input').nth(1).fill('123456').catch(() => {}); }
  await page.getByRole('button', { name: /^s*(verify|login|log in|submit)/i }).last().click().catch(() => {});
  await page.waitForTimeout(2500);
  await inspect(page, 'delivery', 'after-login');
  if (/auth/.test(page.url())) issues.push({ portal: 'delivery', kind: 'login', url: page.url(), msg: 'delivery login via UI did not leave /delivery/auth' });
  await crawl(page, 'delivery', '/delivery', 20);
  await ctx.close();
});
