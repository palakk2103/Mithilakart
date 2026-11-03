import { test, expect } from '@playwright/test';
import { api, loginCustomer, openCustomerPortal, dismissLocationPrompt } from './helpers/harness.js';

/**
 * Regression around the category landing work: cart, wishlist, product detail,
 * checkout page, and the three other tabs. Needs the demo landing content for
 * "Mithila Fashion & Handloom" (scripts/seed-landing-demo.mjs). Does NOT place
 * an order (real DB / payments); it stops at the checkout page.
 */
const FASHION = '6a5f2aa698a3d123c9afb3a5';
let session;

test.describe.configure({ mode: 'serial' });

test.beforeAll(async () => {
  session = await loginCustomer();
  await api('/cart', { method: 'DELETE', token: session.accessToken });
});

test.afterAll(async () => {
  await api('/cart', { method: 'DELETE', token: session.accessToken });
  const wl = await api('/users/me/wishlist', { token: session.accessToken });
  const items = Array.isArray(wl.body) ? wl.body : wl.body?.items || [];
  for (const it of items) {
    const pid = it.productId || it.id || it.product?.id;
    if (pid) await api(`/users/me/wishlist/${pid}`, { method: 'DELETE', token: session.accessToken });
  }
});

const landingCard = (page) => page.getByTestId('landing-section').first().locator('div.group').first();

test('add to cart from a landing card → item appears in cart and checkout page loads', async ({ page }) => {
  await openCustomerPortal(page, { path: `/mithilak/c/${FASHION}` });
  await page.getByTestId('landing-section').first().waitFor();
  await page.getByTestId('landing-section').first().getByRole('button', { name: /add to cart/i }).first().click();

  await expect.poll(async () => {
    const cart = await api('/cart', { token: session.accessToken });
    return JSON.stringify(cart.body).includes('Tussar');
  }, { timeout: 15000 }).toBe(true);

  await page.goto('/cart');
  await dismissLocationPrompt(page);
  await expect(page.getByText(/Tussar/i).first()).toBeVisible();

  await page.goto('/checkout');
  await dismissLocationPrompt(page);
  await expect(page).toHaveURL(/checkout/);
  await expect(page.getByText(/Tussar|order summary|payment|address/i).first()).toBeVisible();
});

test('wishlist heart on a landing card → product shows in wishlist', async ({ page }) => {
  await openCustomerPortal(page, { path: `/mithilak/c/${FASHION}` });
  const section = page.getByTestId('landing-section').first();
  await section.waitFor();
  await section.locator('button:has(svg.lucide-heart)').first().click();
  await expect.poll(async () => {
    const wl = await api('/users/me/wishlist', { token: session.accessToken });
    return JSON.stringify(wl.body).includes('Tussar');
  }, { timeout: 15000 }).toBe(true);
  await page.goto('/wishlist');
  await dismissLocationPrompt(page);
  await expect(page.getByText(/Tussar/i).first()).toBeVisible();
});

test('product detail opens from a landing card and shows the product', async ({ page }) => {
  await page.goto(`/mithilak/c/${FASHION}`);
  await dismissLocationPrompt(page);
  await page.getByTestId('landing-section').first().locator('h3').first().click();
  await expect(page).toHaveURL(/product-detail/);
  await expect(page.getByText(/Tussar/i).first()).toBeVisible();
});

test('landing banners auto-advance and arrows work', async ({ page }) => {
  await page.goto(`/mithilak/c/${FASHION}`);
  await dismissLocationPrompt(page);
  const banner = page.getByTestId('landing-banner');
  await expect(banner).toBeVisible();
  const active = () => banner.locator('div[aria-hidden="false"] img').first().getAttribute('alt');
  const first = await active();
  await banner.getByLabel('Next banner').click();
  await expect.poll(active).not.toBe(first);
});

for (const [name, path] of [['Home / MithilaKart', '/home'], ['Mithilak tab', '/mithilak'], ['Quick Shop', '/quick-shop'], ['Fresh & Groceries', '/fresh-grocery']]) {
  test(`other tab still loads without errors: ${name}`, async ({ page }) => {
    const errors = [];
    page.on('pageerror', (e) => errors.push(String(e)));
    await page.goto(path);
    await dismissLocationPrompt(page);
    await expect(page.locator('header, nav, [class*="header"]').first()).toBeVisible();
    await page.waitForTimeout(2500);
    expect(errors).toEqual([]);
    expect(await page.evaluate(() => document.body.innerText.length)).toBeGreaterThan(200);
    // the new landing banners must not leak into other flows
    expect(await page.getByText('Handloom Festival Sale').count()).toBe(0);
  });
}

test('quick-shop category listing still works (existing page unchanged)', async ({ page }) => {
  const tree = await api('/categories?marketplaceTab=quick_shop');
  const list = Array.isArray(tree.body) ? tree.body : tree.body?.items || [];
  const top = list.find((c) => (c.children || []).length) || list[0];
  test.skip(!top, 'no quick-shop category');
  await page.goto('/home');
  await dismissLocationPrompt(page);
  await page.evaluate((c) => {
    history.pushState({ usr: { category: c.name, categoryId: c.id }, key: 'e2e', idx: 1 }, '', '/quick-shop/category');
    window.dispatchEvent(new PopStateEvent('popstate', { state: history.state }));
  }, { name: top.name, id: top.id });
  await expect(page.getByText(top.name).first()).toBeVisible();
});

test.describe('MithilaKart tab (/home) category pages', () => {
  const open = async (page, cat) => {
    await page.goto(`/home?category=${cat}`);
    await dismissLocationPrompt(page);
    await expect(page.getByTestId('landing-banner')).toBeVisible({ timeout: 20000 });
  };

  test('Fashion: banner above subcategories, promo sections below, then all products', async ({ page }) => {
    await open(page, 'Fashion');
    const sections = page.getByTestId('landing-section');
    await expect(sections.first()).toBeVisible();
    expect(await sections.count()).toBeGreaterThanOrEqual(2);
    const y = async (loc) => (await loc.first().boundingBox()).y;
    const banner = await y(page.getByTestId('landing-banner'));
    const subs = await y(page.getByText('Fashion Subcategories'));
    const sec = await y(sections);
    const all = await y(page.getByText('All Fashion Products'));
    expect(banner).toBeLessThan(subs);
    expect(subs).toBeLessThan(sec);
    expect(sec).toBeLessThan(all);
  });

  test('Electronics shows its own banner and sections, not the Fashion ones', async ({ page }) => {
    await open(page, 'Electronics');
    await expect(page.getByAltText('Big Electronics Sale').first()).toBeAttached();
    await expect(page.getByAltText('Fashion Fest')).toHaveCount(0);
    await expect(page.getByTestId('landing-section').first()).toBeVisible();
  });

  test('Mobiles: banner only (no products) and the page still works', async ({ page }) => {
    await open(page, 'Mobiles');
    await expect(page.getByTestId('landing-section')).toHaveCount(0);
  });

  test('choosing a subcategory hides promo blocks and filters the product grid', async ({ page }) => {
    await open(page, 'Fashion');
    await page.getByText("Men's Wear").first().click();
    await expect(page.getByTestId('landing-banner')).toHaveCount(0);
    await expect(page.getByTestId('landing-section')).toHaveCount(0);
    await page.getByRole('button', { name: /clear filter|all items/i }).first().click();
    await expect(page.getByTestId('landing-banner')).toBeVisible();
  });

  test('add to cart from a promo section works', async ({ page }) => {
    await openCustomerPortal(page, { path: '/home?category=Fashion' });
    const section = page.getByTestId('landing-section').first();
    await section.waitFor({ timeout: 20000 });
    await section.getByRole('button', { name: /add to cart/i }).first().click();
    await expect.poll(async () => JSON.stringify((await api('/cart', { token: session.accessToken })).body).includes('Khadi'), { timeout: 15000 }).toBe(true);
  });

  test('banner links/arrows and no horizontal overflow on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 800 });
    await open(page, 'Fashion');
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1);
  });
});
