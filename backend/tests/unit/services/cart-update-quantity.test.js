/**
 * Production bug fix — CartService.updateItemQuantity threw ReferenceError.
 *
 * The method read `tab` when persisting cart state, but never declared it.
 * Every attempt to change an item's quantity therefore crashed before the
 * cart was written. Caught by eslint `no-undef` and confirmed present at HEAD.
 */
const { CartService } = require('../../../src/services/cart/CartService');

function buildService({ stock = 10, existingItem = true } = {}) {
  const store = new Map();

  const state = {
    commerceFlow: 'quick_shop',
    marketplaceTab: 'quick_shop',
    items: existingItem ? [{
      itemKey: 'prod-1:', productId: 'prod-1', variantId: null,
      quantity: 1, unitPrice: 100, sellerId: 'seller-1',
    }] : [],
  };

  const redis = {
    get: jest.fn(async (k) => store.get(k) ?? JSON.stringify(state)),
    set: jest.fn(async (k, v) => { store.set(k, v); }),
    del: jest.fn(async (k) => { store.delete(k); }),
  };

  const productRepository = {
    findPublicById: jest.fn(async (id) => ({
      _id: id, sellerId: 'seller-1', price: 100, stock, reservedStock: 0,
    })),
    getAvailableStock: jest.fn((p) => Math.max(0, (p?.stock || 0) - (p?.reservedStock || 0))),
  };

  const service = new CartService({
    redisClient: redis,
    productRepository,
    pricingService: {
      calculateTotals: jest.fn(async () => ({
        subtotal: 100, discount: 0, couponDiscount: 0, tax: 0, deliveryCharge: 0, total: 100,
      })),
    },
    marketplaceListingService: null,
  });

  return { service, redis, productRepository };
}

describe('CartService.updateItemQuantity (production bug fix)', () => {
  it('updates the quantity without throwing ReferenceError', async () => {
    const { service } = buildService();

    // Before the fix this threw: ReferenceError: tab is not defined
    await expect(service.updateItemQuantity({
      userId: 'user-1', sessionId: null, commerceFlow: 'quick_shop',
      productId: 'prod-1', quantity: 3,
    })).resolves.toBeTruthy();
  });

  it('persists the new quantity', async () => {
    const { service, redis } = buildService();

    await service.updateItemQuantity({
      userId: 'user-1', sessionId: null, commerceFlow: 'quick_shop',
      productId: 'prod-1', quantity: 4,
    });

    const written = JSON.parse(redis.set.mock.calls.at(-1)[1]);
    expect(written.items[0].quantity).toBe(4);
  });

  it('keeps the marketplace tab on the cart state', async () => {
    const { service, redis } = buildService();

    await service.updateItemQuantity({
      userId: 'user-1', sessionId: null, commerceFlow: 'quick_shop',
      productId: 'prod-1', quantity: 2,
    });

    const written = JSON.parse(redis.set.mock.calls.at(-1)[1]);
    expect(written.marketplaceTab).toBe('quick_shop');
  });

  it('works for a standard-flow cart too', async () => {
    const { service } = buildService();

    await expect(service.updateItemQuantity({
      userId: 'user-1', sessionId: null, commerceFlow: 'standard',
      productId: 'prod-1', quantity: 2,
    })).resolves.toBeTruthy();
  });

  it('still rejects a quantity beyond available stock', async () => {
    const { service } = buildService({ stock: 2 });

    await expect(service.updateItemQuantity({
      userId: 'user-1', sessionId: null, commerceFlow: 'quick_shop',
      productId: 'prod-1', quantity: 99,
    })).rejects.toBeTruthy();
  });

  it('still rejects an item that is not in the cart', async () => {
    const { service } = buildService({ existingItem: false });

    await expect(service.updateItemQuantity({
      userId: 'user-1', sessionId: null, commerceFlow: 'quick_shop',
      productId: 'prod-1', quantity: 2,
    })).rejects.toMatchObject({ code: 'NOT_FOUND' });
  });
});
