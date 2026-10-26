const { createHarness } = require('../../helpers/fulfillmentHarness');
const { SellerFulfillmentService } = require('../../../src/services/seller/SellerFulfillmentService');

/**
 * REGRESSION — CR-002 Phase 7 (seller offer popup content).
 *
 * The offer payload previously carried only `itemCount`, so the incoming-order
 * popup could say "3 items" and nothing else. A seller cannot make an
 * accept/reject decision inside a 60-second window without knowing WHAT they
 * are being asked to pack.
 *
 * These tests lock in both halves of the contract: enough detail to decide, and
 * nothing the seller is not authorised to see (customer identity, phone, exact
 * address, ranking internals, competing candidates).
 */
async function offeredScenario() {
  const h = createHarness();
  const seller = h.addSeller();
  const a = h.addProduct(seller._id, { title: 'Amul Butter 500g' }).product;
  const b = h.addProduct(seller._id, { title: 'Tata Salt 1kg' }).product;

  const order = h.addOrder({
    items: [
      { sellerId: seller._id, productId: a._id, quantity: 2 },
      { sellerId: seller._id, productId: b._id, quantity: 3 },
    ],
  });

  await h.engine.start(order._id);

  const service = new SellerFulfillmentService({
    orderRepository: h.repos.orderRepository,
    fulfillmentAttemptRepository: h.repos.fulfillmentAttemptRepository,
    fulfillmentEngineService: h.engine,
    productRepository: h.repos.productRepository,
  });

  return { h, seller, order, service, a, b };
}

describe('CR-002 seller offer payload', () => {
  it('lists every line the seller must pack, with quantities', async () => {
    const { service, seller } = await offeredScenario();

    const [offer] = (await service.listOffers(seller._id)).items;

    expect(offer.items).toHaveLength(2);
    expect(offer.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ title: 'Amul Butter 500g', quantity: 2 }),
        expect.objectContaining({ title: 'Tata Salt 1kg', quantity: 3 }),
      ])
    );
  });

  it('reports both line count and total units', async () => {
    const { service, seller } = await offeredScenario();
    const [offer] = (await service.listOffers(seller._id)).items;

    expect(offer.itemCount).toBe(2);
    // 2 + 3 — the number that actually determines packing effort.
    expect(offer.totalUnits).toBe(5);
  });

  it('exposes order value and payment method so the seller can judge the job', async () => {
    const { service, seller } = await offeredScenario();
    const [offer] = (await service.listOffers(seller._id)).items;

    expect(offer).toHaveProperty('orderValue');
    expect(offer).toHaveProperty('paymentMethod');
  });

  it('exposes the delivery AREA but never the exact customer address', async () => {
    const { service, seller } = await offeredScenario();
    const [offer] = (await service.listOffers(seller._id)).items;

    // Area only: exactly these two fields, whatever the address happens to hold.
    expect(Object.keys(offer.deliveryArea).sort()).toEqual(['city', 'pincode']);

    const serialised = JSON.stringify(offer);
    expect(serialised).not.toContain('line1');
    expect(serialised).not.toContain('phone');
    expect(serialised).not.toContain('addressId');
  });

  it('still leaks no ranking internals now that the payload is richer', async () => {
    const { service, seller } = await offeredScenario();
    const [offer] = (await service.listOffers(seller._id)).items;

    expect(offer.rankScore).toBeUndefined();
    expect(offer.rankBreakdown).toBeUndefined();
    expect(offer.reservations).toBeUndefined();
  });

  it('degrades to a usable offer when product titles cannot be resolved', async () => {
    const { h, seller, order } = await offeredScenario();

    // Product repository unavailable — the offer must still be answerable.
    const service = new SellerFulfillmentService({
      orderRepository: h.repos.orderRepository,
      fulfillmentAttemptRepository: h.repos.fulfillmentAttemptRepository,
      fulfillmentEngineService: h.engine,
      productRepository: null,
    });

    const [offer] = (await service.listOffers(seller._id)).items;

    expect(offer.orderId).toBe(String(order._id));
    expect(offer.itemCount).toBe(2);
    expect(offer.items.every((i) => i.title === 'Product')).toBe(true);
  });
});
