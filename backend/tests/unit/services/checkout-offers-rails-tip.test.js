/**
 * CART-1 rails, CART-2 tip, CART-3 coupon Apply/Locked list.
 */
const mongoose = require('mongoose');
const { CouponService } = require('../../../src/services/coupons/CouponService');
const { CartRecommendationService } = require('../../../src/services/cart/CartRecommendationService');
const { PricingService } = require('../../../src/services/pricing/PricingService');
const { PlatformConfigService } = require('../../../src/services/platform/PlatformConfigService');
const { AdminPlatformSettingsService } = require('../../../src/services/admin/AdminPlatformSettingsService');
const { DEFAULT_PLATFORM_SETTINGS } = require('../../../src/constants/platformSettings');

const oid = () => new mongoose.Types.ObjectId();

describe('CART-3 coupon offers', () => {
  const coupons = [
    { _id: oid(), code: 'ADVANTAGE50', type: 'flat', value: 50, minOrderAmount: 999, usageCount: 0, isActive: true },
    { _id: oid(), code: 'SAVE25', type: 'flat', value: 25, minOrderAmount: 100, usageCount: 0, isActive: true },
    { _id: oid(), code: 'TEN', type: 'percent', value: 10, maxDiscount: 40, minOrderAmount: 0, usageCount: 0, isActive: true },
    { _id: oid(), code: 'ONCE', type: 'flat', value: 30, minOrderAmount: 0, perUserLimit: 1, usageCount: 3, isActive: true },
    { _id: oid(), code: 'GONE', type: 'flat', value: 30, minOrderAmount: 0, usageLimit: 5, usageCount: 5, isActive: true },
  ];
  const service = new CouponService({
    couponRepository: { find: async () => coupons },
    couponUsageRepository: { countByCouponAndUser: async (id) => (String(id) === String(coupons[3]._id) ? 1 : 0) },
  });

  it('marks eligible coupons with the saving, best first, and locks the rest with the reason', async () => {
    const offers = await service.listOffers({ userId: String(oid()), subtotal: 122 });
    const byCode = Object.fromEntries(offers.map((o) => [o.code, o]));

    expect(byCode.SAVE25).toMatchObject({ eligible: true, saving: 25, lockedReason: null });
    expect(byCode.TEN).toMatchObject({ eligible: true, saving: 12.2 });
    expect(byCode.ADVANTAGE50).toMatchObject({ eligible: false, amountNeeded: 877, lockedReason: 'Shop for ₹877 more to apply', saving: 50, title: 'Save ₹50 with ADVANTAGE50' });
    expect(byCode.ONCE).toMatchObject({ eligible: false, lockedReason: 'Already used' });
    expect(byCode.GONE).toMatchObject({ eligible: false, lockedReason: 'Offer fully claimed' });
    expect(offers.map((o) => o.code).slice(0, 2)).toEqual(['SAVE25', 'TEN']);
  });
});

describe('CART-2 tip', () => {
  const platform = new PlatformConfigService({});
  const pricing = new PricingService({
    platformConfigService: {
      getConfig: async () => ({ ...DEFAULT_PLATFORM_SETTINGS }),
      describeDelivery: platform.describeDelivery.bind(platform),
      computeHandlingFee: platform.computeHandlingFee.bind(platform),
      computeSurge: platform.computeSurge.bind(platform),
    },
  });

  it('adds the tip to the total and reports it', async () => {
    const bill = await pricing.calculateTotals({ items: [{ unitPrice: 300, quantity: 1 }], marketplaceTab: 'mithilakart', tipAmount: 20 });
    expect(bill.tipAmount).toBe(20);
    expect(bill.total).toBe(320);
  });

  it('rejects a negative or huge tip', async () => {
    await expect(pricing.calculateTotals({ items: [{ unitPrice: 300, quantity: 1 }], tipAmount: -5 })).rejects.toMatchObject({ statusCode: 422 });
    await expect(pricing.calculateTotals({ items: [{ unitPrice: 300, quantity: 1 }], tipAmount: 5000 })).rejects.toMatchObject({ statusCode: 422 });
  });
});

describe('CART-1 recommendation rails', () => {
  const P = Array.from({ length: 8 }, () => oid());
  const products = P.map((id, i) => ({ _id: id, title: `P${i}`, brand: i < 4 ? 'Tata' : 'Amul', categoryId: i % 2 ? 'c1' : 'c2', images: [{ url: `/p${i}.png` }], stock: i === 7 ? 0 : 10, rating: 4 }));
  const listings = P.map((id, i) => ({ _id: oid(), productId: id, marketplaceTab: 'quick_shop', price: 20 + i * 20, mrp: 20 + i * 20 + (i === 5 ? 60 : 5), publishedAt: new Date(2026, 0, i + 1) }));
  const match = (doc, f) => Object.entries(f).every(([k, v]) => {
    if (k === '$expr') return doc.mrp > doc.price;
    if (v && typeof v === 'object' && v.$in) return v.$in.map(String).includes(String(doc[k]));
    if (v && typeof v === 'object' && v.$lte !== undefined) return doc[k] <= v.$lte;
    return String(doc[k]) === String(v);
  });
  const repo = (rows) => ({ findPublic: async (f = {}) => rows.filter((r) => match(r, f)), find: async (f = {}) => rows.filter((r) => match(r, f)) });

  const orderItems = [
    { productId: P[2], quantity: 9, orderId: 'o1', userId: 'u1' },
    { productId: P[3], quantity: 4, orderId: 'o2', userId: 'u1' },
  ];
  const service = new CartRecommendationService({
    marketplaceListingRepository: repo(listings),
    productRepository: repo(products),
    orderItemRepository: {
      ...repo(orderItems),
      model: { aggregate: async () => [{ _id: P[2], units: 9, orders: 1 }, { _id: P[3], units: 4, orders: 1 }] },
    },
    wishlistRepository: { findByUser: async () => [{ productId: P[6] }] },
    platformConfigService: { getConfig: async () => ({}) },
  });

  it('builds real rails, excludes cart items and out-of-stock, never repeats a product', async () => {
    const userId = String(oid());
    const { rails } = await service.getRails({
      userId,
      marketplaceTab: 'quick_shop',
      cartProductIds: [String(P[0])],
      recentProductIds: [String(P[1]), String(P[7])],
    });
    const byKey = Object.fromEntries(rails.map((r) => [r.key, r]));

    expect(byKey.recently_viewed.items.map((i) => i.productId)).toEqual([String(P[1])]); // P7 has no stock
    expect(byKey.bestsellers.tabs[0]).toMatchObject({ key: 'bestsellers' });
    expect(byKey.bestsellers.tabs[0].items.map((i) => i.productId)).toEqual([String(P[2]), String(P[3])]);
    expect(byKey.bestsellers.tabs.find((t) => t.key === 'price_drops').items[0].productId).toBe(String(P[5]));

    // "My Wishlist" mirrors the wishlist page, so it alone may repeat a product.
    const all = rails.filter((r) => !r.tabs && r.key !== 'wishlist').flatMap((r) => r.items.map((i) => i.productId));
    expect(new Set(all).size).toBe(all.length);
    expect(all).not.toContain(String(P[0]));
    rails.flatMap((r) => (r.tabs ? r.tabs.flatMap((t) => t.items) : r.items)).forEach((card) => {
      expect(card).toMatchObject({ listingId: expect.any(String), marketplaceTab: 'quick_shop', price: expect.any(Number) });
    });
  });

  it('wishlist rail shows the own wishlist of the customer', async () => {
    const svc = Object.assign(Object.create(Object.getPrototypeOf(service)), service, {
      platformConfigService: { getConfig: async () => ({ cartRails: { rails: [{ key: 'wishlist', title: 'My Wishlist', enabled: true, source: 'wishlist' }] } }) },
    });
    const { rails } = await svc.getRails({ userId: String(oid()), marketplaceTab: 'quick_shop' });
    expect(rails).toHaveLength(1);
    expect(rails[0].items.map((i) => i.productId)).toEqual([String(P[6])]);
  });

  it('respects admin order, titles and hidden rails', async () => {
    const svc = new CartRecommendationService({
      ...service,
      marketplaceListingRepository: service.listings,
      productRepository: service.products,
      orderItemRepository: service.orderItems,
      wishlistRepository: service.wishlist,
      platformConfigService: {
        getConfig: async () => ({
          cartRails: { rails: [
            { key: 'grab', title: 'Under ₹50', enabled: true, source: 'budget', maxPrice: 50 },
            { key: 'hidden', title: 'Hidden', enabled: false, source: 'new_arrivals' },
            { key: 'pick', title: 'Picked', enabled: true, source: 'manual', productIds: [String(P[4])] },
          ] },
        }),
      },
    });
    const { rails } = await svc.getRails({ userId: String(oid()), marketplaceTab: 'quick_shop' });
    expect(rails.map((r) => [r.key, r.title])).toEqual([['grab', 'Under ₹50'], ['pick', 'Picked']]);
    expect(rails[0].items.every((i) => i.price <= 50)).toBe(true);
  });
});

describe('admin validation', () => {
  const svc = new AdminPlatformSettingsService({});
  it('rejects bad rails and content', () => {
    expect(() => svc._validateCheckoutSettings({ cartRails: { rails: [{ key: 'x', title: '', source: 'manual' }] } })).toThrow();
    expect(() => svc._validateCheckoutSettings({ cartRails: { rails: [{ key: 'x', title: 'X', source: 'magic' }] } })).toThrow();
    expect(() => svc._validateCheckoutSettings({ checkoutContent: { trust: { rating: 7 } } })).toThrow();
    expect(() => svc._validateCheckoutSettings({ checkoutContent: { policyPoints: ['<b>x</b>'] } })).toThrow();
  });
  it('accepts the defaults', () => {
    expect(() => svc._validateCheckoutSettings({
      cartRails: DEFAULT_PLATFORM_SETTINGS.cartRails,
      checkoutContent: DEFAULT_PLATFORM_SETTINGS.checkoutContent,
    })).not.toThrow();
  });
});
