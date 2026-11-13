/**
 * Quick vs standard order-flow consistency.
 *
 * Regressions covered:
 *  - cart +/− and Remove sent the line's itemKey ("listing:<id>") and matched
 *    nothing, and an emptied cart stayed locked to its old tab;
 *  - the fulfilment engine required (and reserved) units the confirmed order
 *    had already deducted — double-held stock, last unit pushed to courier;
 *  - Quick Shop listed sellers fulfilment would never offer the order to.
 */
const { CartService } = require('../../../src/services/cart/CartService');
const { SellerEligibilityService } = require('../../../src/services/fulfillment/SellerEligibilityService');
const { FulfillmentReservationService } = require('../../../src/services/fulfillment/FulfillmentReservationService');
const { QuickServiceAreaService } = require('../../../src/services/fulfillment/QuickServiceAreaService');
const { MemoryRedisClient } = require('../../../src/core/redis/MemoryRedisClient');

describe('CartService line addressing', () => {
  const product = { _id: 'p1', title: 'Chips', price: 20, mrp: 25, sellerId: 's1', stock: 10, reservedStock: 0 };
  const listings = {
    lq: { _id: 'lq', productId: 'p1', marketplaceTab: 'quick_shop', price: 20, mrp: 25, deliveryPromiseMinutes: 15 },
    ls: { _id: 'ls', productId: 'p1', marketplaceTab: 'mithilakart', price: 22, mrp: 25, deliveryPromiseMinutes: null },
  };
  const setup = () => new CartService({
    redisClient: new MemoryRedisClient(),
    productRepository: {
      findPublicById: jest.fn(async () => product),
      getAvailableStock: (p) => p.stock - p.reservedStock,
    },
    pricingService: { calculateTotals: jest.fn(async () => ({ subtotal: 0, total: 0 })) },
    marketplaceListingService: {
      resolveListingForCart: jest.fn(async (id) => ({ listing: listings[id], product })),
    },
  });
  const ctx = { userId: 'u1', sessionId: null };

  it('updates and removes a listing line by the itemKey the cart returns', async () => {
    const cart = setup();
    const added = await cart.addItem({ ...ctx, listingId: 'lq', marketplaceTab: 'quick_shop', quantity: 1 });
    const { itemKey } = added.items[0];
    expect(itemKey).toBe('listing:lq');

    const updated = await cart.updateItemQuantity({ ...ctx, itemId: itemKey, quantity: 3, marketplaceTab: 'quick_shop' });
    expect(updated.items[0].quantity).toBe(3);

    const removed = await cart.removeItem({ ...ctx, itemId: itemKey, marketplaceTab: 'quick_shop' });
    expect(removed.items).toHaveLength(0);
  });

  it('keeps one independent cart per tab — adding in one tab never blocks or touches another', async () => {
    const cart = setup();
    await cart.addItem({ ...ctx, listingId: 'lq', marketplaceTab: 'quick_shop', quantity: 2 });
    const mk = await cart.addItem({ ...ctx, listingId: 'ls', marketplaceTab: 'mithilakart', quantity: 1 });
    expect(mk.marketplaceTab).toBe('mithilakart');
    expect(mk.items.map((i) => i.itemKey)).toEqual(['listing:ls']);

    const qs = await cart.getCart({ ...ctx, marketplaceTab: 'quick_shop' });
    expect(qs.items.map((i) => [i.itemKey, i.quantity])).toEqual([['listing:lq', 2]]);

    // quantity / remove / clear in one tab leave the other intact
    await cart.updateItemQuantity({ ...ctx, itemId: 'listing:lq', quantity: 5, marketplaceTab: 'quick_shop' });
    expect((await cart.getCart({ ...ctx, marketplaceTab: 'mithilakart' })).items[0].quantity).toBe(1);
    await cart.clearCart({ ...ctx, marketplaceTab: 'quick_shop' });
    expect((await cart.getCart({ ...ctx, marketplaceTab: 'quick_shop' })).items).toHaveLength(0);
    expect((await cart.getCart({ ...ctx, marketplaceTab: 'mithilakart' })).items).toHaveLength(1);
  });

  it('rejects an unknown tab, and a listing from another tab than the one asked for', async () => {
    const cart = setup();
    await expect(cart.getCart({ ...ctx, marketplaceTab: 'bogus' })).rejects.toThrow(/Invalid marketplace tab/);
    await expect(cart.addItem({ ...ctx, listingId: 'lq', marketplaceTab: 'mithilakart', quantity: 1 }))
      .rejects.toThrow(/does not belong/);
  });

  it('migrates a legacy single-key cart into its own tab and leaves tab-less lines alone', async () => {
    const redis = new MemoryRedisClient();
    const cart = new CartService({
      redisClient: redis,
      productRepository: { findPublicById: jest.fn(async () => product), getAvailableStock: () => 10 },
      pricingService: { calculateTotals: jest.fn(async () => ({ subtotal: 0, total: 0 })) },
      marketplaceListingService: { resolveListingForCart: jest.fn(async (id) => ({ listing: listings[id], product })) },
    });
    await redis.set('cart:customer:u1', JSON.stringify({
      marketplaceTab: 'quick_shop',
      items: [{ itemKey: 'p1:', productId: 'p1', quantity: 2, unitPrice: 20 }],
    }), 'EX', 1000);
    await redis.set('cart:customer:u2', JSON.stringify({
      items: [{ itemKey: 'p1:', productId: 'p1', quantity: 1, unitPrice: 20 }],
    }), 'EX', 1000);

    const qs = await cart.getCart({ userId: 'u1', marketplaceTab: 'quick_shop' });
    expect(qs.items).toHaveLength(1);
    expect(await redis.get('cart:customer:u1')).toBeNull();
    expect((await cart.getCart({ userId: 'u1', marketplaceTab: 'mithilakart' })).items).toHaveLength(0);

    // ambiguous (no tab recorded): not guessed into any tab, not deleted
    expect((await cart.getCart({ userId: 'u2', marketplaceTab: 'mithilakart' })).items).toHaveLength(0);
    expect(await redis.get('cart:customer:u2')).not.toBeNull();
  });
});

describe('fulfilment stock is held once', () => {
  const eligibility = new SellerEligibilityService({});
  const seller = { _id: 's1' };
  const indexes = (product) => ({
    productIndex: new Map([[String(product._id), product]]),
    listingIndex: new Map([[`${product._id}::quick_shop`, { _id: 'l1', price: 20 }]]),
  });

  it('a confirmed order may take its own last unit (already deducted)', () => {
    const product = { _id: 'p1', stock: 0, reservedStock: 0 };
    const result = eligibility.checkCompleteCart({
      seller,
      requiredItems: [{ productId: 'p1', originSellerId: 's1', quantity: 1, deductedWithOrder: true }],
      marketplaceTab: 'quick_shop',
      config: {},
      ...indexes(product),
    });
    expect(result.ok).toBe(true);
    expect(result.resolvedItems[0]).toMatchObject({ heldByOrder: true, originProductId: null });
  });

  it('an order that was not deducted still needs free stock', () => {
    const product = { _id: 'p1', stock: 0, reservedStock: 0 };
    const result = eligibility.checkCompleteCart({
      seller,
      requiredItems: [{ productId: 'p1', originSellerId: 's1', quantity: 1 }],
      marketplaceTab: 'quick_shop',
      config: {},
      ...indexes(product),
    });
    expect(result.ok).toBe(false);
  });

  it('records held lines without touching stock, and settles a substitute onto its own shelf', async () => {
    const productRepository = {
      reserveStock: jest.fn(async () => ({})),
      releaseReservedStock: jest.fn(async () => ({})),
      decrementStock: jest.fn(async () => ({})),
      incrementStock: jest.fn(async () => ({})),
    };
    const attemptRepo = { updateById: jest.fn(async () => ({})), markReservationsReleased: jest.fn() };
    const service = new FulfillmentReservationService({ productRepository, fulfillmentAttemptRepository: attemptRepo });

    const result = await service.reserveCompleteCart({
      attempt: { _id: 'a1' },
      resolvedItems: [
        { productId: 'own', quantity: 2, heldByOrder: true },
        { productId: 'sub', quantity: 1, originProductId: 'orig' },
      ],
    });
    expect(result.ok).toBe(true);
    expect(productRepository.reserveStock).toHaveBeenCalledTimes(1);
    expect(productRepository.reserveStock).toHaveBeenCalledWith('sub', 1, null);

    await service.releaseAttempt({ _id: 'a1', reservations: [{ productId: 'own', quantity: 2, heldByOrder: true, releasedAt: null }] });
    expect(productRepository.releaseReservedStock).not.toHaveBeenCalled();

    await service.settleAttempt({ _id: 'a1', reservations: result.reserved });
    expect(productRepository.decrementStock).toHaveBeenCalledWith('sub', 1);
    expect(productRepository.incrementStock).toHaveBeenCalledWith('orig', 1);
  });
});

describe('QuickServiceAreaService', () => {
  const near = { _id: 'near', kycStatus: 'approved', status: 'active', quickCommerceEligible: true, latitude: 25.6, longitude: 85.13 };
  const far = { ...near, _id: 'far', latitude: 25.63, longitude: 84.97 };
  const notEnabled = { ...near, _id: 'off', quickCommerceEligible: false };
  const service = new QuickServiceAreaService({
    sellerEligibilityService: new SellerEligibilityService({}),
    fulfillmentConfigService: { resolve: jest.fn(async () => ({ sellerSearchRadiusKm: 10 })) },
    sellerRepository: { find: jest.fn(async ({ _id }) => [near, far, notEnabled].filter((s) => _id.$in.includes(s._id))) },
    productRepository: { find: jest.fn(async () => []) },
  });

  it('shows only sellers the engine would offer the order to', async () => {
    const serving = await service.filterServingSellers([
      { ...near, distanceKm: 2 }, { ...far, distanceKm: 15 }, { ...notEnabled, distanceKm: 1 },
    ], 'quick_shop');
    expect(serving.map((s) => s._id)).toEqual(['near']);
  });

  it('refuses quick checkout to an address out of range', async () => {
    const delhi = { lat: 28.61, lng: 77.2 };
    await expect(service.assertDeliverable({
      items: [{ sellerId: 'near', productId: 'p1', title: 'Chips' }], location: delhi, marketplaceTab: 'quick_shop',
    })).rejects.toThrow(/Chips can't be delivered quickly/);

    await expect(service.assertDeliverable({
      items: [{ sellerId: 'near', productId: 'p1' }], location: { lat: 25.6127, lng: 85.118 }, marketplaceTab: 'quick_shop',
    })).resolves.toBeUndefined();
  });
});
