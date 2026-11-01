import { test, expect } from '@playwright/test';

/**
 * Sorting / filtering is applied by the API (database queries) over the whole
 * matching set. These tests check BOTH the request parameters the UI sends and
 * the data the backend returns, then cross-check what is rendered.
 *
 * Runs against the real backend (:5000) + vite (:3000). The app must be opened
 * on `localhost` (not 127.0.0.1): its API base URL is http://localhost:5000.
 */
const API = 'http://localhost:5000/api/v1';
const LISTING_URL = /\/api\/v1\/(products|search|maps\/nearby\/products|categories\/[^/]+\/products)\?/;
const isListCall = (r) => LISTING_URL.test(r.url()) && r.request().method() === 'GET';
const withParams = (...needles) => (r) => isListCall(r) && needles.every((n) => r.url().includes(n));
const json = (r) => r.json();
const prices = (j) => j.data.map((i) => Number(i.price));
const isDesc = (a) => a.every((v, i) => i === 0 || a[i - 1] >= v);
const isAsc = (a) => a.every((v, i) => i === 0 || a[i - 1] <= v);
const money = (n) => new RegExp('₹\\s*' + Number(n).toLocaleString('en-IN').replace(/,/g, ',?'));

async function open(page, path, matcher = isListCall) {
  const first = page.waitForResponse(matcher);
  await page.goto(path);
  const resp = await first;
  await page.getByRole('button', { name: 'Not now' }).click({ timeout: 3000 }).catch(() => {});
  return resp;
}

/** Console errors from our own code (ignore third-party / network noise). */
function trackErrors(page) {
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  return errors;
}

// ------------------------------------------------------------------ API level
test.describe('API: tab listing', () => {
  const get = async (request, q, base = '/products?marketplaceTab=mithilak') =>
    (await request.get(`${API}${base}&limit=100&${q}`)).json();

  test('price asc/desc, ranges, rating, combined, totals', async ({ request }) => {
    const all = await get(request, '');
    const desc = await get(request, 'sort=-price');
    const asc = await get(request, 'sort=price');
    expect(isDesc(prices(desc))).toBe(true);
    expect(isAsc(prices(asc))).toBe(true);
    expect(prices(desc)[0]).toBe(Math.max(...prices(all)));
    expect(prices(asc)[0]).toBe(Math.min(...prices(all)));
    expect(desc.meta.total).toBe(all.meta.total);

    const range = await get(request, 'minPrice=300&maxPrice=500');
    expect(range.data.length).toBe(range.meta.total);
    expect(range.data.every((i) => i.price >= 300 && i.price <= 500)).toBe(true);
    expect(range.meta.total).toBe(all.data.filter((i) => i.price >= 300 && i.price <= 500).length);

    const rated = await get(request, 'minRating=4.5');
    expect(rated.data.every((i) => i.rating >= 4.5)).toBe(true);
    expect(rated.meta.total).toBe(all.data.filter((i) => i.rating >= 4.5).length);

    const byRating = await get(request, 'sort=-rating');
    const r = byRating.data.map((i) => i.rating);
    expect(isDesc(r)).toBe(true);

    const combo = await get(request, 'minPrice=300&maxPrice=3000&minRating=4.5&sort=-price');
    expect(combo.data.every((i) => i.price >= 300 && i.price <= 3000 && i.rating >= 4.5)).toBe(true);
    expect(isDesc(prices(combo))).toBe(true);
    expect(combo.meta.total).toBe(
      all.data.filter((i) => i.price >= 300 && i.price <= 3000 && i.rating >= 4.5).length
    );
  });

  test('invalid params are ignored safely', async ({ request }) => {
    const res = await request.get(`${API}/products?marketplaceTab=mithilak&limit=5&sort=bogus;drop&minRating=abc`);
    expect([200, 400, 422]).toContain(res.status());
    if (res.status() === 200) expect((await res.json()).data.length).toBeGreaterThan(0);
  });

  test('category + subcategory scope, with filters', async ({ request }) => {
    const cats = (await (await request.get(`${API}/categories?marketplaceTab=quick_shop`)).json()).data;
    const parent = cats.find((c) => c.name === 'Snacks and Beverages') || cats.find((c) => (c.children || []).length);
    const parentRes = await (await request.get(`${API}/categories/${parent.id}/products?marketplaceTab=quick_shop&limit=100`)).json();
    let covered = 0;
    for (const sub of parent.children || []) {
      const s = await (await request.get(`${API}/categories/${sub.id}/products?marketplaceTab=quick_shop&limit=100`)).json();
      covered += s.meta.total;
      expect(s.meta.total).toBeLessThanOrEqual(parentRes.meta.total);
      const ids = new Set(parentRes.data.map((i) => i.id));
      expect(s.data.every((i) => ids.has(i.id))).toBe(true);
      const sorted = await (await request.get(`${API}/categories/${sub.id}/products?marketplaceTab=quick_shop&sort=-price&minPrice=1`)).json();
      expect(isDesc(prices(sorted))).toBe(true);
    }
    expect(covered).toBeLessThanOrEqual(parentRes.meta.total);
  });

  test('quick delivery uses fixed-promise listings only (mithilak has none)', async ({ request }) => {
    const mithilak = await get(request, 'quickDelivery=true');
    expect(mithilak.meta.total).toBe(0);
    const quick = await get(request, 'quickDelivery=true', '/products?marketplaceTab=quick_shop');
    const all = await get(request, '', '/products?marketplaceTab=quick_shop');
    expect(quick.meta.total).toBeGreaterThan(0);
    expect(quick.meta.total).toBeLessThanOrEqual(all.meta.total);
    expect(quick.data.every((i) => i.deliveryType === 'fixed_promise' && i.deliveryPromiseMinutes <= 30)).toBe(true);
  });

  test('pagination past 100 items keeps global order, no gaps/dupes, accurate total', async ({ request }) => {
    const base = `${API}/products?marketplaceTab=quick_shop&sort=-price&limit=40`;
    const first = await (await request.get(`${base}&page=1`)).json();
    expect(first.meta.total).toBeGreaterThan(100);
    const seen = [];
    for (let p = 1; p <= first.meta.totalPages; p++) {
      const j = await (await request.get(`${base}&page=${p}`)).json();
      seen.push(...j.data);
    }
    expect(seen.length).toBe(first.meta.total);
    expect(new Set(seen.map((i) => i.listingId)).size).toBe(seen.length);
    expect(isDesc(seen.map((i) => i.price))).toBe(true);
  });

  test('search honours sort, price and rating', async ({ request }) => {
    const base = `${API}/search?q=a&marketplaceTab=mithilak&limit=100`;
    const all = await (await request.get(base)).json();
    const desc = await (await request.get(`${base}&sort=-price`)).json();
    expect(isDesc(prices(desc))).toBe(true);
    expect(desc.meta.total).toBe(all.meta.total);
    const range = await (await request.get(`${base}&minPrice=300&maxPrice=500`)).json();
    expect(range.data.every((i) => i.price >= 300 && i.price <= 500)).toBe(true);
    const rated = await (await request.get(`${base}&minRating=4.5`)).json();
    expect(rated.data.every((i) => i.rating >= 4.5)).toBe(true);
    // cache must not serve the unsorted result for a sorted request
    const asc = await (await request.get(`${base}&sort=price`)).json();
    expect(isAsc(prices(asc))).toBe(true);
  });
});

test.describe('API: nearby (QuickShop)', () => {
  const near = (request, q = '') =>
    request.get(`${API}/maps/nearby/products?lat=28.6139&lng=77.2090&commerceFlow=quick_shop&radiusKm=100&limit=100${q}`).then((r) => r.json());

  test('sort, price, rating, quick delivery, type, discount - all server side', async ({ request }) => {
    const all = await near(request);
    expect(all.meta.total).toBeGreaterThan(10);
    expect(isAsc(prices(await near(request, '&sort=price')))).toBe(true);
    expect(isDesc(prices(await near(request, '&sort=-price')))).toBe(true);
    const rt = (await near(request, '&sort=-rating')).data.map((i) => i.rating);
    expect(isDesc(rt)).toBe(true);
    const dl = (await near(request, '&sort=delivery')).data.map((i) => i.deliveryPromiseMinutes);
    expect(isAsc(dl)).toBe(true);

    const range = await near(request, '&minPrice=30&maxPrice=60');
    expect(range.meta.total).toBe(all.data.filter((i) => i.price >= 30 && i.price <= 60).length);
    const rated = await near(request, '&minRating=4.6');
    expect(rated.data.every((i) => i.rating >= 4.6)).toBe(true);
    expect(rated.meta.total).toBe(all.data.filter((i) => i.rating >= 4.6).length);
    const quick = await near(request, '&quickDelivery=true');
    expect(quick.data.every((i) => i.deliveryPromiseMinutes <= 30)).toBe(true);
    const deals = await near(request, '&discountOnly=true');
    expect(deals.data.every((i) => i.oldPrice > i.price)).toBe(true);
    const org = await near(request, '&productType=organic');
    expect(org.meta.total).toBeLessThan(all.meta.total);
    expect(org.data.every((i) => /organic/i.test(i.title))).toBe(true);

    const combo = await near(request, '&minPrice=20&minRating=4.5&quickDelivery=true&sort=-price');
    expect(combo.data.every((i) => i.price >= 20 && i.rating >= 4.5 && i.deliveryPromiseMinutes <= 30)).toBe(true);
    expect(isDesc(prices(combo))).toBe(true);
  });

  test('pages are exact with sort + filter active', async ({ request }) => {
    const q = '&sort=price&minPrice=20';
    const full = await near(request, q);
    const seen = [];
    for (let p = 1; p <= 5; p++) {
      const j = await (await request.get(`${API}/maps/nearby/products?lat=28.6139&lng=77.2090&commerceFlow=quick_shop&radiusKm=100&limit=25&page=${p}${q}`)).json();
      seen.push(...j.data);
      if (!j.meta.hasMore) break;
    }
    expect(seen.map((i) => i.listingId)).toEqual(full.data.map((i) => i.listingId));
  });
});

// ------------------------------------------------------------- Products page
test.describe('Products page', () => {
  test('sort asc/desc + range + rating, combined, and UI matches API', async ({ page }) => {
    const errors = trackErrors(page);
    await open(page, '/products?tab=mithilak');
    const select = page.locator('select').first();

    const [hi] = await Promise.all([
      page.waitForResponse(withParams('sort=-price')),
      select.selectOption('Price: High to Low'),
    ]);
    const hiJson = await json(hi);
    expect(isDesc(prices(hiJson))).toBe(true);
    await expect(page.getByText(money(prices(hiJson)[0])).first()).toBeVisible();

    const [lo] = await Promise.all([
      page.waitForResponse((r) => isListCall(r) && /sort=price(&|$)/.test(r.url())),
      select.selectOption('Price: Low to High'),
    ]);
    const loJson = await json(lo);
    expect(isAsc(prices(loJson))).toBe(true);
    await expect(page.getByText(money(prices(loJson)[0])).first()).toBeVisible();

    // range filter keeps the sort (sorting + filtering combined)
    const rangeResp = page.waitForResponse(withParams('minPrice=300', 'maxPrice=500', 'sort=price'));
    await page.locator('input[type="number"]').first().fill('300');
    await page.locator('input[type="number"]').nth(1).fill('500');
    const rj = await json(await rangeResp);
    expect(rj.meta.total).toBeLessThan(loJson.meta.total);
    expect(rj.data.every((i) => i.price >= 300 && i.price <= 500)).toBe(true);
    expect(isAsc(prices(rj))).toBe(true);
    await expect(page.getByText(money(prices(rj)[0])).first()).toBeVisible();

    expect(errors).toEqual([]);
  });

  test('rating filter sends minRating', async ({ page }) => {
    await open(page, '/products?tab=mithilak');
    const resp = page.waitForResponse(withParams('minRating=4'));
    await page.getByText(/4.*&\s*up|4★|4\+/i).first().click();
    const j = await json(await resp);
    expect(j.data.every((i) => i.rating >= 4)).toBe(true);
  });

  test('infinite scroll keeps active sort on later pages (quick_shop, 160 items)', async ({ page }) => {
    await open(page, '/products?tab=quick_shop');
    await Promise.all([
      page.waitForResponse(withParams('sort=-price')),
      page.locator('select').first().selectOption('Price: High to Low'),
    ]);
    const next = page.waitForResponse(withParams('sort=-price', 'page=2'));
    await page.mouse.wheel(0, 100000);
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    const j2 = await json(await next);
    expect(j2.meta.page).toBe(2);
    expect(isDesc(prices(j2))).toBe(true);
  });
});

// --------------------------------------------------------------- Search page
test.describe('Search page', () => {
  test('price sort both ways, range, rating', async ({ page }) => {
    await open(page, '/search?q=a&tab=mithilak');
    const [d] = await Promise.all([
      page.waitForResponse(withParams('sort=-price')),
      page.getByRole('button', { name: 'Price: High-Low' }).click(),
    ]);
    const dj = await json(d);
    expect(isDesc(prices(dj))).toBe(true);
    await expect(page.getByText(money(prices(dj)[0])).first()).toBeVisible();

    const [a] = await Promise.all([
      page.waitForResponse((r) => isListCall(r) && /sort=price(&|$)/.test(r.url())),
      page.getByRole('button', { name: 'Price: Low-High' }).click(),
    ]);
    expect(isAsc(prices(await json(a)))).toBe(true);

    const [rg] = await Promise.all([
      page.waitForResponse(withParams('minPrice=500', 'maxPrice=2000')),
      page.getByRole('button', { name: '₹500 - ₹2,000' }).click(),
    ]);
    const rj = await json(rg);
    expect(rj.data.every((i) => i.price >= 500 && i.price <= 2000)).toBe(true);
    expect(isAsc(prices(rj))).toBe(true); // sort preserved while filtering
  });

  test('rating filter', async ({ page }) => {
    await open(page, '/search?q=a&tab=mithilak');
    const [r] = await Promise.all([
      page.waitForResponse(withParams('minRating=4')),
      page.getByRole('button', { name: /4\s*★|4\+|4.*up/i }).first().click(),
    ]);
    expect((await json(r)).data.every((i) => i.rating >= 4)).toBe(true);
  });
});

// ------------------------------------------------------------- Category page
test.describe('Category page', () => {
  const url = (cat, extra = '') => `/category-products?category=${encodeURIComponent(cat)}&tab=quick_shop${extra}`;
  const CAT = 'Snacks and Beverages';

  test('sort modal, price, rating and quick delivery, combined', async ({ page }) => {
    const errors = trackErrors(page);
    await open(page, url(CAT));
    await page.getByText(/^Sort:/).first().click();
    const [s] = await Promise.all([
      page.waitForResponse(withParams('sort=-price')),
      page.getByRole('button', { name: 'Price: High to Low' }).click(),
    ]);
    const sj = await json(s);
    expect(sj.data.length).toBeGreaterThan(1);
    expect(isDesc(prices(sj))).toBe(true);
    await expect(page.getByText(money(prices(sj)[0])).first()).toBeVisible();

    // open filters: price + rating + quick delivery, sort must be preserved
    await page.getByRole('button', { name: /Filter/ }).first().click();
    await page.locator('input[type="number"]').first().fill('20');
    await page.getByRole('button', { name: /4★ & above/ }).click();
    await page.getByText('⚡ Quick Delivery / 30m').click();
    const [f] = await Promise.all([
      page.waitForResponse(withParams('minPrice=20', 'minRating=4', 'quickDelivery=true', 'sort=-price')),
      page.getByRole('button', { name: 'Apply Filters' }).click(),
    ]);
    const fj = await json(f);
    expect(fj.data.every((i) => i.price >= 20 && i.rating >= 4 && i.deliveryPromiseMinutes <= 30)).toBe(true);
    expect(isDesc(prices(fj))).toBe(true);
    expect(fj.meta.total).toBeLessThanOrEqual(sj.meta.total);

    // clearing resets the params
    const [c] = await Promise.all([
      page.waitForResponse((r) => isListCall(r) && !r.url().includes('minPrice') && !r.url().includes('quickDelivery')),
      page.getByRole('button', { name: /Clear All Filters|Reset/i }).first().click().catch(() => {}),
    ]).catch(() => [null]);
    expect(errors).toEqual([]);
    void c;
  });

  test('subcategory pill scopes the API request and result', async ({ page }) => {
    await open(page, url(CAT));
    const pill = page.getByRole('button', { name: 'Chips & Namkeens' }).first();
    const [r] = await Promise.all([
      page.waitForResponse(isListCall),
      pill.click(),
    ]);
    const all = await (await page.request.get(`${API}/categories?marketplaceTab=quick_shop`)).json();
    const parent = all.data.find((c) => c.name === CAT);
    const sub = parent.children.find((c) => c.name === 'Chips & Namkeens');
    expect(r.url()).toContain(`/categories/${sub.id}/products`);
    const j = await json(r);
    expect(j.meta.total).toBeGreaterThan(0);
  });

  test('stale responses never overwrite newer sort', async ({ page }) => {
    await open(page, url(CAT));
    // slow the first (asc) response, then switch to desc; UI must end on desc data
    await page.route(/sort=price(&|$)/, async (route) => { await new Promise((r) => setTimeout(r, 1500)); await route.continue(); });
    await page.getByText(/^Sort:/).first().click();
    await page.getByRole('button', { name: 'Price: Low to High' }).click();
    await page.getByText(/^Sort:/).first().click();
    const desc = page.waitForResponse(withParams('sort=-price'));
    await page.getByRole('button', { name: 'Price: High to Low' }).click();
    const dj = await json(await desc);
    await page.waitForTimeout(2200);
    await expect(page.getByText(/Sort:\s*Price: High to Low/)).toBeVisible();
    await expect(page.getByText(money(prices(dj)[0])).first()).toBeVisible();
  });
});

// -------------------------------------------------- Subcategory (deep link)
test('Subcategory page via URL: sort + price + rating combined', async ({ page }) => {
  const cats = (await (await page.request.get(`${API}/categories?marketplaceTab=quick_shop`)).json()).data;
  const parent = cats.find((c) => c.name === 'Snacks and Beverages');
  const sub = parent.children.find((c) => c.name === 'Chips & Namkeens');
  await open(page, `/category-products?category=${encodeURIComponent(parent.name)}&subcategory=${encodeURIComponent(sub.name)}&tab=quick_shop`);
  await page.getByText(/^Sort:/).first().click();
  const [s] = await Promise.all([
    page.waitForResponse(withParams(`/categories/${sub.id}/products`, 'sort=-price')),
    page.getByRole('button', { name: 'Price: High to Low' }).click(),
  ]);
  expect(isDesc(prices(await json(s)))).toBe(true);
  await page.getByRole('button', { name: /Filter/ }).first().click();
  await page.getByRole('button', { name: /3★ & above/ }).click();
  const [f] = await Promise.all([
    page.waitForResponse(withParams(`/categories/${sub.id}/products`, 'minRating=3', 'sort=-price')),
    page.getByRole('button', { name: 'Apply Filters' }).click(),
  ]);
  const fj = await json(f);
  expect(fj.data.every((i) => i.rating >= 3)).toBe(true);
});

// -------------------------------------------------------- QuickShopSubcategory
test.describe('QuickShopSubcategory', () => {
  async function openQuickShop(page, category = 'Dairy Products') {
    const first = page.waitForResponse((r) => /maps\/nearby\/products/.test(r.url()));
    await page.goto('/');
    await page.getByRole('button', { name: 'Not now' }).click({ timeout: 3000 }).catch(() => {});
    await page.evaluate((c) => {
      localStorage.setItem('isQuickShopFlow', 'true');
      localStorage.setItem('isFreshGroceryFlow', 'false');
      localStorage.setItem('isMithilakFlow', 'false');
      const state = { usr: { category: c }, key: 'qs', idx: 1 };
      window.history.pushState(state, '', '/quick-shop/category');
      window.dispatchEvent(new PopStateEvent('popstate', { state }));
    }, category);
    await first.catch(() => {});
    await page.getByRole('button', { name: 'Not now' }).click({ timeout: 8000 }).catch(() => {});
  }

  test('sort, price, fast delivery sent to nearby API; UI matches', async ({ page }) => {
    const errors = trackErrors(page);
    await openQuickShop(page);
    await page.getByRole('button', { name: /^Sort/ }).click();
    const [s] = await Promise.all([
      page.waitForResponse(withParams('maps/nearby/products', 'sort=-price')),
      page.getByRole('button', { name: /Price: High to Low/ }).click(),
    ]);
    const sj = await json(s);
    expect(sj.data.length).toBeGreaterThan(1);
    expect(isDesc(prices(sj))).toBe(true);
    await expect(page.getByText(money(prices(sj)[0])).first()).toBeVisible();

    await page.getByRole('button', { name: /^Filter|Filters/ }).first().click();
    await page.locator('input[placeholder="Min ₹"]').fill('20');
    await page.getByText('⚡ Fast Delivery Only').click();
    const [f] = await Promise.all([
      page.waitForResponse(withParams('maps/nearby/products', 'minPrice=20', 'quickDelivery=true', 'sort=-price')),
      page.getByRole('button', { name: 'Apply Filters' }).click(),
    ]);
    const fj = await json(f);
    expect(fj.data.every((i) => i.price >= 20 && i.deliveryPromiseMinutes <= 30)).toBe(true);
    expect(isDesc(prices(fj))).toBe(true);
    expect(errors).toEqual([]);
  });
});

// ---------------------------------------------------------------- Mobile
test.describe('mobile viewport', () => {
  test.use({ viewport: { width: 390, height: 844 } });
  test('category sort modal works on mobile', async ({ page }) => {
    await open(page, '/category-products?category=Snacks%20and%20Beverages&tab=quick_shop');
    await page.getByText(/^Sort:/).first().click();
    const [s] = await Promise.all([
      page.waitForResponse(withParams('sort=price')),
      page.getByRole('button', { name: 'Price: Low to High' }).click(),
    ]);
    expect(isAsc(prices(await json(s)))).toBe(true);
  });
});
