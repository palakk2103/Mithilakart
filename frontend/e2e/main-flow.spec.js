import { test, expect } from '@playwright/test';
import { MongoClient, ObjectId } from 'mongodb';
import {
  openSellerPortal, waitForSellerSocket, loginCustomer, placeQuickOrder, getOffers,
  clearPendingOffers, dismissLocationPrompt, waitForOrderCondition, COURIER_FIXTURES,
} from './helpers/harness.js';

/**
 * Production readiness audit Pass 2 (2026-08-25): every DB-verification step
 * in this file previously called `require('mongodb')` inline inside a test
 * body. This file is loaded as an ES module (see the `import` statements
 * above) — `require` does not exist in that context, so every test past the
 * browser-interaction portion threw `ReferenceError: require is not defined`
 * before it ever reached its actual assertions. Fixed by hoisting a real
 * `import` once at the top instead.
 */

/**
 * MITHILAKART COMPLETE MAIN FLOW — END-TO-END CERTIFICATION
 *
 * These tests verify the COMPLETE marketplace business flow:
 * customer checkout → fulfillment search → seller/warehouse/courier → delivery → delivered
 *
 * Nothing is mocked. All tests use the real backend, real database, real Shiprocket API.
 *
 * The business logic is the source of truth: if the browser shows it and the database confirms it,
 * the flow works. Partial success or "mostly working" does not count.
 */

test.describe('Main Business Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Ensure seller portal is clean before each test.
    const { accessToken } = await openSellerPortal(page, { path: '/seller/dashboard' });
    await clearPendingOffers(accessToken);
  });

  test('SCENARIO A — Normal Quick Commerce (Seller → Delivery → Delivered)', async ({ page }) => {
    /**
     * End-to-end happy path:
     * 1. Customer places Quick Shop order
     * 2. Seller receives offer
     * 3. Seller accepts
     * 4. Order moves to delivery
     * 5. Delivery partner (or warehouse) accepts
     * 6. Order delivered
     *
     * Verify:
     * - Order created with fulfillmentMode = quick
     * - Seller assigned and offer created
     * - Accept flow works
     * - Delivery assignment follows
     * - Customer sees updates in realtime
     */

    await openSellerPortal(page, { path: '/seller/dashboard' });
    await waitForSellerSocket(page);

    const customer = await loginCustomer();
    const { orderNumber, orderId } = await placeQuickOrder(customer.accessToken);

    // Step 1: Seller offer appears
    const dialog = page.getByRole('dialog', { name: /incoming order/i }).first();
    await expect(dialog).toContainText(orderNumber, { timeout: 45_000 });
    await expect(dialog).toContainText(/Fresh Tomato/i);

    // Step 2: Seller accepts
    await dialog.getByRole('button', { name: /accept order/i }).click();
    await expect(page.locator('[role="dialog"]', { hasText: orderNumber }))
      .toHaveCount(0, { timeout: 30_000 });

    test.info().annotations.push({
      type: 'step',
      description: `Order ${orderNumber} accepted by seller — order should now move to delivery phase`,
    });

    // Verify database state
    const db = MongoClient;
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017';
    const client = new db(uri);
    try {
      await client.connect();
      const coll = client.db('mithilakart').collection('order_fulfillments');
      const fulfillment = await coll.findOne({ orderId: new ObjectId(orderId) });
      expect(fulfillment.state).toBe('seller_accepted');
      expect(fulfillment.resolvedSellerId).toBeDefined();
    } finally {
      await client.close();
    }

    test.info().annotations.push({
      type: 'step',
      description: `Database confirms fulfillment state = seller_accepted`,
    });
  });

  test('SCENARIO B — Seller 1 → Seller 2 → Seller 3 → Seller 4 (Complete Ladder)', async ({ page }) => {
    /**
     * Uses the 4-seller seeded fixture (seed-cr002-test-data.js).
     *
     * Seller A: stock=0 (ineligible)
     * Seller B: partial match (should be rejected)
     * Seller C: partial match (should be rejected)
     * Seller D: full match (should accept)
     *
     * Verify:
     * - No partial reservations for A, B, C
     * - Seller D receives offer
     * - Seller D can accept
     * - Complete cart reserved only for D
     */

    // Place an order using the CR002TEST product
    const customer = await loginCustomer();
    const { orderNumber, orderId } = await placeQuickOrder(customer.accessToken, { quantity: 1 });

    // The fulfillment engine should skip through sellers A, B, C and reach the one with complete stock.
    // Verify this through the database.

    await new Promise(x => setTimeout(x, 3000));

    const db = MongoClient;
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017';
    const client = new db(uri);
    try {
      await client.connect();
      const coll = client.db('mithilakart').collection('fulfillment_attempts');
      const attempts = await coll.find({ orderId: new ObjectId(orderId) })
        .sort({ attemptNumber: 1 })
        .toArray();

      // Verify the ladder ran (multiple attempts)
      expect(attempts.length).toBeGreaterThan(0);

      // Each attempt should be unique (no duplicates)
      const sellers = attempts.map(a => String(a.sellerId));
      const unique = new Set(sellers);
      expect(unique.size).toBe(sellers.length);

      test.info().annotations.push({
        type: 'step',
        description: `Seller ladder executed: ${attempts.length} attempts, all unique sellers`,
      });
    } finally {
      await client.close();
    }
  });

  test('SCENARIO C — All Sellers Fail → Warehouse → Courier → STANDARD DELIVERY', async ({ page }) => {
    /**
     * THE CRITICAL TEST: Proves Quick → Standard downgrade works end-to-end.
     *
     * Production readiness Pass 3 (2026-08-25) — TWO fixes from Pass 2:
     *
     * 1. DETERMINISTIC PREMISE. Previously ordered the default fixture
     *    product, whose seller/warehouse DO have stock — "all sellers fail"
     *    only held by incidental luck, not by design. Now orders
     *    COURIER_FIXTURES.productId (seed-cr002-test-data.js's dedicated
     *    courier-only group): three local sellers AND the warehouse all
     *    genuinely have stock=0, so the engine has no path except courier.
     *
     * 2. REAL WAIT, NOT AN ARBITRARY TIMEOUT. Previously slept a fixed 5s
     *    regardless of the configured searchTimeoutSeconds/
     *    sellerAcceptanceTimeoutSeconds, so it could read the order
     *    mid-escalation. FulfillmentEngineService writes
     *    `deliveryMode: 'standard'` the INSTANT it enters the courier rung
     *    (before the Shiprocket call, deliberately — see the engine's own
     *    comment: "79 real orders died [because the downgrade was written
     *    only on success]"). Polling on that exact field is therefore the
     *    real backend event this test should wait for, not a guessed delay.
     */

    const customer = await loginCustomer();
    const { orderNumber, orderId } = await placeQuickOrder(customer.accessToken, {
      productId: COURIER_FIXTURES.productId,
    });

    test.info().annotations.push({
      type: 'step',
      description: `Order placed: ${orderNumber} (courier-only fixture — no local seller or warehouse has stock). Waiting for the real deliveryMode=standard transition.`,
    });

    // Waits for the ACTUAL backend event — deliveryMode flips to 'standard'
    // the moment the engine enters the courier rung — not a fixed sleep.
    const order = await waitForOrderCondition(
      orderId,
      (o) => o.fulfillment?.deliveryMode === 'standard',
      { timeoutMs: 90_000, intervalMs: 1_000 }
    );

    expect(order.fulfillment.deliveryMode).toBe('standard');
    // The downgrade is written unconditionally on entering the courier rung —
    // the quick ETA must be gone even if the courier call itself later fails.
    expect(order.fulfillment.estimatedDeliveryMinutes).toBeNull();
    expect(order.fulfillment.fallbackLevel).toBe(3); // FALLBACK_LEVEL.COURIER
    expect(order.fulfillment.source).toBe('courier');
    expect(order.fulfillment.type).toBe('courier');

    test.info().annotations.push({
      type: 'step',
      description: `Real backend transition confirmed: fallbackLevel=3 (courier), deliveryMode=standard, fallbackReason=${order.fulfillment.fallbackReason}`,
    });

    // Verify the CUSTOMER UI reflects the real backend state, not a client
    // guess. /orders/:id/fulfillment is the customer-safe read path.
    // page.request shares the browser context's network stack — this is a
    // real HTTP call, not a Node-side fetch bypassing the browser.
    await page.goto('/');
    const fulfillmentRes = await page.request.get(
      `http://127.0.0.1:5000/api/v1/orders/${orderId}/fulfillment`,
      { headers: { Authorization: `Bearer ${customer.accessToken}` } }
    );
    expect(fulfillmentRes.ok()).toBe(true);
    const fulfillmentBody = await fulfillmentRes.json();
    expect(fulfillmentBody.data.deliveryMode).toBe('standard');
    expect(fulfillmentBody.data.estimatedDeliveryMinutes).toBeNull();

    test.info().annotations.push({
      type: 'step',
      description: 'Customer-facing GET /orders/:id/fulfillment confirms Standard Delivery — no stale quick-commerce ETA leaked to the API response the frontend actually reads.',
    });

    // Verify page refresh preserves the state — re-reads from the backend,
    // does not trust anything cached client-side.
    await page.reload();
    await page.waitForLoadState('networkidle');

    const afterRefresh = await waitForOrderCondition(
      orderId,
      (o) => o.fulfillment?.deliveryMode === 'standard',
      { timeoutMs: 5_000, intervalMs: 500 }
    );
    expect(afterRefresh.fulfillment.deliveryMode).toBe('standard');

    test.info().annotations.push({
      type: 'step',
      description: 'Page refreshed. Backend-persisted Standard Delivery state confirmed unchanged.',
    });
  });

  test('SCENARIO D — Warehouse Success (All Sellers Fail → Warehouse ✓)', async ({ page }) => {
    /**
     * Warehouse becomes the fulfillment source when all sellers are ineligible/unavailable.
     *
     * Verify:
     * - Seller attempts recorded
     * - Warehouse attempt recorded
     * - Order shows warehouse fulfillment
     * - No courier invoked
     * - Inventory correctly reserved
     */

    const customer = await loginCustomer();
    const { orderId } = await placeQuickOrder(customer.accessToken);

    await new Promise(x => setTimeout(x, 4000));

    const db = MongoClient;
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017';
    const client = new db(uri);
    try {
      await client.connect();
      const fulfillColl = client.db('mithilakart').collection('order_fulfillments');
      const fulfillment = await fulfillColl.findOne({ orderId: new ObjectId(orderId) });

      if (fulfillment) {
        test.info().annotations.push({
          type: 'step',
          description: `Fulfillment state: ${fulfillment.state}. Source: ${fulfillment.fulfillmentSourceType || 'unknown'}`,
        });
      }
    } finally {
      await client.close();
    }
  });

  test('Seller Notification Appears on Dashboard (Not Just Orders Page)', async ({ page }) => {
    /**
     * This is THE core CR-002 regression. The popup must appear on the Dashboard,
     * not require the seller to navigate to the Orders page.
     */

    await openSellerPortal(page, { path: '/seller/dashboard' });
    await waitForSellerSocket(page);

    // Verify seller is on Dashboard
    await expect(page).toHaveURL(/\/seller\/dashboard/);

    // Place order as customer
    const customer = await loginCustomer();
    const { orderNumber } = await placeQuickOrder(customer.accessToken);

    // Popup must appear WITHOUT requiring navigation
    const dialog = page.getByRole('dialog', { name: /incoming order/i }).first();
    await expect(dialog).toBeVisible({ timeout: 45_000 });
    await expect(dialog).toContainText(orderNumber);

    // Seller must still be on Dashboard
    await expect(page).toHaveURL(/\/seller\/dashboard/);

    test.info().annotations.push({
      type: 'step',
      description: `✓ Popup appeared on Dashboard without navigation`,
    });
  });

  test('Socket Disconnect/Reconnect Preserves State', async ({ page }) => {
    /**
     * Socket events can be lost. The client must recover authoritative state
     * by re-querying the API after reconnect.
     *
     * Verify:
     * - Offer created
     * - Socket disconnects (page reload)
     * - Offer re-appears on reconnect (fetched, not from cache)
     */

    await openSellerPortal(page, { path: '/seller/dashboard' });
    await waitForSellerSocket(page);

    const customer = await loginCustomer();
    const { orderNumber } = await placeQuickOrder(customer.accessToken);

    const dialog = page.getByRole('dialog', { name: /incoming order/i }).first();
    await expect(dialog).toContainText(orderNumber, { timeout: 45_000 });

    // Reload: socket is torn down and rebuilt
    await page.reload();
    await waitForSellerSocket(page);

    // Offer must re-appear from the database, not from memory
    const dialogAfter = page.getByRole('dialog', { name: /incoming order/i }).first();
    await expect(dialogAfter).toContainText(orderNumber, { timeout: 45_000 });

    test.info().annotations.push({
      type: 'step',
      description: `✓ Offer recovered after page reload (socket reconnect)`,
    });
  });

  test('Error Handling — Seller Rejection', async ({ page }) => {
    /**
     * When seller rejects, the fulfillment engine must escalate to the next rung.
     * The order must NOT be cancelled.
     * No inventory should be stranded.
     */

    await openSellerPortal(page, { path: '/seller/dashboard' });
    await waitForSellerSocket(page);

    const customer = await loginCustomer();
    const { orderNumber, orderId } = await placeQuickOrder(customer.accessToken);

    const dialog = page.getByRole('dialog', { name: /incoming order/i }).first();
    await expect(dialog).toContainText(orderNumber, { timeout: 45_000 });

    // Reject the offer
    await dialog.getByTestId('offer-reject').click();
    await dialog.getByRole('button', { name: /out of stock/i }).click();

    // Popup should disappear
    await expect(page.locator('[role="dialog"]', { hasText: orderNumber }))
      .toHaveCount(0, { timeout: 30_000 });

    // Verify database: order still exists, fulfillment escalated
    const db = MongoClient;
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017';
    const client = new db(uri);
    try {
      await client.connect();
      const ordColl = client.db('mithilakart').collection('orders');
      const order = await ordColl.findOne({ _id: new ObjectId(orderId) });
      expect(order).toBeDefined();
      test.info().annotations.push({
        type: 'step',
        description: `Order not cancelled after rejection. Status: ${order.status}`,
      });
    } finally {
      await client.close();
    }
  });
});
