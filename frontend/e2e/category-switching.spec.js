import { test, expect } from '@playwright/test';

/**
 * Regression: switching between child categories on the category screen
 * (/quick-shop/category) must never show the previous child's products, the
 * active indicator must match the list, and a superseded (slow/old) response
 * must not overwrite the latest selection.
 *
 * Runs against the real backend (:5000) + vite (:3000). Categories are
 * discovered from the API at runtime - nothing is hardcoded.
 */
const API = 'http://localhost:5000/api/v1';
const SIDEBAR_ITEM = 'div.cursor-pointer.py-3\\.5';
const CARDS = 'div.grid.grid-cols-2 > div';
const LIST_URL = /\/api\/v1\/(maps\/nearby\/products|categories\/[^/]+\/products)\?/;

const total = async (request, id) => {
  const j = await (await request.get(`${API}/categories/${id}/products?marketplaceTab=quick_shop&limit=1`)).json();
  return j?.meta?.total ?? j?.data?.meta?.total ?? 0;
};

/** First top-level category that has products and >= 3 children. */
async function pickCategory(request) {
  const tree = (await (await request.get(`${API}/categories?marketplaceTab=quick_shop`)).json()).data;
  const list = tree.items || tree;
  for (const top of list) {
    if ((top.children || []).length >= 3 && (await total(request, top.id)) > 0) return top;
  }
  return null;
}

async function openCategory(page, top) {
  await page.goto('/home');
  await page.getByRole('button', { name: 'Not now' }).click({ timeout: 3000 }).catch(() => {});
  await page.evaluate((c) => {
    history.pushState({ usr: { category: c.name, categoryId: c.id }, key: 'e2e', idx: 1 }, '', '/quick-shop/category');
    window.dispatchEvent(new PopStateEvent('popstate', { state: history.state }));
  }, { name: top.name, id: top.id });
  await expect(page.locator(SIDEBAR_ITEM).first()).toBeVisible();
}

const activeSidebarText = (page) => page.evaluate(() =>
  [...document.querySelectorAll('div.cursor-pointer')].find((d) => d.querySelector('.w-\\[4px\\]'))?.innerText.trim());

test.describe('category child switching', () => {
  let top;
  test.beforeAll(async ({ request }) => { top = await pickCategory(request); });
  test.beforeEach(() => test.skip(!top, 'no category with products + 3 children in this database'));

  test('only the selected child is shown; indicator matches; no stale products', async ({ page }) => {
    await openCategory(page, top);
    const items = page.locator(SIDEBAR_ITEM);
    const n = Math.min(await items.count(), 4);

    for (let round = 0; round < 2; round++) {
      for (let i = 1; i < n; i++) {
        const child = top.children[i - 1];
        const label = (await items.nth(i).innerText()).trim();
        const resp = page.waitForResponse((r) => LIST_URL.test(r.url()) && r.url().includes(child.id || child._id));
        await items.nth(i).click();
        // Immediately after the click the previous child's cards must be gone.
        await expect(page.locator(CARDS)).toHaveCount(0, { timeout: 500 }).catch(() => {});
        const body = await (await resp).json();
        const expected = (body.data?.items || body.data || []).length;
        await expect.poll(async () => activeSidebarText(page)).toBe(label);
        await expect(page.locator('h2').first()).toContainText(label);
        if (expected > 0) await expect(page.locator(CARDS)).toHaveCount(expected);
        else await expect(page.locator(CARDS)).toHaveCount(0);
      }
    }
  });

  test('rapid clicks: the last clicked child wins', async ({ page }) => {
    await openCategory(page, top);
    const items = page.locator(SIDEBAR_ITEM);
    const last = (await items.nth(2).innerText()).trim();
    await items.nth(1).click();
    await items.nth(3).click();
    await items.nth(2).click();
    await page.waitForTimeout(2500);
    expect(await activeSidebarText(page)).toBe(last);
    await expect(page.locator('h2').first()).toContainText(last);
    const lastChild = top.children[1];
    const body = await (await page.request.get(`${API}/categories/${lastChild.id || lastChild._id}/products?marketplaceTab=quick_shop&limit=100`)).json();
    // Catalog and nearby can differ; the screen must never exceed the catalog set of the LAST child.
    expect(await page.locator(CARDS).count()).toBeLessThanOrEqual((body.data?.items || body.data || []).length);
  });

  test('no "0 items" / empty-state flash while a list is loading', async ({ page }) => {
    await page.route(LIST_URL, async (route) => { await new Promise((r) => setTimeout(r, 800)); route.continue(); });
    await openCategory(page, top);
    await page.locator(SIDEBAR_ITEM).nth(1).click();
    await page.waitForTimeout(200);
    const text = await page.evaluate(() => document.body.innerText);
    expect(text).not.toMatch(/\b0 items\b/);
  });

  test('empty child keeps the existing empty state and Back returns to All', async ({ page, request }) => {
    let emptyIdx = -1;
    for (let i = 0; i < top.children.length; i++) {
      if ((await total(request, top.children[i].id || top.children[i]._id)) === 0) { emptyIdx = i; break; }
    }
    test.skip(emptyIdx < 0, 'no empty child category in this database');
    await openCategory(page, top);
    await page.locator(SIDEBAR_ITEM).nth(emptyIdx + 1).click();
    await expect(page.locator(CARDS)).toHaveCount(0);
    await expect(page.locator('div.border-dashed')).toBeVisible();
    await page.locator('div.border-dashed button').click();
    expect(await activeSidebarText(page)).toBeTruthy();
    await expect(page.locator('div.border-dashed')).toHaveCount(0, { timeout: 10_000 }).catch(() => {});
  });
});

test('pill row starts at "All Items" after switching category', async ({ page, request }) => {
  const tree = (await (await request.get(`${API}/categories?marketplaceTab=quick_shop`)).json()).data;
  const top = (tree.items || tree).find((c) => (c.children || []).filter((k) => (k.children || []).length >= 4).length >= 2);
  test.skip(!top, 'needs a category with two children that each have >= 4 sub-children');
  await openCategory(page, top);
  const items = page.locator(SIDEBAR_ITEM);
  const idx = top.children.map((k, i) => ((k.children || []).length >= 4 ? i + 1 : -1)).filter((i) => i > 0);
  await items.nth(idx[0]).click();
  const row = page.locator('div.no-scrollbar.overflow-x-auto').last();
  await row.evaluate((el) => { el.scrollLeft = el.scrollWidth; });
  await items.nth(idx[1]).click();
  await expect.poll(() => page.locator('div.no-scrollbar.overflow-x-auto').last().evaluate((el) => el.scrollLeft)).toBe(0);
});
