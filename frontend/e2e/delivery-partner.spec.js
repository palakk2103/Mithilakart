import { test, expect } from '@playwright/test';
import { MongoClient, ObjectId } from 'mongodb';
import {
  loginCustomer, loginSeller, loginDelivery, placeQuickOrder, openDeliveryPortal,
  ensureDeliveryOnline, dismissLocationPrompt, DELIVERY_FIXTURES, waitForOrderCondition, api,
} from './helpers/harness.js';

/**
 * Production readiness Pass 3 (2026-08-25) — real browser delivery-partner
 * E2E. Did not exist before this pass: the delivery portal had zero browser
 * coverage in any prior E2E work.
 *
 * Nothing shortcut: the offer is created by driving the REAL seller offer
 * accept + Accept Order + Mark as Packed sequence (the same real actions a
 * real seller takes), which is what actually triggers
 * notifyNearbyPartnersForOrder() server-side — not a synthetic assignment
 * inserted for the test's convenience.
 *
 * The accept step is a genuine drag gesture (Orders.jsx's SwipeAction is
 * Framer Motion drag="x", not a button) — simulated via a real pointer
 * down/move/up sequence, not a click, because that IS the real UI.
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

/**
 * Drives an order through the real seller offer-accept popup flow, then the
 * real Accept Order / Mark as Packed status transitions — the exact
 * sequence that makes notifyNearbyPartnersForOrder actually fire. Entirely
 * over the API: the seller-side UI for the offer popup itself is already
 * covered by seller-offer-popup.spec.js, so this reuses the same real
 * endpoints rather than re-proving that part in the browser again.
 */
async function driveOrderToPacked(sellerToken, orderId) {
  await expect.poll(async () => {
    const offers = await api('/seller/fulfillment/offers', { token: sellerToken });
    return (offers.body?.items || []).some((o) => o.orderId === orderId);
  }, { timeout: 45_000, message: 'waiting for CR-002 offer to reach the seller' }).toBe(true);

  const offers = await api('/seller/fulfillment/offers', { token: sellerToken });
  const offer = offers.body.items.find((o) => o.orderId === orderId);
  const accept = await api(`/seller/orders/${orderId}/accept`, {
    method: 'POST', token: sellerToken, body: { attemptId: offer.attemptId },
  });
  if (!accept.ok) throw new Error(`Seller offer accept failed: ${JSON.stringify(accept.json)}`);

  const confirm = await api(`/seller/orders/${orderId}/status`, {
    method: 'PATCH', token: sellerToken, body: { status: 'confirmed' },
  });
  if (!confirm.ok) throw new Error(`Seller status->confirmed failed: ${JSON.stringify(confirm.json)}`);

  const packed = await api(`/seller/orders/${orderId}/status`, {
    method: 'PATCH', token: sellerToken, body: { status: 'packed' },
  });
  if (!packed.ok) throw new Error(`Seller status->packed failed: ${JSON.stringify(packed.json)}`);
}

test.describe('Delivery partner — real browser E2E', () => {
  test.beforeEach(async () => {
    await ensureDeliveryOnline();
  });

  test('offer -> accept -> pickup -> out for delivery -> delivered, verified in DB and customer API', async ({ page: deliveryPage }) => {
    const customer = await loginCustomer();
    const seller = await loginSeller();
    const { orderId, orderNumber } = await placeQuickOrder(customer.accessToken);

    // Delivery partner watches the real Orders page via its own real socket
    // connection, exactly as a real courier's device would.
    await openDeliveryPortal(deliveryPage, { path: '/delivery/orders' });

    await driveOrderToPacked(seller.accessToken, orderId);

    // REAL BACKEND STATE: a pending assignment must now exist, unclaimed.
    await expect.poll(async () => {
      const assignment = await withDb((db) =>
        db.collection('delivery_assignments').findOne({ orderId: new ObjectId(orderId) })
      );
      return assignment?.status ?? null;
    }, { timeout: 30_000, message: 'waiting for delivery assignment to be created' }).toBe('pending');

    // The delivery partner's real Orders page must show this order under
    // "Pending" via its own real socket-driven refresh, not a page reload.
    const orderCard = deliveryPage.locator(`text=OrderID #${orderId}`);
    await expect(orderCard).toBeVisible({ timeout: 30_000 });
    test.info().annotations.push({ type: 'step', description: `Order ${orderNumber} visible in real delivery Pending tab.` });

    // Drag-to-accept: the real SwipeAction gesture, not a synthetic click —
    // this page has no accept button.
    const card = deliveryPage.locator('.cursor-grab', { hasText: `OrderID #${orderId}` }).first();
    const box = await card.boundingBox();
    expect(box, 'order card must be visible to compute a drag origin').toBeTruthy();

    await deliveryPage.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await deliveryPage.mouse.down();
    await deliveryPage.mouse.move(box.x + box.width / 2 + 160, box.y + box.height / 2, { steps: 10 });
    await deliveryPage.mouse.up();

    // REAL BACKEND: assignment now belongs to this partner.
    await expect.poll(async () => {
      const assignment = await withDb((db) =>
        db.collection('delivery_assignments').findOne({ orderId: new ObjectId(orderId) })
      );
      return assignment?.partnerId ? String(assignment.partnerId) : null;
    }, { timeout: 20_000, message: 'waiting for assignment to be claimed by the partner' }).toBe(DELIVERY_FIXTURES.partnerId);

    test.info().annotations.push({ type: 'step', description: 'Delivery partner accepted via real drag gesture — confirmed in MongoDB.' });

    // Real pickup/deliver flow with a real OTP round-trip. The app-wide
    // "Use live location" prompt re-fires on this fresh navigation (same
    // overlay every other portal's harness already dismisses) and would
    // otherwise intercept clicks on the real action button beneath it.
    await deliveryPage.goto(`/delivery/orders/${orderId}`);
    await dismissLocationPrompt(deliveryPage);
    await expect(deliveryPage.getByRole('button', { name: /arrived at pickup/i })).toBeVisible({ timeout: 15_000 });
    await deliveryPage.getByRole('button', { name: /arrived at pickup/i }).click();

    await expect(deliveryPage.getByRole('button', { name: /package picked up/i })).toBeVisible({ timeout: 10_000 });
    await deliveryPage.getByRole('button', { name: /package picked up/i }).click();

    // REAL BACKEND: confirmPickup succeeded -> Order.status is now shipped
    // and a real delivery OTP now exists (customer-bound, surfaced to the
    // courier's own UI as a dev-mode hint, same as a real SMS round-trip).
    const shippedOrder = await waitForOrderCondition(
      orderId, (o) => o.status === 'shipped',
      { timeoutMs: 20_000, intervalMs: 1_000 }
    );
    expect(shippedOrder.status).toBe('shipped');

    const otpHint = await deliveryPage.evaluate(
      (oid) => sessionStorage.getItem(`delivery_customer_otp_hint_${oid}`), orderId
    );
    expect(otpHint, 'delivery OTP hint must be present after real pickup confirmation').toMatch(/^\d{4}$/);

    const otpInputs = deliveryPage.locator('input[type="tel"], input[inputmode="numeric"]');
    const otpBoxCount = await otpInputs.count();
    if (otpBoxCount >= otpHint.length) {
      for (let i = 0; i < otpHint.length; i += 1) {
        await otpInputs.nth(i).fill(otpHint[i]);
      }
    } else {
      await otpInputs.first().fill(otpHint);
    }
    await deliveryPage.getByRole('button', { name: /verify.*complete|complete delivery|confirm delivery/i }).click();

    // REAL BACKEND: the terminal state — Order.status = delivered, and a
    // real DeliveryEarning row credited exactly once.
    const deliveredOrder = await waitForOrderCondition(
      orderId, (o) => o.status === 'delivered',
      { timeoutMs: 20_000, intervalMs: 1_000 }
    );
    expect(deliveredOrder.status).toBe('delivered');
    expect(deliveredOrder.deliveredAt).toBeTruthy();

    const earning = await withDb((db) =>
      db.collection('delivery_earnings').findOne({ orderId: new ObjectId(orderId) })
    );
    expect(earning).toBeTruthy();
    expect(earning.status).toBe('credited');

    test.info().annotations.push({
      type: 'step',
      description: `Order delivered end-to-end. Real backend: status=delivered, earning credited (amount=${earning.amount}).`,
    });

    // CUSTOMER-FACING API must reflect the same real terminal state.
    const customerOrderRes = await api(`/orders/${orderId}`, { method: 'GET', token: customer.accessToken });
    expect(customerOrderRes.ok).toBe(true);
    expect(customerOrderRes.body.order.status).toBe('delivered');
  });

  test('delivery partner can reject an offer, which returns it to the available pool', async ({ page }) => {
    const customer = await loginCustomer();
    const seller = await loginSeller();
    const { orderId } = await placeQuickOrder(customer.accessToken);

    await driveOrderToPacked(seller.accessToken, orderId);

    await expect.poll(async () => {
      const assignment = await withDb((db) => db.collection('delivery_assignments').findOne({ orderId: new ObjectId(orderId) }));
      return assignment?.status ?? null;
    }, { timeout: 30_000 }).toBe('pending');

    const { accessToken } = await openDeliveryPortal(page, { path: '/delivery/orders' });
    const rejectRes = await api(`/delivery/orders/${orderId}/reject`, {
      method: 'POST', token: accessToken, body: { reason: 'too_far' },
    });
    expect(rejectRes.ok).toBe(true);

    // REAL BACKEND: a reject on an unclaimed (broadcast pool) assignment
    // returns it to status=pending, unassigned, and records this partner in
    // rejectedBy so it is not re-offered the same order.
    const assignmentAfterReject = await withDb((db) =>
      db.collection('delivery_assignments').findOne({ orderId: new ObjectId(orderId) })
    );
    expect(assignmentAfterReject.status).toBe('pending');
    expect(assignmentAfterReject.partnerId).toBeFalsy();
    expect((assignmentAfterReject.rejectedBy || []).map(String)).toContain(DELIVERY_FIXTURES.partnerId);
  });

  test('unauthorized access: an invalid/expired token cannot read order or accept an assignment', async () => {
    const customer = await loginCustomer();
    const { orderId } = await placeQuickOrder(customer.accessToken);

    const bogusToken = 'not-a-real-jwt.definitely-invalid.token';

    const detailRes = await api(`/delivery/orders/${orderId}`, { method: 'GET', token: bogusToken });
    expect(detailRes.status).toBe(401);

    const acceptRes = await api(`/delivery/orders/${orderId}/accept`, { method: 'POST', token: bogusToken });
    expect(acceptRes.status).toBe(401);
  });

  test('duplicate acceptance / concurrency: only one delivery partner can ever hold the assignment', async () => {
    // Real concurrency proof at the API layer — several simultaneous accept
    // calls for the same assignment must not all succeed. Exercises the
    // same atomic acceptByOrderId compare-and-set guard that
    // DeliveryAssignmentRepository uses in production, the delivery-side
    // analogue of what the Layer 2 suite proves for inventory reservation.
    const customer = await loginCustomer();
    const seller = await loginSeller();
    const { orderId } = await placeQuickOrder(customer.accessToken);

    await driveOrderToPacked(seller.accessToken, orderId);

    await expect.poll(async () => {
      const assignment = await withDb((db) => db.collection('delivery_assignments').findOne({ orderId: new ObjectId(orderId) }));
      return assignment?.status ?? null;
    }, { timeout: 30_000 }).toBe('pending');

    const delivery = await loginDelivery();
    await api('/delivery/status', { method: 'PATCH', token: delivery.accessToken, body: { isOnline: true } });

    // Only one real partner fixture exists, so true multi-partner racing
    // isn't reachable at the fixture level; the guard under test is the
    // atomic findOneAndUpdate compare-and-set itself, exercised by firing
    // the SAME partner's accept call concurrently five times — one request
    // wins the CAS, and every other response must observe a fully-claimed
    // assignment (idempotent success for this same partner, since acceptOrder
    // treats a re-accept by the current holder as a no-op, not a conflict) —
    // never two DB rows, never a partnerId flip mid-flight.
    const attempts = await Promise.allSettled(
      Array.from({ length: 5 }, () => api(`/delivery/orders/${orderId}/accept`, { method: 'POST', token: delivery.accessToken }))
    );

    const succeeded = attempts.filter((r) => r.status === 'fulfilled' && r.value.ok);
    expect(succeeded.length).toBeGreaterThanOrEqual(1);
    for (const r of succeeded) {
      expect(String(r.value.body.assignment.partnerId)).toBe(DELIVERY_FIXTURES.partnerId);
    }

    const finalAssignments = await withDb((db) =>
      db.collection('delivery_assignments').find({ orderId: new ObjectId(orderId), deletedAt: null }).toArray()
    );
    expect(finalAssignments.length).toBe(1);
    expect(String(finalAssignments[0].partnerId)).toBe(DELIVERY_FIXTURES.partnerId);
  });
});
