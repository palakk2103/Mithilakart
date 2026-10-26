const { createHarness } = require('../../helpers/fulfillmentHarness');
const {
  FULFILLMENT_STATE: STATE,
  FULFILLMENT_FAILURE_CODE: FAIL,
} = require('../../../src/constants/fulfillment');
const { eventBus } = require('../../../src/events/EventBus');
const { FULFILLMENT_EVENTS } = require('../../../src/events/eventTypes');

/**
 * REGRESSION — CR-002 Failure 3b.
 * See docs/cr-002/REAL_FLOW_FAILURE_ANALYSIS.md.
 *
 * Production evidence: 79 of 79 courier attempts failed (COURIER_UNAVAILABLE),
 * because SHIPROCKET_PICKUP_LOCATION named a pickup location that did not exist
 * on the account. The engine wrote the QUICK -> STANDARD downgrade only on the
 * provider success path, so all 79 orders died in `failed` while still showing
 * the customer a quick-commerce delivery promise they could never receive.
 *
 * The rule these tests lock in: entering the courier rung means quick delivery
 * is already impossible. That downgrade is a business fact and must be persisted
 * BEFORE, and independently of, any third-party API call.
 */
function captureEvents() {
  const seen = [];
  const unsubscribes = Object.values(FULFILLMENT_EVENTS).map((name) =>
    eventBus.subscribe(name, (event) => seen.push({ name, payload: event.payload })));
  return { seen, stop: () => unsubscribes.forEach((fn) => fn()) };
}

/** Sellers and warehouse exhausted -> the order lands on the courier rung. */
function orderThatReachesCourier(h) {
  const seller = h.addSeller();
  const product = h.addProduct(seller._id, { stock: 0 }).product;
  return h.addOrder({ items: [{ sellerId: seller._id, productId: product._id }] });
}

describe('CR-002 regression — courier failure must not strand a quick promise', () => {
  let events;

  beforeEach(() => { events = captureEvents(); });
  afterEach(() => { events.stop(); });

  it('downgrades the order to STANDARD even when the courier provider fails', async () => {
    const h = createHarness();
    h.courierShipmentService.createForOrder.mockRejectedValue(new Error('Shiprocket 503'));

    const order = orderThatReachesCourier(h);
    const fulfillment = await h.engine.start(order._id);

    // The fulfillment still fails — an operator must act.
    expect(fulfillment.state).toBe(STATE.FAILED);

    const updated = h.db.orders.get(String(order._id));

    // ...but the ORDER is standard delivery, not a dead quick promise.
    expect(updated.fulfillment.deliveryMode).toBe('standard');
    expect(updated.fulfillment.type).toBe('courier');
    expect(updated.fulfilmentType).toBe('courier');

    // The exact regression: no quick countdown may survive.
    expect(updated.fulfillment.estimatedDeliveryMinutes).toBeNull();
    expect(updated.deliveryPromiseMinutes).toBeNull();
    expect(updated.estimatedDeliveryAt).toBeNull();
  });

  it('never reports a shipment that was not created', async () => {
    const h = createHarness();
    h.courierShipmentService.createForOrder.mockRejectedValue(new Error('Shiprocket 503'));

    const order = orderThatReachesCourier(h);
    await h.engine.start(order._id);

    const updated = h.db.orders.get(String(order._id));

    // Downgraded, but explicitly NOT shipped: no AWB, no tracking, no provider.
    expect(updated.shipment).toBeFalsy();
    expect(updated.fulfillment.courierProvider).toBeNull();
  });

  it('tells the customer the mode changed before the provider is called', async () => {
    const h = createHarness();
    // Never resolves — simulates a provider hanging rather than failing fast.
    h.courierShipmentService.createForOrder.mockImplementation(() => new Promise(() => {}));

    const order = orderThatReachesCourier(h);
    h.engine.start(order._id);

    // Let the engine reach (and block on) the provider call.
    await new Promise((resolve) => setImmediate(resolve));

    const fallback = events.seen.find((e) => e.name === FULFILLMENT_EVENTS.COURIER_FALLBACK);
    expect(fallback).toBeTruthy();
    expect(fallback.payload.shipmentPending).toBe(true);

    // The order is already standard, while the courier API has not answered.
    const updated = h.db.orders.get(String(order._id));
    expect(updated.fulfillment.deliveryMode).toBe('standard');
  });

  it('reasserts STANDARD on the failure event so the client cannot revert to quick', async () => {
    const h = createHarness();
    h.courierShipmentService.createForOrder.mockRejectedValue(new Error('Shiprocket 503'));

    const order = orderThatReachesCourier(h);
    await h.engine.start(order._id);

    const failure = events.seen.find((e) => e.name === FULFILLMENT_EVENTS.FAILED);
    expect(failure).toBeTruthy();
    // The customer projection sends deliveryMode on every event; omitting it
    // here would null the field client-side and snap the UI back to "15 min".
    expect(failure.payload.deliveryMode).toBe('standard');
  });

  it('distinguishes a misconfigured courier account from a transient outage', async () => {
    const h = createHarness();
    const configError = new Error(
      'Shiprocket pickup location "Primary" does not exist on this account.'
    );
    configError.code = 'COURIER_MISCONFIGURED';
    h.courierShipmentService.createForOrder.mockRejectedValue(configError);

    const order = orderThatReachesCourier(h);
    const fulfillment = await h.engine.start(order._id);

    // A deterministic operator fix must not hide inside a generic "unavailable".
    expect(fulfillment.failureCode).toBe(FAIL.COURIER_MISCONFIGURED);
  });

  it('still releases all local stock on the failure path', async () => {
    const h = createHarness();
    h.courierShipmentService.createForOrder.mockRejectedValue(new Error('Shiprocket 503'));

    const order = orderThatReachesCourier(h);
    await h.engine.start(order._id);

    expect(h.totalReserved()).toBe(0);
    h.assertInventorySane();
  });
});
