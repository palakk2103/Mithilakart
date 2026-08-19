import { test, expect } from '@playwright/test';
import {
  openSellerPortal, waitForSellerSocket, loginCustomer, placeQuickOrder, getOffers,
  clearPendingOffers, loginSeller,
} from './helpers/harness.js';

/**
 * CR-002 — THE regression this whole effort exists for.
 *
 * Production evidence (docs/cr-002/REAL_FLOW_FAILURE_ANALYSIS.md): 41 of the 55
 * offers that reached a live seller expired unanswered — 75%. The cause was
 * that `fulfillment_offer` had exactly one listener in the entire frontend, and
 * it was mounted inside the Orders page. Sellers land on the Dashboard after
 * login, so the offer arrived, landed on zero listeners, and timed out.
 *
 * The decisive assertion in this file is therefore not "a popup can appear" but
 * "a popup appears WHILE THE SELLER IS ON THE DASHBOARD". A test that navigated
 * to the Orders page first would have passed against the broken build.
 */
test.describe('Seller incoming-order popup', () => {
  // Offers persist in MongoDB until answered, so a leftover from an earlier run
  // would be the one the popup shows. Start every spec from a clean slate.
  test.beforeEach(async () => {
    const { accessToken } = await loginSeller();
    await clearPendingOffers(accessToken);
  });

  test('appears on the Dashboard — not only on the Orders page', async ({ page }) => {
    await openSellerPortal(page, { path: '/seller/dashboard' });
    await waitForSellerSocket(page);

    // Confirm the premise: we really are on the Dashboard, not the Orders page.
    await expect(page).toHaveURL(/\/seller\/dashboard/);

    const customer = await loginCustomer();
    const { orderNumber } = await placeQuickOrder(customer.accessToken);

    // The popup must appear with no navigation and no reload.
    const dialog = page.getByRole('dialog', { name: /incoming order/i }).first();
    await expect(dialog).toBeVisible({ timeout: 45_000 });
    await expect(dialog).toContainText(orderNumber);

    // Still on the Dashboard — the popup came to the seller, not vice versa.
    await expect(page).toHaveURL(/\/seller\/dashboard/);
  });

  test('shows what to pack, the value, the area and a live countdown', async ({ page }) => {
    await openSellerPortal(page, { path: '/seller/dashboard' });
    await waitForSellerSocket(page);

    const customer = await loginCustomer();
    await placeQuickOrder(customer.accessToken, { quantity: 2 });

    const dialog = page.getByRole('dialog', { name: /incoming order/i }).first();
    await expect(dialog).toBeVisible({ timeout: 45_000 });

    // Product detail — a seller cannot decide in 60s from "1 item".
    await expect(dialog).toContainText(/Tomato/i);
    await expect(dialog).toContainText('×2');

    // Delivery area, but never the exact address or the customer's phone.
    await expect(dialog).toContainText(/Patna|800001/);
    await expect(dialog).not.toContainText('9999999999');
    await expect(dialog).not.toContainText(/Boring Road/i);

    // Countdown is server-driven and must actually tick down.
    const seconds = () => dialog.locator('text=/^\\d+s$/').first().innerText();
    const first = parseInt((await seconds()).replace('s', ''), 10);
    expect(first).toBeGreaterThan(0);

    await page.waitForTimeout(3000);
    const second = parseInt((await seconds()).replace('s', ''), 10);
    expect(second).toBeLessThan(first);

    await expect(dialog.getByRole('button', { name: /accept order/i })).toBeVisible();
  });

  test('accepting the offer clears the popup and is recorded by the backend', async ({ page }) => {
    const { accessToken } = await openSellerPortal(page, { path: '/seller/dashboard' });
    await waitForSellerSocket(page);

    const customer = await loginCustomer();
    const { orderId, orderNumber } = await placeQuickOrder(customer.accessToken);

    const dialog = page.getByRole('dialog', { name: /incoming order/i }).first();
    await expect(dialog).toContainText(orderNumber, { timeout: 45_000 });

    await dialog.getByRole('button', { name: /accept order/i }).click();

    // This offer must disappear. A DIFFERENT offer may legitimately take its
    // place, so asserting 'no dialog at all' would be wrong.
    await expect(page.locator('[role="dialog"]', { hasText: orderNumber }))
      .toHaveCount(0, { timeout: 30_000 });

    // The backend, not the UI, is the source of truth for the outcome.
    await expect.poll(
      async () => (await getOffers(accessToken)).some((o) => o.orderId === orderId),
      { timeout: 30_000 }
    ).toBe(false);
  });

  test('rejecting hands the order onward without the seller touching anything else', async ({ page }) => {
    const { accessToken } = await openSellerPortal(page, { path: '/seller/dashboard' });
    await waitForSellerSocket(page);

    const customer = await loginCustomer();
    const { orderId, orderNumber } = await placeQuickOrder(customer.accessToken);

    const dialog = page.getByRole('dialog', { name: /incoming order/i }).first();
    await expect(dialog).toContainText(orderNumber, { timeout: 45_000 });

    // Reject -> reason picker -> reason.
    await dialog.getByTestId('offer-reject').click();
    await dialog.getByRole('button', { name: /out of stock/i }).click();

    await expect(page.locator('[role="dialog"]', { hasText: orderNumber }))
      .toHaveCount(0, { timeout: 30_000 });

    // The offer must be gone for THIS seller; the engine moves on by itself.
    await expect.poll(
      async () => (await getOffers(accessToken)).some((o) => o.orderId === orderId),
      { timeout: 30_000 }
    ).toBe(false);
  });

  test('the offer survives a socket disconnect and reconnect', async ({ page }) => {
    await openSellerPortal(page, { path: '/seller/dashboard' });
    await waitForSellerSocket(page);

    const customer = await loginCustomer();
    const { orderNumber } = await placeQuickOrder(customer.accessToken);

    const dialog = page.getByRole('dialog', { name: /incoming order/i }).first();
    await expect(dialog).toBeVisible({ timeout: 45_000 });

    // Reload: the socket is torn down and rebuilt, and any in-memory offer state
    // is lost. The offer must come back from the database, not from the event.
    await page.reload();

    await expect(page.getByRole('dialog', { name: /incoming order/i }).first())
      .toContainText(orderNumber, { timeout: 45_000 });
  });
});
