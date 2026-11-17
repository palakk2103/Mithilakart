const mongoose = require('mongoose');
const { CartService } = require('../../../src/services/cart/CartService');
const { PackageService } = require('../../../src/services/catalog/PackageService');
const { CartController } = require('../../../src/controllers/cart/CartController');
const { AppError } = require('../../../src/utils/AppError');
const { MemoryRedisClient } = require('../../../src/core/redis/MemoryRedisClient');

const oid = () => String(new mongoose.Types.ObjectId());

function build({ limits = {}, loginRequired = true } = {}) {
  const sellerId = oid();
  const productId = oid();
  const listingId = oid();
  const product = { _id: productId, sellerId, title: 'Raw Pumpkin', price: 40, mrp: 50, stock: 100, images: [{ url: 'x.jpg' }] };
  const listing = { _id: listingId, productId, marketplaceTab: 'mithilak', price: 40, mrp: 50, maxOrderQuantity: null, deliveryPromiseMinutes: null };

  const productRepository = {
    findPublicById: jest.fn(async (id) => (String(id) === productId ? product : null)),
    getAvailableStock: jest.fn((p) => p.stock),
  };

  // resolveListingForCart mirrors the real one: a stale id that is neither a listing nor a product -> 404.
  const marketplaceListingService = {
    resolveListingForCart: jest.fn(async (id) => {
      if (String(id) === listingId || String(id) === productId) return { listing, product };
      throw AppError.notFound('Listing not found or not available');
    }),
  };

  const config = {
    maxQuantityPerItem: 3, maxCartItems: 2, limitedQuantityMessage: 'Limited quantity due to high demand', loginRequired, ...limits,
  };
  const platformConfigService = {
    getConfig: async () => config,
    getPurchaseLimits: async () => ({
      maxQuantityPerItem: config.maxQuantityPerItem, maxCartItems: config.maxCartItems, message: config.limitedQuantityMessage,
    }),
  };
  const pricingService = {
    platformConfigService,
    calculateTotals: jest.fn(async ({ items }) => ({ subtotal: items.reduce((s, i) => s + i.unitPrice * i.quantity, 0), total: 0 })),
  };

  const cart = new CartService({
    redisClient: new MemoryRedisClient(), productRepository, pricingService, marketplaceListingService,
  });
  return { cart, product, listing, productId, listingId, marketplaceListingService };
}

const owner = { userId: oid(), sessionId: null };
// asyncHandler does not return its promise, so let the pending work settle before asserting.
const settle = () => new Promise((resolve) => setImmediate(resolve));

describe('cart purchase limits', () => {
  it('lets a customer add up to the limit and refuses the next unit with the admin message', async () => {
    const { cart, productId } = build();
    await cart.addItem({ ...owner, marketplaceTab: 'mithilak', productId, quantity: 3 });
    await expect(cart.addItem({ ...owner, marketplaceTab: 'mithilak', productId, quantity: 1 })).rejects.toMatchObject({
      message: expect.stringContaining('Limited quantity due to high demand'),
    });
  });

  it('exposes the effective maximum on each cart line so the + button can stop', async () => {
    const { cart, productId } = build();
    const result = await cart.addItem({ ...owner, marketplaceTab: 'mithilak', productId, quantity: 1 });
    expect(result.items[0].maxQuantity).toBe(3);
    expect(result.limits.maxQuantityPerItem).toBe(3);
  });

  it('a listing\'s own maxOrderQuantity can only tighten the admin limit', async () => {
    const { cart, listing, productId } = build();
    listing.maxOrderQuantity = 2;
    await expect(cart.addItem({ ...owner, marketplaceTab: 'mithilak', productId, quantity: 3 })).rejects.toThrow(/up to 2/);
  });

  it('blocks the update endpoint too, not just add', async () => {
    const { cart, productId } = build();
    const added = await cart.addItem({ ...owner, marketplaceTab: 'mithilak', productId, quantity: 1 });
    await expect(cart.updateItemQuantity({ ...owner, marketplaceTab: 'mithilak', itemId: added.items[0].itemKey, quantity: 4 }))
      .rejects.toThrow(/Limited quantity/);
  });

  it('0 means unlimited', async () => {
    const { cart, productId } = build({ limits: { maxQuantityPerItem: 0 } });
    const r = await cart.addItem({ ...owner, marketplaceTab: 'mithilak', productId, quantity: 50 });
    expect(r.items[0].quantity).toBe(50);
  });
});

describe('add to cart with a stale listing id ("Listing not found or not available")', () => {
  it('falls back to the product instead of failing when the listing no longer resolves', async () => {
    const { cart, productId } = build();
    const staleListingId = oid();
    const r = await cart.addItem({ ...owner, marketplaceTab: 'mithilak', listingId: staleListingId, productId, quantity: 1 });
    expect(r.items).toHaveLength(1);
    expect(r.items[0].productId).toBe(productId);
  });

  it('still reports not-found when there is no product to fall back to', async () => {
    const { cart } = build();
    await expect(cart.addItem({ ...owner, marketplaceTab: 'mithilak', listingId: oid(), quantity: 1 })).rejects.toMatchObject({ statusCode: 404 });
  });
});

describe('customised package line', () => {
  function withPackage() {
    const ctx = build({ limits: { maxQuantityPerItem: 5, maxCartItems: 30 } });
    const items = Array.from({ length: 24 }, (_, i) => ({ _id: new mongoose.Types.ObjectId(), name: `Item ${i + 1}`, price: i < 20 ? 150 : 125, sortOrder: i }));
    const pkg = { _id: new mongoose.Types.ObjectId(), name: 'Mithila Dwirangman', fullPrice: 3500, imageUrl: '', productId: ctx.productId, marketplaceTab: 'mithilak', items, toObject() { return this; } };
    const packageService = new PackageService({ platformConfigService: { getConfig: async () => ({ packageMinPricePercent: 40 }) } });
    packageService._findActive = async () => pkg;
    ctx.cart.setPackageService(packageService);
    return { ...ctx, pkg, items };
  }

  it('prices the customised selection on the server and stores only ids', async () => {
    const { cart, pkg, items } = withPackage();
    const keep = items.slice(0, 12).map((i) => String(i._id)); // 12 x 150 = 1800
    const r = await cart.addItem({ ...owner, marketplaceTab: 'mithilak', packageId: String(pkg._id), selectedItemIds: keep, quantity: 1 });
    expect(r.items[0].unitPrice).toBe(1800);
    expect(r.items[0].customization.selectedCount).toBe(12);
    expect(r.items[0].itemKey).toMatch(/^package:[a-f0-9]{24}:[a-f0-9]{12}$/);
  });

  it('refuses a package below the minimum value (₹1400)', async () => {
    const { cart, pkg, items } = withPackage();
    await expect(cart.addItem({
      ...owner, marketplaceTab: 'mithilak', packageId: String(pkg._id), selectedItemIds: items.slice(0, 4).map((i) => String(i._id)), quantity: 1,
    })).rejects.toThrow(/at least ₹1400/);
  });

  it('keeps different customisations as separate lines and merges identical ones', async () => {
    const { cart, pkg, items } = withPackage();
    const a = items.slice(0, 12).map((i) => String(i._id));
    const b = items.slice(0, 13).map((i) => String(i._id));
    await cart.addItem({ ...owner, marketplaceTab: 'mithilak', packageId: String(pkg._id), selectedItemIds: a, quantity: 1 });
    await cart.addItem({ ...owner, marketplaceTab: 'mithilak', packageId: String(pkg._id), selectedItemIds: [...a].reverse(), quantity: 1 });
    const r = await cart.addItem({ ...owner, marketplaceTab: 'mithilak', packageId: String(pkg._id), selectedItemIds: b, quantity: 1 });
    expect(r.items).toHaveLength(2);
    expect(r.items.find((i) => i.customization.selectedCount === 12).quantity).toBe(2);
  });

  it('re-prices from the package on every read, so a changed package price is honoured', async () => {
    const { cart, pkg, items } = withPackage();
    const keep = items.slice(0, 12).map((i) => String(i._id));
    await cart.addItem({ ...owner, marketplaceTab: 'mithilak', packageId: String(pkg._id), selectedItemIds: keep, quantity: 1 });
    pkg.fullPrice = 7000; // admin doubles the package price
    const r = await cart.getCart({ ...owner, marketplaceTab: 'mithilak' });
    expect(r.items[0].unitPrice).toBe(3600);
  });
});

describe('guests have no cart (login required)', () => {
  const res = () => ({ locals: { requestId: 'test' }, cookie: jest.fn(), status: jest.fn().mockReturnThis(), json: jest.fn().mockReturnThis() });

  it('returns an empty cart for a guest read and refuses to modify one', async () => {
    const { cart, productId } = build({ loginRequired: true });
    const controller = new CartController(cart);

    const readRes = res();
    const readNext = jest.fn();
    controller.getCart({ user: null, query: { marketplaceTab: 'mithilak' }, cookies: {} }, readRes, readNext);
    await settle();
    expect(readNext).not.toHaveBeenCalled();
    const body = readRes.json.mock.calls[0][0];
    expect(body.data.items).toEqual([]);
    expect(body.data.loginRequired).toBe(true);

    const next = jest.fn();
    controller.addItem({ user: null, body: { productId, quantity: 1 }, query: {}, cookies: {} }, res(), next);
    await settle();
    expect(next.mock.calls[0][0]).toMatchObject({ statusCode: 401, details: [{ code: 'LOGIN_REQUIRED' }] });
  });

  it('can be switched off by the admin', async () => {
    const { cart } = build({ loginRequired: false });
    await expect(cart.isLoginRequired()).resolves.toBe(false);
  });
});
