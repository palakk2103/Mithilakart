import { test, expect } from '@playwright/test';
import { MongoClient, ObjectId } from 'mongodb';
import { openAdminPortal, loginAdmin, api } from './helpers/harness.js';

/**
 * Production readiness Pass 3 (2026-08-25) — real Admin UI live verification.
 * Every assertion here drives the actual rendered Admin UI (not the Admin
 * API directly) and confirms the change lands in real MongoDB, then that it
 * actually changes real downstream behaviour — not just that the form
 * "looks saved" client-side.
 */

const DB_NAME = 'mithilakart';

async function withDb(fn) {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017';
  const client = new MongoClient(uri);
  try {
    await client.connect();
    return await fn(client.db(DB_NAME));
  } finally {
    await client.close();
  }
}

test.describe('Admin UI — live verification', () => {
  test('fulfillment settings: changing the seller-ranking distance weight via the real UI persists to MongoDB and changes the resolved config', async ({ page }) => {
    await openAdminPortal(page, { path: '/admin/fulfillment/settings' });

    await expect(page.getByText('Fulfillment Settings')).toBeVisible({ timeout: 20_000 });

    const before = await withDb((db) =>
      db.collection('platform_settings').findOne({ key: 'sellerRankingWeights' })
    );
    expect(before, 'sellerRankingWeights must already exist as a real admin-configured document').toBeTruthy();
    const beforeDistance = before.value.distance;
    const adminToken = (await loginAdmin()).accessToken;

    try {
      // Real UI: "Seller distance" is rendered first among the seller-ranking
      // sliders (rankingFactors order: distance, routeEta, preparation,
      // workload, availability, adminBoost — confirmed against the real
      // page, where its displayed 30% matched the known seeded weight).
      const slider = page.getByRole('slider').first();
      await expect(slider).toBeVisible({ timeout: 10_000 });

      const newDistance = Math.round((beforeDistance >= 0.5 ? 0.15 : 0.75) * 100) / 100;
      // Playwright's own fill() drives range inputs through its real input
      // pipeline (keyboard-equivalent), which React's onChange reliably
      // observes — a raw dispatchEvent() was intermittently missed by
      // React's synthetic event delegation on this element.
      await slider.fill(String(newDistance));
      await expect(slider).toHaveValue(String(newDistance));

      await page.getByRole('button', { name: /save changes/i }).click();
      await expect(page.getByText(/settings updated/i)).toBeVisible({ timeout: 20_000 });

      // REAL BACKEND: MongoDB must reflect the exact value set through the UI.
      await expect.poll(async () => {
        const doc = await withDb((db) => db.collection('platform_settings').findOne({ key: 'sellerRankingWeights' }));
        return doc?.value?.distance ?? null;
      }, { timeout: 15_000, message: 'waiting for sellerRankingWeights.distance to persist' }).toBeCloseTo(newDistance, 2);

      test.info().annotations.push({
        type: 'step',
        description: `Real UI slider change persisted: distance weight ${beforeDistance} -> ${newDistance} in platform_settings.`,
      });

      // BUSINESS LOGIC: the fulfillment engine's resolved config (read
      // fresh, not cached) must reflect this new weight — proving the admin
      // change actually reaches the ranking algorithm, not just the
      // settings screen. FulfillmentConfigService.normalizeWeights
      // renormalises ALL factors to sum to 1 on every resolve — since only
      // "distance" was changed here, the resolved share is newDistance /
      // (newDistance + the five untouched raw weights), not the raw slider
      // value itself. That renormalisation is the real, intended behaviour
      // (a partial admin edit must not silently let the other five factors
      // drift below their configured share) — this recomputes the same
      // formula independently to assert against it.
      const otherWeightsTotal = Object.entries(before.value)
        .filter(([key]) => key !== 'distance')
        .reduce((sum, [, v]) => sum + (Number(v) || 0), 0);
      const expectedResolvedDistance = newDistance / (newDistance + otherWeightsTotal);

      const resolved = await api('/admin/fulfillment/settings', { method: 'GET', token: adminToken });
      expect(resolved.ok).toBe(true);
      expect(resolved.body.settings.rankingWeights.distance).toBeCloseTo(expectedResolvedDistance, 2);
    } finally {
      // Always restore the original value, pass or fail, so this test never
      // leaves shared platform configuration permanently altered for other
      // suites/scenarios.
      const restore = await api('/admin/fulfillment/settings', {
        method: 'PUT', token: adminToken, body: { sellerRankingWeights: before.value },
      });
      expect(restore.ok, `failed to restore sellerRankingWeights: ${JSON.stringify(restore.json)}`).toBe(true);
    }
  });

  test('fulfillment settings: toggling courier fallback via the real UI persists to MongoDB', async ({ page }) => {
    await openAdminPortal(page, { path: '/admin/fulfillment/settings' });
    await page.getByRole('button', { name: /fallback ladder/i }).click();

    const before = await withDb((db) => db.collection('platform_settings').findOne({ key: 'courierFallbackEnabled' }));
    const beforeValue = before?.value !== false;

    // Toggle.jsx renders { label row }{ button } as immediate siblings inside
    // one flex row div — XPath finds that row from the label text, then its
    // own direct button child, without matching every ancestor div.
    const toggleButton = page
      .locator('xpath=//p[normalize-space(text())="Courier fallback"]/ancestor::div[contains(@class,"justify-between")][1]//button');
    await expect(toggleButton).toBeVisible({ timeout: 10_000 });
    await toggleButton.click();

    await page.getByRole('button', { name: /save changes/i }).click();
    await expect(page.getByText(/settings updated/i)).toBeVisible({ timeout: 15_000 });

    await expect.poll(async () => {
      const doc = await withDb((db) => db.collection('platform_settings').findOne({ key: 'courierFallbackEnabled' }));
      return doc?.value;
    }, { timeout: 15_000 }).toBe(!beforeValue);

    test.info().annotations.push({
      type: 'step',
      description: `Real UI toggle persisted: courierFallbackEnabled ${beforeValue} -> ${!beforeValue}.`,
    });

    // Restore.
    const adminToken = (await loginAdmin()).accessToken;
    const restore = await api('/admin/fulfillment/settings', {
      method: 'PUT', token: adminToken, body: { courierFallbackEnabled: beforeValue },
    });
    expect(restore.ok).toBe(true);
  });

  test('category management: toggling a marketplace tab via the real UI changes what the real customer catalog API returns', async ({ page }) => {
    const adminToken = (await loginAdmin()).accessToken;

    // A disposable test category, not one shared seeded fixture other specs
    // rely on — created starting visible ONLY on Quick Shop.
    const created = await api('/admin/categories', {
      method: 'POST',
      token: adminToken,
      body: {
        name: `E2E Admin Test Category ${Date.now()}`,
        slug: `e2e-admin-test-category-${Date.now()}`,
        isActive: true,
        commerceFlows: ['quick_shop'],
        visibleTabs: ['quick_shop'],
      },
    });
    expect(created.ok, `category create failed: ${JSON.stringify(created.json)}`).toBe(true);
    const categoryId = created.body.id || created.body._id;

    try {
      // Confirmed absent from Groceries & Fresh before any UI action.
      // GET /categories returns the tree array directly as `data` (see
      // CategoryService._buildTree), not wrapped in a `categories` key.
      const beforeFresh = await api('/categories?marketplaceTab=groceries_fresh', { method: 'GET' });
      expect((beforeFresh.body || []).some((c) => String(c.id) === String(categoryId))).toBeFalsy();

      await openAdminPortal(page, { path: '/admin/categories' });
      await expect(page.getByText('Category', { exact: true }).first()).toBeVisible({ timeout: 20_000 });

      const row = page.locator('tr', { has: page.getByText(created.body.name, { exact: true }) }).first();
      await expect(row).toBeVisible({ timeout: 15_000 });
      await row.getByRole('button', { name: /^edit$/i }).click();

      // Modal.jsx renders a plain div (no role="dialog") — anchor on its
      // real heading text instead.
      const modalHeading = page.getByText('Edit Category', { exact: true });
      await expect(modalHeading).toBeVisible({ timeout: 10_000 });

      // Real UI: toggle the "Groceries & Fresh" tab pill ON.
      await page.getByRole('button', { name: 'Groceries & Fresh' }).click();
      await page.getByRole('button', { name: /update category/i }).click();

      await expect(modalHeading).toBeHidden({ timeout: 15_000 });

      // REAL BACKEND: MongoDB now includes groceries_fresh for this category.
      await expect.poll(async () => {
        const doc = await withDb((db) => db.collection('categories').findOne({ _id: new ObjectId(categoryId) }));
        return doc?.visibleTabs || [];
      }, { timeout: 15_000, message: 'waiting for visibleTabs to include groceries_fresh' }).toContain('groceries_fresh');

      // REAL CUSTOMER-FACING CATALOG: the tab now actually returns this
      // category — the same endpoint CategoryProducts.jsx / Home.jsx call.
      // A direct proof against the live backend (outside this suite) showed
      // this reflects instantly with zero measurable cache lag, so a longer
      // timeout here is generous headroom for this suite's own load, not a
      // tolerance for a known-slow path.
      let lastSeenIds = [];
      await expect.poll(async () => {
        const res = await api('/categories?marketplaceTab=groceries_fresh', { method: 'GET' });
        lastSeenIds = (res.body || []).map((c) => c.id);
        return lastSeenIds.includes(String(categoryId));
      }, { timeout: 30_000, message: 'waiting for the customer catalog API to reflect the new tab' })
        .toBe(true);

      test.info().annotations.push({
        type: 'step',
        description: 'Real Admin UI tab toggle -> MongoDB -> real customer catalog API, all confirmed.',
      });
    } finally {
      // Always clean up the disposable fixture, pass or fail.
      await api(`/admin/categories/${categoryId}`, { method: 'DELETE', token: adminToken });
    }
  });
});
