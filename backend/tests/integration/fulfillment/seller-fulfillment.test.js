const { createHarness } = require('../../helpers/fulfillmentHarness');
const { SellerFulfillmentService } = require('../../../src/services/seller/SellerFulfillmentService');
const { FULFILLMENT_STATE: STATE } = require('../../../src/constants/fulfillment');

/** Builds a harness with an order already offered to a seller. */
async function offeredScenario({ platformSettings } = {}) {
  const h = createHarness({ platformSettings });
  const seller = h.addSeller();
  const { product } = h.addProduct(seller._id);
  const order = h.addOrder({ items: [{ sellerId: seller._id, productId: product._id }] });

  await h.engine.start(order._id);

  const service = new SellerFulfillmentService({
    orderRepository: h.repos.orderRepository,
    fulfillmentAttemptRepository: h.repos.fulfillmentAttemptRepository,
    fulfillmentEngineService: h.engine,
  });

  return { h, seller, product, order, service, offer: h.currentOffer(order._id) };
}

describe('CR-002 SellerFulfillmentService', () => {
  describe('listOffers', () => {
    it('lists a live offer for the seller it was addressed to', async () => {
      const { service, seller, order } = await offeredScenario();

      const result = await service.listOffers(seller._id);

      expect(result.items).toHaveLength(1);
      expect(result.items[0].orderId).toBe(String(order._id));
      expect(result.items[0].secondsRemaining).toBeGreaterThan(0);
      expect(result.items[0].estimatedDeliveryMinutes).toEqual(expect.any(Number));
    });

    it('does not leak offers to a different seller', async () => {
      const { h, service } = await offeredScenario();
      const other = h.addSeller();

      expect((await service.listOffers(other._id)).items).toHaveLength(0);
    });

    it('never exposes rank scores or competing candidates', async () => {
      const { service, seller } = await offeredScenario();

      const [offer] = (await service.listOffers(seller._id)).items;

      expect(offer.rankScore).toBeUndefined();
      expect(offer.rankBreakdown).toBeUndefined();
      expect(offer.reservations).toBeUndefined();
      // Customer contact details are not needed to decide on an offer.
      expect(JSON.stringify(offer)).not.toContain('phone');
    });

    it('hides an offer whose deadline has already passed', async () => {
      const { h, service, seller, order } = await offeredScenario();

      const attempt = h.currentOffer(order._id);
      attempt.expiresAt = new Date(Date.now() - 1000);

      expect((await service.listOffers(seller._id)).items).toHaveLength(0);
    });

    it('rejects an unauthenticated caller', async () => {
      const { service } = await offeredScenario();
      await expect(service.listOffers(null)).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
    });
  });

  describe('acceptOffer', () => {
    it('accepts and retains the reservation', async () => {
      const { h, service, seller, order, offer, product } = await offeredScenario();

      const result = await service.acceptOffer({
        sellerId: seller._id, orderId: order._id, attemptId: offer._id,
      });

      expect(result.accepted).toBe(true);
      expect(h.fulfillmentFor(order._id).state).toBe(STATE.SELLER_ACCEPTED);
      expect(h.stockOf(product._id).reservedStock).toBe(1);
    });

    it('T-36: is idempotent on a repeated accept', async () => {
      const { service, seller, order, offer } = await offeredScenario();

      await service.acceptOffer({ sellerId: seller._id, orderId: order._id, attemptId: offer._id });
      const second = await service.acceptOffer({
        sellerId: seller._id, orderId: order._id, attemptId: offer._id,
      });

      expect(second.accepted).toBe(true);
      expect(second.idempotent).toBe(true);
    });

    it('T-29: refuses a seller the offer was not addressed to', async () => {
      const { h, service, order, offer } = await offeredScenario();
      const intruder = h.addSeller();

      await expect(service.acceptOffer({
        sellerId: intruder._id, orderId: order._id, attemptId: offer._id,
      })).rejects.toMatchObject({ code: 'FORBIDDEN' });
    });

    it('refuses an attemptId belonging to a different order', async () => {
      const { h, service, seller, offer } = await offeredScenario();
      const otherOrder = h.addOrder({ items: [] });

      await expect(service.acceptOffer({
        sellerId: seller._id, orderId: otherOrder._id, attemptId: offer._id,
      })).rejects.toMatchObject({ code: 'VALIDATION_ERROR' });
    });

    it('reports a missing offer as not found', async () => {
      const { service, seller, order } = await offeredScenario();

      await expect(service.acceptOffer({
        sellerId: seller._id, orderId: order._id, attemptId: 'does-not-exist',
      })).rejects.toMatchObject({ code: 'NOT_FOUND' });
    });

    it('T-37: refuses an accept after the offer already timed out', async () => {
      const { h, service, seller, order, offer, product } = await offeredScenario();

      const fulfillment = h.fulfillmentFor(order._id);
      fulfillment.acceptanceDeadlineAt = new Date(Date.now() - 1000);
      await h.engine.handleAcceptanceTimeout(fulfillment);

      await expect(service.acceptOffer({
        sellerId: seller._id, orderId: order._id, attemptId: offer._id,
      })).rejects.toMatchObject({ code: 'FULFILLMENT_OFFER_EXPIRED' });

      // The timeout already released the stock; the late accept must not re-take it.
      expect(h.stockOf(product._id).reservedStock).toBe(0);
    });

    it('reports service unavailable when the engine is not wired', async () => {
      const { seller, order, offer, h } = await offeredScenario();
      const service = new SellerFulfillmentService({
        orderRepository: h.repos.orderRepository,
        fulfillmentAttemptRepository: h.repos.fulfillmentAttemptRepository,
        fulfillmentEngineService: null,
      });

      await expect(service.acceptOffer({
        sellerId: seller._id, orderId: order._id, attemptId: offer._id,
      })).rejects.toMatchObject({ code: 'SERVICE_UNAVAILABLE' });
    });
  });

  describe('rejectOffer', () => {
    it('T-07: releases the reservation and moves on', async () => {
      const { h, service, seller, order, offer, product } = await offeredScenario();

      const result = await service.rejectOffer({
        sellerId: seller._id, orderId: order._id, attemptId: offer._id, reason: 'out_of_stock',
      });

      expect(result.rejected).toBe(true);
      expect(h.stockOf(product._id).reservedStock).toBe(0);
      h.assertInventorySane();
    });

    it('does not reveal which seller is tried next', async () => {
      const { service, seller, order, offer } = await offeredScenario();

      const result = await service.rejectOffer({
        sellerId: seller._id, orderId: order._id, attemptId: offer._id,
      });

      expect(Object.keys(result).sort()).toEqual(['orderId', 'rejected']);
    });

    it('is idempotent on a repeated reject', async () => {
      const { service, seller, order, offer } = await offeredScenario();

      await service.rejectOffer({ sellerId: seller._id, orderId: order._id, attemptId: offer._id });
      const second = await service.rejectOffer({
        sellerId: seller._id, orderId: order._id, attemptId: offer._id,
      });

      expect(second.rejected).toBe(true);
      expect(second.idempotent).toBe(true);
    });

    it('T-29: refuses a seller the offer was not addressed to', async () => {
      const { h, service, order, offer } = await offeredScenario();
      const intruder = h.addSeller();

      await expect(service.rejectOffer({
        sellerId: intruder._id, orderId: order._id, attemptId: offer._id,
      })).rejects.toMatchObject({ code: 'FORBIDDEN' });
    });
  });
});
