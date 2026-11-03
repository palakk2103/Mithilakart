import { test, expect } from '@playwright/test';
import { api, loginAdmin, openAdminPortal, dismissLocationPrompt } from './helpers/harness.js';

/**
 * MithilaKart category landing pages — end to end against the real backend
 * (:5000) and vite (:3000). Categories and products are discovered at runtime;
 * every record this spec creates is prefixed "E2E LANDING" and removed in
 * afterAll, so the shared database is left as found.
 */
const TAG = 'E2E LANDING';
const created = { banners: [], sections: [], configCats: new Set() };
let admin;
let main; // root category WITH products + subcategories
let other; // a second root category (different content)
let prodCat;

const tree = async () => {
  const res = await api('/categories?commerceFlow=mithilak');
  const list = Array.isArray(res.body) ? res.body : res.body?.items || [];
  return list;
};

test.describe.configure({ mode: 'serial' });

test.beforeAll(async () => {
  admin = (await loginAdmin()).accessToken;
  const roots = (await tree()).filter((c) => (c.children || []).length >= 2);

  for (const root of roots) {
    const r = await api(`/categories/${root.id}/products?marketplaceTab=mithilak&limit=1`);
    if ((r.json?.meta?.total || 0) > 0) { main = root; break; }
  }
  main = main || roots[0];
  other = roots.find((c) => c.id !== main.id);

  // Category-specific banners
  for (const [cat, label] of [[main, 'MAIN'], [other, 'OTHER']]) {
    const b = await api('/admin/banners', {
      method: 'POST', token: admin,
      body: { title: `${TAG} ${label} banner`, subtitle: `${TAG} subtitle`, ctaText: 'Shop now', imageUrl: 'https://placehold.co/1600x500/207C8A/FFFFFF.png?text=E2E', categoryId: cat.id },
    });
    expect(b.status, JSON.stringify(b.json)).toBe(201);
    created.banners.push(b.body._id || b.body.id);
  }

  // Sections on the main category (dynamic + empty manual which must not render)
  const sectionDefs = [
    { title: `${TAG} Best Sellers`, sectionType: 'best_sellers', productLimit: 4 },
    { title: `${TAG} New Arrivals`, sectionType: 'new_arrivals', productLimit: 4 },
    { title: `${TAG} Top Deals`, sectionType: 'top_deals', productLimit: 4 },
    { title: `${TAG} All Products`, sectionType: 'category_products', productLimit: 4 },
  ];
  for (const def of sectionDefs) {
    const s = await api(`/admin/category-landing/${main.id}/sections`, { method: 'POST', token: admin, body: def });
    expect(s.status, JSON.stringify(s.json)).toBe(201);
    created.sections.push(s.body._id || s.body.id);
  }
  created.configCats.add(main.id);
  prodCat = main;
});

test.afterAll(async () => {
  const token = (await loginAdmin()).accessToken;
  for (const id of created.sections) await api(`/admin/category-landing/sections/${id}`, { method: 'DELETE', token });
  for (const id of created.banners) await api(`/admin/banners/${id}`, { method: 'DELETE', token });
  for (const id of created.configCats) await api(`/admin/category-landing/${id}/config`, { method: 'PUT', token, body: { enabled: true, blockOrder: [] } });
});

test.describe('API', () => {
  test('public landing returns only this category\'s banner, subcategories and non-empty sections', async () => {
    const res = await api(`/storefront/category-landing/${main.id}`);
    expect(res.status).toBe(200);
    const blocks = res.body.blocks;
    const banner = blocks.find((b) => b.type === 'banner');
    expect(banner.banners.map((b) => b.title)).toContain(`${TAG} MAIN banner`);
    expect(banner.banners.map((b) => b.title)).not.toContain(`${TAG} OTHER banner`);
    const subs = blocks.find((b) => b.type === 'subcategories');
    expect(subs.items.map((i) => i.id).sort()).toEqual(main.children.map((c) => c.id).sort());
    const sections = blocks.filter((b) => b.type === 'section');
    for (const s of sections) {
      expect(s.products.length).toBeGreaterThan(0);
      expect(s.products.length).toBeLessThanOrEqual(4);
    }
    // products never repeat across auto sections (manual picks may repeat on purpose)
    const ids = sections.filter((s) => s.sectionType !== 'manual').flatMap((s) => s.products.map((p) => p.productId));
    expect(new Set(ids).size).toBe(ids.length);
  });

  test('another category gets its own banner and none of the main category content', async () => {
    const res = await api(`/storefront/category-landing/${other.id}`);
    expect(res.status).toBe(200);
    const text = JSON.stringify(res.body);
    expect(text).toContain(`${TAG} OTHER banner`);
    expect(text).not.toContain(`${TAG} MAIN banner`);
    expect(text).not.toContain(`${TAG} Best Sellers`);
  });

  test('global flow banners no longer include category banners (backward compatible)', async () => {
    const res = await api('/storefront/mithilak/home');
    expect(JSON.stringify(res.body.banners)).not.toContain(TAG);
  });

  test('invalid / unknown ids are handled safely', async () => {
    expect((await api('/storefront/category-landing/not-an-id')).status).toBe(422);
    expect((await api('/admin/category-landing/not-an-id', { token: admin })).status).toBe(422);
    expect((await api('/storefront/category-landing/64b0000000000000000000ff')).status).toBe(404);
  });

  test('admin endpoints require authentication', async () => {
    expect((await api(`/admin/category-landing/${main.id}`)).status).toBe(401);
    expect((await api(`/admin/category-landing/${main.id}/sections`, { method: 'POST', body: { title: 'x y' } })).status).toBe(401);
  });

  test('validation: sub-category, foreign products, bad schedule, bad block order', async () => {
    const child = main.children[0];
    const onChild = await api(`/admin/category-landing/${child.id}/sections`, { method: 'POST', token: admin, body: { title: `${TAG} bad`, sectionType: 'best_sellers' } });
    expect(onChild.status).toBe(422);

    const bannerOnChild = await api('/admin/banners', { method: 'POST', token: admin, body: { title: `${TAG} bad`, imageUrl: '/x.png', categoryId: child.id } });
    expect(bannerOnChild.status).toBe(422);

    const bad = await api(`/admin/category-landing/${main.id}/sections`, { method: 'POST', token: admin, body: { title: `${TAG} bad`, sectionType: 'manual', productIds: ['64b0000000000000000000aa'] } });
    expect(bad.status).toBe(422);

    const sched = await api(`/admin/category-landing/${main.id}/sections`, { method: 'POST', token: admin, body: { title: `${TAG} bad`, sectionType: 'best_sellers', startDate: '2030-02-01T00:00:00Z', endDate: '2030-01-01T00:00:00Z' } });
    expect(sched.status).toBe(422);

    const order = await api(`/admin/category-landing/${main.id}/config`, { method: 'PUT', token: admin, body: { blockOrder: ['banner', '<script>'] } });
    expect(order.status).toBe(422);

    const dangling = await api('/admin/category-landing/sections/64b0000000000000000000bb', { method: 'DELETE', token: admin });
    expect(dangling.status).toBe(404);
  });

  test('scheduled-in-the-future and inactive sections are hidden; admin order is honoured', async () => {
    const future = await api(`/admin/category-landing/${main.id}/sections`, {
      method: 'POST', token: admin,
      body: { title: `${TAG} Future`, sectionType: 'category_products', startDate: '2099-01-01T00:00:00Z' },
    });
    created.sections.push(future.body._id);
    const off = await api(`/admin/category-landing/${main.id}/sections`, {
      method: 'POST', token: admin, body: { title: `${TAG} Off`, sectionType: 'category_products', isActive: false },
    });
    created.sections.push(off.body._id);
    let res = await api(`/storefront/category-landing/${main.id}`);
    // landing responses are cached for a short time; admin writes invalidate it
    expect(JSON.stringify(res.body)).not.toContain(`${TAG} Future`);
    expect(JSON.stringify(res.body)).not.toContain(`${TAG} Off`);

    const cfg = await api(`/admin/category-landing/${main.id}/config`, { method: 'PUT', token: admin, body: { blockOrder: ['subcategories', 'banner'] } });
    expect(cfg.status).toBe(200);
    res = await api(`/storefront/category-landing/${main.id}`);
    expect(res.body.blocks.slice(0, 2).map((b) => b.type)).toEqual(['subcategories', 'banner']);
    await api(`/admin/category-landing/${main.id}/config`, { method: 'PUT', token: admin, body: { blockOrder: [] } });
  });
});

test.describe('Customer UI', () => {
  test('MithilaKart → category card → landing: banner, subcategories, sections in order', async ({ page }) => {
    await page.goto('/mithilak');
    await dismissLocationPrompt(page);
    await page.getByText(main.name, { exact: true }).first().click();
    await expect(page).toHaveURL(new RegExp(`/mithilak/c/${main.id}$`));
    await expect(page.getByTestId('category-landing')).toBeVisible();

    await expect(page.getByTestId('landing-banner')).toBeVisible();
    const subs = page.getByTestId('landing-subcategory');
    await expect(subs.first()).toBeVisible();
    expect(await subs.count()).toBe(main.children.length);

    const sections = page.getByTestId('landing-section');
    await expect(sections.first()).toBeVisible();
    expect(await sections.count()).toBeGreaterThanOrEqual(1);

    // sequence: banner above subcategories above sections
    const y = async (id) => (await page.getByTestId(id).first().boundingBox()).y;
    expect(await y('landing-banner')).toBeLessThan(await y('landing-subcategories'));
    expect(await y('landing-subcategories')).toBeLessThan(await y('landing-section'));

    // active category indicator in the existing header chips
    await expect(page.locator('[data-active="true"]').first()).toBeVisible();
  });

  test('subcategory click → listing for that subcategory; browser back returns to landing', async ({ page }) => {
    await page.goto(`/mithilak/c/${main.id}`);
    await dismissLocationPrompt(page);
    const sub = page.getByTestId('landing-subcategory').first();
    await expect(sub).toBeVisible();
    const subName = (await sub.innerText()).trim();
    await sub.click();
    await expect(page).toHaveURL(/\/mithilak\/category/);
    await expect(page.getByText(subName, { exact: false }).first()).toBeVisible();
    await page.goBack();
    await expect(page).toHaveURL(new RegExp(`/mithilak/c/${main.id}$`));
    await expect(page.getByTestId('landing-banner')).toBeVisible();
  });

  test('second category shows its own banner and skips empty sections', async ({ page }) => {
    await page.goto(`/mithilak/c/${other.id}`);
    await dismissLocationPrompt(page);
    await expect(page.getByTestId('landing-banner')).toBeVisible();
    await expect(page.getByTestId('landing-subcategory').first()).toBeVisible();
    await expect(page.getByTestId('landing-section')).toHaveCount(0);
    await expect(page.getByText(`${TAG} Best Sellers`)).toHaveCount(0);
  });

  test('disabled landing falls back to the normal product listing', async ({ page }) => {
    await api(`/admin/category-landing/${other.id}/config`, { method: 'PUT', token: admin, body: { enabled: false } });
    created.configCats.add(other.id);
    await page.goto(`/mithilak/c/${other.id}`);
    await expect(page).toHaveURL(/\/mithilak\/category/);
    await api(`/admin/category-landing/${other.id}/config`, { method: 'PUT', token: admin, body: { enabled: true } });
  });

  test('a category with no landing content falls back to the listing', async ({ page }) => {
    const bare = (await tree()).find((c) => c.id !== main.id && c.id !== other.id && (c.children || []).length === 0);
    test.skip(!bare, 'no childless category available');
    await page.goto(`/mithilak/c/${bare.id}`);
    await expect(page).toHaveURL(/\/mithilak\/category/);
  });

  test('mobile layout: no horizontal overflow, sections visible', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 800 });
    await page.goto(`/mithilak/c/${main.id}`);
    await dismissLocationPrompt(page);
    await expect(page.getByTestId('landing-banner')).toBeVisible();
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(1);
  });

  test('product card opens the product detail page', async ({ page }) => {
    await page.goto(`/mithilak/c/${main.id}`);
    await dismissLocationPrompt(page);
    const card = page.getByTestId('landing-section').first().locator('h3').first();
    await expect(card).toBeVisible();
    await card.click();
    await expect(page).toHaveURL(/product-detail/);
  });
});

test.describe('Admin UI', () => {
  test('Category Landing manager lists the created banner and sections; toggling a section updates the customer page', async ({ page }) => {
    await openAdminPortal(page, { path: '/admin/storefront/category-landing' });
    await page.getByRole('button', { name: 'Mithilak tab' }).click();
    await page.getByRole('button', { name: main.name, exact: true }).click();
    await expect(page.getByText(`${TAG} MAIN banner`)).toBeVisible();
    await expect(page.getByText(`${TAG} Best Sellers`).first()).toBeVisible();
    await expect(page.getByText('Layout order (top → bottom)')).toBeVisible();

    // disable "Best Sellers" through the UI → customer API no longer lists it
    const row = page.locator('div', { hasText: `${TAG} Best Sellers` }).filter({ has: page.getByLabel('Toggle section') }).last();
    await row.getByLabel('Toggle section').click();
    await expect.poll(async () => JSON.stringify((await api(`/storefront/category-landing/${main.id}`)).body)).not.toContain(`${TAG} Best Sellers`);
  });
});
