const { createHarness } = require('../../helpers/fulfillmentHarness');
const { FULFILLMENT_STATE: STATE, FULFILLMENT_FAILURE_CODE: FAIL } = require('../../../src/constants/fulfillment');
const { eventBus } = require('../../../src/events/EventBus');
const { FULFILLMENT_EVENTS } = require('../../../src/events/eventTypes');

function captureEvents() {
  const seen = [];
  const names = Object.values(FULFILLMENT_EVENTS);
  const unsubscribes = names.map((name) =>
    eventBus.subscribe(name, (event) => seen.push({ name, payload: event.payload })));

  return { seen, stop: () => unsubscribes.forEach((fn) => fn()) };
}

describe('CR-002 FulfillmentEngineService', () => {
  let events;

  beforeEach(() => { events = captureEvents(); });
  afterEach(() => { events.stop(); });

  describe('tab gating', () => {
    it('T-38: is not enabled for standard marketplace tabs', async () => {
      const h = createHarness();
      expect(await h.engine.isEnabledForTab('mithilakart')).toBe(false);
      expect(await h.engine.isEnabledForTab('mithilak')).toBe(false);
    });

    it('is enabled for quick commerce tabs', async () => {
      const h = createHarness();
      expect(await h.engine.isEnabledForTab('quick_shop')).toBe(true);
      expect(await h.engine.isEnabledForTab('groceries_fresh')).toBe(true);
    });

    it('is disabled when quick commerce is switched off by Admin', async () => {
      const h = createHarness({ platformSettings: { quickCommerceEnabled: false } });
      expect(await h.engine.isEnabledForTab('quick_shop')).toBe(false);
    });
  });

  describe('happy path', () => {
    it('T-01: single product, single seller — reserves and offers', async () => {
      const h = createHarness();
      const seller = h.addSeller();
      const { product } = h.addProduct(seller._id);
      const order = h.addOrder({ items: [{ sellerId: seller._id, productId: product._id, quantity: 2 }] });

      const fulfillment = await h.engine.start(order._id);

      expect(fulfillment.state).toBe(STATE.SELLER_ASSIGNED);
      expect(String(fulfillment.resolvedSellerId)).toBe(String(seller._id));
      expect(h.stockOf(product._id)).toEqual({ stock: 10, reservedStock: 2 });
      h.assertInventorySane();

      expect(events.seen.map((e) => e.name)).toContain(FULFILLMENT_EVENTS.SELLER_ASSIGNED);
    });

    it('T-02: multiple products from one seller reserve atomically', async () => {
      const h = createHarness();
      const seller = h.addSeller();
      const a = h.addProduct(seller._id).product;
      const b = h.addProduct(seller._id).product;
      const c = h.addProduct(seller._id).product;

      const order = h.addOrder({ items: [
        { sellerId: seller._id, productId: a._id },
        { sellerId: seller._id, productId: b._id },
        { sellerId: seller._id, productId: c._id },
      ] });

      await h.engine.start(order._id);

      for (const p of [a, b, c]) expect(h.stockOf(p._id).reservedStock).toBe(1);
      h.assertInventorySane();
    });

    it('sets an acceptance deadline from configuration, not a literal', async () => {
      const h = createHarness({ platformSettings: { sellerAcceptanceTimeoutSeconds: 45 } });
      const seller = h.addSeller();
      const { product } = h.addProduct(seller._id);
      const order = h.addOrder({ items: [{ sellerId: seller._id, productId: product._id }] });

      const before = Date.now();
      const fulfillment = await h.engine.start(order._id);
      const deadlineMs = new Date(fulfillment.acceptanceDeadlineAt).getTime() - before;

      expect(deadlineMs).toBeGreaterThan(40_000);
      expect(deadlineMs).toBeLessThanOrEqual(46_000);
    });

    it('is idempotent — a second start does not create a second fulfillment', async () => {
      const h = createHarness();
      const seller = h.addSeller();
      const { product } = h.addProduct(seller._id);
      const order = h.addOrder({ items: [{ sellerId: seller._id, productId: product._id }] });

      await h.engine.start(order._id);
      const reservedAfterFirst = h.totalReserved();
      await h.engine.start(order._id);

      expect(h.db.fulfillments.size).toBe(1);
      // No double reservation.
      expect(h.totalReserved()).toBe(reservedAfterFirst);
    });
  });

  describe('complete-cart rule', () => {
    it('T-03: a seller missing one product is skipped entirely', async () => {
      const h = createHarness();
      const incomplete = h.addSeller({ _id: 'seller-incomplete', latitude: 28.6140, longitude: 77.2091 });
      const complete = h.addSeller({ _id: 'seller-complete', latitude: 28.6200, longitude: 77.2200 });

      const a = h.addProduct(incomplete._id, { catalogKey: 'K-A' }).product;
      const b = h.addProduct(incomplete._id, { catalogKey: 'K-B' }).product;
      // incomplete has no C

      h.addProduct(complete._id, { catalogKey: 'K-A' });
      h.addProduct(complete._id, { catalogKey: 'K-B' });
      h.addProduct(complete._id, { catalogKey: 'K-C' });

      const c = h.addProduct(complete._id, { _id: 'prod-C-origin', catalogKey: 'K-C' }).product;

      const order = h.addOrder({ items: [
        { sellerId: incomplete._id, productId: a._id },
        { sellerId: incomplete._id, productId: b._id },
        { sellerId: complete._id, productId: c._id },
      ] });

      const h2 = createHarness({ platformSettings: { crossSellerSubstitutionEnabled: true } });
      // Rebuild in the substitution-enabled harness.
      const inc = h2.addSeller({ _id: 's-inc', latitude: 28.6140, longitude: 77.2091 });
      const comp = h2.addSeller({ _id: 's-comp', latitude: 28.6200, longitude: 77.2200 });
      const ia = h2.addProduct(inc._id, { catalogKey: 'K-A' }).product;
      const ib = h2.addProduct(inc._id, { catalogKey: 'K-B' }).product;
      h2.addProduct(comp._id, { catalogKey: 'K-A' });
      h2.addProduct(comp._id, { catalogKey: 'K-B' });
      h2.addProduct(comp._id, { catalogKey: 'K-C' });
      const ic = h2.addProduct(comp._id, { catalogKey: 'K-C' }).product;

      const order2 = h2.addOrder({ items: [
        { sellerId: inc._id, productId: ia._id },
        { sellerId: inc._id, productId: ib._id },
        { sellerId: comp._id, productId: ic._id },
      ] });

      const fulfillment = await h2.engine.start(order2._id);

      // The incomplete seller — despite being nearer — must not be chosen.
      expect(String(fulfillment.resolvedSellerId)).toBe(String(comp._id));
      // And must hold no stock at all.
      expect(h2.stockOf(ia._id).reservedStock).toBe(0);
      expect(h2.stockOf(ib._id).reservedStock).toBe(0);
      h2.assertInventorySane();

      expect(order).toBeTruthy();
    });

    it('T-04: insufficient quantity on one line disqualifies the seller', async () => {
      const h = createHarness();
      const seller = h.addSeller();
      const a = h.addProduct(seller._id, { stock: 10 }).product;
      const b = h.addProduct(seller._id, { stock: 1 }).product;

      const order = h.addOrder({ items: [
        { sellerId: seller._id, productId: a._id, quantity: 1 },
        { sellerId: seller._id, productId: b._id, quantity: 5 },
      ] });

      const fulfillment = await h.engine.start(order._id);

      expect(fulfillment.state).not.toBe(STATE.SELLER_ASSIGNED);
      // Critically: no partial hold on the line that WAS available.
      expect(h.stockOf(a._id).reservedStock).toBe(0);
      h.assertInventorySane();
    });
  });

  describe('seller eligibility gates', () => {
    async function runWith(sellerOverrides) {
      const h = createHarness();
      const seller = h.addSeller(sellerOverrides);
      const { product } = h.addProduct(seller._id);
      const order = h.addOrder({ items: [{ sellerId: seller._id, productId: product._id }] });
      const fulfillment = await h.engine.start(order._id);
      return { h, fulfillment, product };
    }

    it('T-05: skips a seller that is not accepting orders', async () => {
      const { h, fulfillment, product } = await runWith({ isAcceptingOrders: false });
      expect(fulfillment.state).not.toBe(STATE.SELLER_ASSIGNED);
      expect(h.stockOf(product._id).reservedStock).toBe(0);
    });

    it('T-06: skips a seller outside the search radius', async () => {
      // Mumbai — far outside the default 10 km radius from Delhi.
      const { fulfillment } = await runWith({ latitude: 19.0760, longitude: 72.8777 });
      expect(fulfillment.state).not.toBe(STATE.SELLER_ASSIGNED);
    });

    it('skips a suspended seller', async () => {
      const { fulfillment } = await runWith({ status: 'suspended' });
      expect(fulfillment.state).not.toBe(STATE.SELLER_ASSIGNED);
    });

    it('skips a seller ineligible for the tab', async () => {
      const { fulfillment } = await runWith({ quickCommerceEligible: false });
      expect(fulfillment.state).not.toBe(STATE.SELLER_ASSIGNED);
    });
  });

  describe('seller acceptance', () => {
    async function offered() {
      const h = createHarness();
      const seller = h.addSeller();
      const { product } = h.addProduct(seller._id);
      const order = h.addOrder({ items: [{ sellerId: seller._id, productId: product._id }] });
      await h.engine.start(order._id);
      return { h, seller, product, order, attempt: h.currentOffer(order._id) };
    }

    it('accepting retains the reservation and advances the fulfillment', async () => {
      const { h, seller, product, order, attempt } = await offered();

      const result = await h.engine.handleSellerAccept({ attemptId: attempt._id, sellerId: seller._id });

      expect(result.ok).toBe(true);
      expect(h.fulfillmentFor(order._id).state).toBe(STATE.SELLER_ACCEPTED);
      // Stock stays held — the seller is going to fulfil it.
      expect(h.stockOf(product._id).reservedStock).toBe(1);

      const updatedOrder = h.db.orders.get(String(order._id));
      expect(updatedOrder.fulfillment.deliveryMode).toBe('quick');
      expect(String(updatedOrder.fulfillment.sellerId)).toBe(String(seller._id));
      expect(events.seen.map((e) => e.name)).toContain(FULFILLMENT_EVENTS.SELLER_ACCEPTED);
    });

    it('T-36: accepting twice is idempotent', async () => {
      const { h, seller, order, attempt } = await offered();

      const first = await h.engine.handleSellerAccept({ attemptId: attempt._id, sellerId: seller._id });
      const second = await h.engine.handleSellerAccept({ attemptId: attempt._id, sellerId: seller._id });

      expect(first.ok).toBe(true);
      expect(second.ok).toBe(true);
      expect(second.idempotent).toBe(true);
      expect(h.fulfillmentFor(order._id).state).toBe(STATE.SELLER_ACCEPTED);
    });

    it('T-29: a different seller cannot accept the offer', async () => {
      const { h, attempt } = await offered();
      const intruder = h.addSeller();

      const result = await h.engine.handleSellerAccept({ attemptId: attempt._id, sellerId: intruder._id });

      expect(result.ok).toBe(false);
      expect(result.code).toBe('FORBIDDEN');
    });

    it('records a dynamic ETA rather than a hardcoded promise', async () => {
      const { h, seller, order, attempt } = await offered();
      await h.engine.handleSellerAccept({ attemptId: attempt._id, sellerId: seller._id });

      const updated = h.db.orders.get(String(order._id));
      expect(updated.fulfillment.estimatedDeliveryMinutes).toEqual(expect.any(Number));
      expect(updated.fulfillment.estimatedDeliveryMinutes).toBeGreaterThan(0);
      expect(updated.fulfillment.estimatedDeliveryAt).toBeInstanceOf(Date);
    });
  });

  describe('seller rejection and reassignment', () => {
    it('T-07/T-09: rejection releases everything and the next seller succeeds', async () => {
      const h = createHarness({ platformSettings: { crossSellerSubstitutionEnabled: true } });
      const first = h.addSeller({ _id: 's-near', latitude: 28.6139, longitude: 77.2090 });
      const second = h.addSeller({ _id: 's-far', latitude: 28.6300, longitude: 77.2300 });

      const p1 = h.addProduct(first._id, { catalogKey: 'K1' }).product;
      const p2 = h.addProduct(second._id, { catalogKey: 'K1' }).product;

      const order = h.addOrder({ items: [{ sellerId: first._id, productId: p1._id }] });

      await h.engine.start(order._id);
      const offer = h.currentOffer(order._id);
      expect(String(offer.sellerId)).toBe(String(first._id));

      await h.engine.handleSellerReject({ attemptId: offer._id, sellerId: first._id, reason: 'out_of_stock' });

      const fulfillment = h.fulfillmentFor(order._id);
      expect(String(fulfillment.resolvedSellerId)).toBe(String(second._id));

      // First seller's stock fully returned; second seller now holds it.
      expect(h.stockOf(p1._id).reservedStock).toBe(0);
      expect(h.stockOf(p2._id).reservedStock).toBe(1);
      h.assertInventorySane();

      expect(events.seen.map((e) => e.name)).toContain(FULFILLMENT_EVENTS.SELLER_REJECTED);
    });

    it('T-08: acceptance timeout releases and re-searches', async () => {
      const h = createHarness({ platformSettings: { sellerAcceptanceTimeoutSeconds: 15 } });
      const seller = h.addSeller();
      const { product } = h.addProduct(seller._id);
      const order = h.addOrder({ items: [{ sellerId: seller._id, productId: product._id }] });

      await h.engine.start(order._id);
      const fulfillment = h.fulfillmentFor(order._id);

      // Simulate the deadline passing, then run the sweeper path.
      fulfillment.acceptanceDeadlineAt = new Date(Date.now() - 1000);
      await h.engine.handleAcceptanceTimeout(fulfillment);

      expect(h.stockOf(product._id).reservedStock).toBe(0);
      // Only one order exists — no duplication.
      expect(h.db.orders.size).toBe(1);
      expect(h.db.fulfillments.size).toBe(1);
      h.assertInventorySane();
    });

    it('T-37: accepting after the timeout already fired is refused', async () => {
      const h = createHarness();
      const seller = h.addSeller();
      const { product } = h.addProduct(seller._id);
      const order = h.addOrder({ items: [{ sellerId: seller._id, productId: product._id }] });

      await h.engine.start(order._id);
      const offer = h.currentOffer(order._id);

      const fulfillment = h.fulfillmentFor(order._id);
      fulfillment.acceptanceDeadlineAt = new Date(Date.now() - 1000);
      await h.engine.handleAcceptanceTimeout(fulfillment);

      const late = await h.engine.handleSellerAccept({ attemptId: offer._id, sellerId: seller._id });

      expect(late.ok).toBe(false);
      expect(late.code).toBe('EXPIRED');
      // No second reservation was created by the late accept.
      h.assertInventorySane();
    });

    it('stops after maxSellerAttempts and escalates', async () => {
      const h = createHarness({ platformSettings: {
        maxSellerAttemptsPerOrder: 1,
        crossSellerSubstitutionEnabled: true,
        warehouseFallbackEnabled: false,
        courierFallbackEnabled: false,
      } });

      const s1 = h.addSeller({ latitude: 28.6139, longitude: 77.2090 });
      const s2 = h.addSeller({ latitude: 28.6150, longitude: 77.2100 });
      const p1 = h.addProduct(s1._id, { catalogKey: 'K1' }).product;
      h.addProduct(s2._id, { catalogKey: 'K1' });

      const order = h.addOrder({ items: [{ sellerId: s1._id, productId: p1._id }] });
      await h.engine.start(order._id);

      const offer = h.currentOffer(order._id);
      await h.engine.handleSellerReject({ attemptId: offer._id, sellerId: offer.sellerId });

      const fulfillment = h.fulfillmentFor(order._id);
      expect(fulfillment.state).toBe(STATE.FAILED);
      // Everything released on the way to terminal failure.
      expect(h.totalReserved()).toBe(0);
    });
  });

  describe('warehouse fallback (level 2)', () => {
    it('T-11: warehouse fulfils when no local seller can', async () => {
      const h = createHarness({ platformSettings: { crossSellerSubstitutionEnabled: true } });
      const seller = h.addSeller({ latitude: 28.6139, longitude: 77.2090 });
      const warehouse = h.addSeller({ isWarehouse: true, latitude: 28.7000, longitude: 77.1000 });

      // Local seller is out of stock; warehouse has it.
      const local = h.addProduct(seller._id, { catalogKey: 'K1', stock: 0 }).product;
      const stocked = h.addProduct(warehouse._id, { catalogKey: 'K1', stock: 5 }).product;

      const order = h.addOrder({ items: [{ sellerId: seller._id, productId: local._id }] });
      const fulfillment = await h.engine.start(order._id);

      expect(fulfillment.state).toBe(STATE.WAREHOUSE_ACCEPTED);
      expect(h.stockOf(stocked._id).reservedStock).toBe(1);

      const updated = h.db.orders.get(String(order._id));
      expect(updated.fulfillment.type).toBe('warehouse');
      expect(updated.fulfillment.fallbackLevel).toBe(2);
      // Warehouse fulfilment is still quick delivery.
      expect(updated.fulfillment.deliveryMode).toBe('quick');
    });

    it('T-12: skips the warehouse when it cannot fulfil, and falls through', async () => {
      const h = createHarness();
      const seller = h.addSeller();
      const warehouse = h.addSeller({ isWarehouse: true });
      const p = h.addProduct(seller._id, { stock: 0 }).product;
      h.addProduct(warehouse._id, { stock: 0 });

      const order = h.addOrder({ items: [{ sellerId: seller._id, productId: p._id }] });
      const fulfillment = await h.engine.start(order._id);

      expect(fulfillment.state).toBe(STATE.COURIER_ASSIGNED);
    });

    it('skips the warehouse entirely when Admin disables that fallback', async () => {
      const h = createHarness({ platformSettings: { warehouseFallbackEnabled: false } });
      const seller = h.addSeller();
      const warehouse = h.addSeller({ isWarehouse: true });
      const p = h.addProduct(seller._id, { stock: 0 }).product;
      const whProduct = h.addProduct(warehouse._id, { stock: 50 }).product;

      const order = h.addOrder({ items: [{ sellerId: seller._id, productId: p._id }] });
      const fulfillment = await h.engine.start(order._id);

      expect(fulfillment.state).toBe(STATE.COURIER_ASSIGNED);
      expect(h.stockOf(whProduct._id).reservedStock).toBe(0);
    });
  });

  describe('courier fallback (level 3)', () => {
    it('T-13: falls back to courier and reports the REAL delivery mode', async () => {
      const h = createHarness();
      const seller = h.addSeller();
      const p = h.addProduct(seller._id, { stock: 0 }).product;
      const order = h.addOrder({ items: [{ sellerId: seller._id, productId: p._id }] });

      const fulfillment = await h.engine.start(order._id);

      expect(fulfillment.state).toBe(STATE.COURIER_ASSIGNED);
      expect(h.courierShipmentService.createForOrder).toHaveBeenCalled();

      const updated = h.db.orders.get(String(order._id));
      expect(updated.fulfillment.type).toBe('courier');
      expect(updated.fulfillment.deliveryMode).toBe('standard');
      expect(updated.fulfilmentType).toBe('courier');
      expect(updated.shipment).toEqual(expect.objectContaining({ awb: 'AWB-TEST-1' }));

      // No stale quick-commerce promise may survive the downgrade.
      expect(updated.fulfillment.estimatedDeliveryMinutes).toBeNull();
      expect(updated.deliveryPromiseMinutes).toBeNull();
      expect(updated.estimatedDeliveryAt).toBeNull();

      expect(events.seen.map((e) => e.name)).toContain(FULFILLMENT_EVENTS.COURIER_FALLBACK);
    });

    it('releases every local reservation before handing over to courier', async () => {
      const h = createHarness({ platformSettings: {
        crossSellerSubstitutionEnabled: true, maxSellerAttemptsPerOrder: 1,
      } });
      const seller = h.addSeller();
      const p = h.addProduct(seller._id, { stock: 5 }).product;
      const order = h.addOrder({ items: [{ sellerId: seller._id, productId: p._id }] });

      await h.engine.start(order._id);
      const offer = h.currentOffer(order._id);
      await h.engine.handleSellerReject({ attemptId: offer._id, sellerId: seller._id });

      expect(h.fulfillmentFor(order._id).state).toBe(STATE.COURIER_ASSIGNED);
      expect(h.totalReserved()).toBe(0);
      h.assertInventorySane();
    });

    it('T-26: courier API failure ends in a traceable terminal failure', async () => {
      const h = createHarness();
      h.courierShipmentService.createForOrder.mockRejectedValue(new Error('Shiprocket 503'));

      const seller = h.addSeller();
      const p = h.addProduct(seller._id, { stock: 0 }).product;
      const order = h.addOrder({ items: [{ sellerId: seller._id, productId: p._id }] });

      const fulfillment = await h.engine.start(order._id);

      expect(fulfillment.state).toBe(STATE.FAILED);
      expect(fulfillment.failureCode).toBe(FAIL.COURIER_UNAVAILABLE);
      expect(h.totalReserved()).toBe(0);

      const failure = events.seen.find((e) => e.name === FULFILLMENT_EVENTS.FAILED);
      expect(failure).toBeTruthy();
      expect(failure.payload.traceId).toEqual(expect.any(String));
    });

    it('fails terminally when both fallbacks are disabled', async () => {
      const h = createHarness({ platformSettings: {
        warehouseFallbackEnabled: false, courierFallbackEnabled: false,
      } });
      const seller = h.addSeller();
      const p = h.addProduct(seller._id, { stock: 0 }).product;
      const order = h.addOrder({ items: [{ sellerId: seller._id, productId: p._id }] });

      const fulfillment = await h.engine.start(order._id);

      expect(fulfillment.state).toBe(STATE.FAILED);
      expect(fulfillment.failureCode).toBe(FAIL.COURIER_DISABLED);
    });
  });

  describe('search timeout', () => {
    it('escalates once the configured discovery window elapses', async () => {
      const h = createHarness();
      const seller = h.addSeller();
      const { product } = h.addProduct(seller._id);
      const order = h.addOrder({ items: [{ sellerId: seller._id, productId: product._id }] });

      const { fulfillment } = await h.repos.orderFulfillmentRepository.createIfAbsent({
        orderId: order._id,
        marketplaceTab: 'quick_shop',
        state: STATE.SEARCHING,
        requiredItems: [{
          catalogKey: null, productId: product._id, originSellerId: seller._id, quantity: 1, unitPrice: 100,
        }],
        customerLocation: { lat: 28.6139, lng: 77.2090, pincode: '110001' },
        searchDeadlineAt: new Date(Date.now() - 1000), // already expired
        traceId: 'trace-timeout',
      });

      const result = await h.engine.attemptNext(fulfillment._id);

      expect(result.state).toBe(STATE.COURIER_ASSIGNED);
      // The eligible seller was never even offered, because the budget was spent.
      expect(h.stockOf(product._id).reservedStock).toBe(0);
    });
  });

  describe('traceability', () => {
    it('records an attempt row per candidate with its failure code', async () => {
      const h = createHarness();
      const offline = h.addSeller({ isAcceptingOrders: false });
      h.addProduct(offline._id);

      const good = h.addSeller();
      const { product } = h.addProduct(good._id);

      const order = h.addOrder({ items: [{ sellerId: good._id, productId: product._id }] });
      await h.engine.start(order._id);

      const attempts = h.attemptsFor(order._id);
      expect(attempts.length).toBeGreaterThanOrEqual(2);
      expect(attempts.some((a) => a.failureCode === FAIL.SELLER_NOT_ACCEPTING)).toBe(true);
      expect(attempts.some((a) => a.status === 'offered' && a.rankScore != null)).toBe(true);
    });

    it('carries one traceId across the whole fulfillment', async () => {
      const h = createHarness();
      const seller = h.addSeller();
      const { product } = h.addProduct(seller._id);
      const order = h.addOrder({ items: [{ sellerId: seller._id, productId: product._id }] });

      const fulfillment = await h.engine.start(order._id);
      expect(fulfillment.traceId).toEqual(expect.any(String));

      const assigned = events.seen.find((e) => e.name === FULFILLMENT_EVENTS.SELLER_ASSIGNED);
      expect(assigned.payload.traceId).toBe(fulfillment.traceId);
    });

    it('T-28: freezes a config snapshot on the fulfillment', async () => {
      const h = createHarness({ platformSettings: { deliveryBufferMinutes: 9 } });
      const seller = h.addSeller();
      const { product } = h.addProduct(seller._id);
      const order = h.addOrder({ items: [{ sellerId: seller._id, productId: product._id }] });

      const fulfillment = await h.engine.start(order._id);

      expect(fulfillment.configSnapshot.deliveryBufferMinutes).toBe(9);
      expect(fulfillment.configSnapshot.resolvedAt).toEqual(expect.any(String));
    });
  });

  describe('server authority', () => {
    it('T-33: builds required items from persisted order items only', async () => {
      const h = createHarness();
      const seller = h.addSeller();
      const { product } = h.addProduct(seller._id, { price: 500 });

      // The stored order item claims a bargain price; the listing says 500.
      const order = h.addOrder({ items: [
        { sellerId: seller._id, productId: product._id, quantity: 1, unitPrice: 1 },
      ] });

      await h.engine.start(order._id);
      const offer = h.currentOffer(order._id);

      expect(offer).toBeTruthy();
      // Reservation is driven by the listing, not the claimed price.
      expect(h.stockOf(product._id).reservedStock).toBe(1);
    });

    it('does nothing for a missing order', async () => {
      const h = createHarness();
      expect(await h.engine.start('nope')).toBeNull();
    });

    it('does nothing for an order with no items', async () => {
      const h = createHarness();
      const order = h.addOrder({ items: [] });
      expect(await h.engine.start(order._id)).toBeNull();
    });
  });

  /**
   * T-18 — the MANDATORY concurrency scenario, exercised end-to-end through the
   * engine rather than only at the reservation service.
   */
  describe('T-18: concurrent orders on the last unit (MANDATORY)', () => {
    it('only one order can hold A+B+C when the seller has one of each', async () => {
      const h = createHarness();
      const seller = h.addSeller();
      const a = h.addProduct(seller._id, { stock: 1 }).product;
      const b = h.addProduct(seller._id, { stock: 1 }).product;
      const c = h.addProduct(seller._id, { stock: 1 }).product;

      const mk = () => h.addOrder({ items: [
        { sellerId: seller._id, productId: a._id },
        { sellerId: seller._id, productId: b._id },
        { sellerId: seller._id, productId: c._id },
      ] });

      const o1 = mk();
      const o2 = mk();

      const [f1, f2] = await Promise.all([h.engine.start(o1._id), h.engine.start(o2._id)]);

      const assigned = [f1, f2].filter((f) => f && f.state === STATE.SELLER_ASSIGNED);
      expect(assigned).toHaveLength(1);

      // Exactly one unit of each is held, and nothing is oversold.
      for (const p of [a, b, c]) expect(h.stockOf(p._id).reservedStock).toBe(1);
      h.assertInventorySane();

      // The loser fell through the ladder rather than corrupting state.
      const loser = [f1, f2].find((f) => f && f.state !== STATE.SELLER_ASSIGNED);
      expect([STATE.COURIER_ASSIGNED, STATE.FAILED, STATE.WAREHOUSE_PENDING]).toContain(loser.state);
    });

    it('five concurrent orders against two units oversell nothing', async () => {
      const h = createHarness();
      const seller = h.addSeller();
      const p = h.addProduct(seller._id, { stock: 2 }).product;

      const orders = Array.from({ length: 5 }, () =>
        h.addOrder({ items: [{ sellerId: seller._id, productId: p._id }] }));

      const results = await Promise.all(orders.map((o) => h.engine.start(o._id)));

      const assigned = results.filter((f) => f && f.state === STATE.SELLER_ASSIGNED);
      expect(assigned).toHaveLength(2);
      expect(h.stockOf(p._id).reservedStock).toBe(2);
      h.assertInventorySane();
    });
  });
});
