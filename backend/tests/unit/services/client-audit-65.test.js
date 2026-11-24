/**
 * Client 65-point audit: coupon security (P39), purchase limits at order time
 * (P38), demand-based surge (P23) and server-side shop hours (P61).
 */
const { CouponService } = require('../../../src/services/coupons/CouponService');
const { CartService } = require('../../../src/services/cart/CartService');
const { computeSurge, surgeActiveForTab } = require('../../../src/services/pricing/surge');
const { shopStatusForTab, assertShopOpen } = require('../../../src/services/platform/shopHours');

const fakeRedis = () => {
  const m = new Map();
  return {
    get: async (k) => (m.has(k) ? String(m.get(k)) : null),
    incr: async (k) => { m.set(k, (m.get(k) || 0) + 1); return m.get(k); },
    expire: async () => 1,
    ttl: async () => 600,
  };
};

const coupon = (over = {}) => ({
  _id: 'c1', code: 'SAVE50', type: 'fixed', value: 50, minOrderAmount: 0, maxDiscount: null,
  perUserLimit: null, usageLimit: null, usageCount: 0, sellerId: null, startsAt: null, expiresAt: null, ...over,
});

const build = (c, usages = []) => {
  const couponRepository = {
    findByCode: async (code) => (c && code === c.code ? c : null),
    find: async () => (c ? [c] : []),
    incrementUsage: jest.fn(async () => ({ matchedCount: 1 })),
    decrementUsage: jest.fn(async () => ({})),
  };
  const couponUsageRepository = {
    countByCouponAndUser: async (_id, userId) => usages.filter((u) => u.userId === userId).length,
    create: jest.fn(async (row) => { usages.push(row); return row; }),
    releaseForOrder: async (orderId) => {
      const rows = usages.filter((u) => u.orderId === orderId);
      rows.forEach((r) => usages.splice(usages.indexOf(r), 1));
      return rows;
    },
  };
  return { service: new CouponService({ couponRepository, couponUsageRepository, redisClient: fakeRedis() }), couponRepository, couponUsageRepository, usages };
};

describe('P39 coupon security', () => {
  it('records the use, refuses a second one and gives it back when the order is cancelled', async () => {
    const { service, couponRepository, usages } = build(coupon({ perUserLimit: 1 }));
    await service.redeem({ code: 'save50', subtotal: 500, userId: 'u1', orderId: 'o1' });
    expect(usages).toEqual([{ couponId: 'c1', userId: 'u1', orderId: 'o1' }]);
    await expect(service.calculateDiscount({ code: 'SAVE50', subtotal: 500, userId: 'u1' })).rejects.toThrow('already used');

    await service.releaseForOrder('o1');
    expect(couponRepository.decrementUsage).toHaveBeenCalledWith('c1', null);
    await expect(service.calculateDiscount({ code: 'SAVE50', subtotal: 500, userId: 'u1' })).resolves.toMatchObject({ discount: 50 });
  });

  it('refuses the order when the last total use was taken by someone else', async () => {
    const { service, couponRepository } = build(coupon({ usageLimit: 1 }));
    couponRepository.incrementUsage.mockResolvedValue({ matchedCount: 0 });
    await expect(service.redeem({ code: 'SAVE50', subtotal: 500, userId: 'u1', orderId: 'o1' })).rejects.toThrow('fully claimed');
  });

  it('locks code guessing per customer, also for a correct code, without touching other customers', async () => {
    const { service } = build(coupon());
    for (let i = 0; i < 8; i += 1) {
      // eslint-disable-next-line no-await-in-loop
      await expect(service.validateCoupon({ code: `GUESS${i}`, subtotal: 500, userId: 'u1' })).rejects.toMatchObject({ statusCode: 404 });
    }
    await expect(service.validateCoupon({ code: 'SAVE50', subtotal: 500, userId: 'u1' })).rejects.toMatchObject({ statusCode: 429 });
    await expect(service.validateCoupon({ code: 'SAVE50', subtotal: 500, userId: 'u2' })).resolves.toMatchObject({ valid: true });
  });

  it('discounts only the lines of the seller that issued the coupon', async () => {
    const { service } = build(coupon({ type: 'percent', value: 10, sellerId: 's1' }));
    const items = [{ sellerId: 's1', unitPrice: 100, quantity: 2 }, { sellerId: 's2', unitPrice: 1000, quantity: 1 }];
    await expect(service.calculateDiscount({ code: 'SAVE50', subtotal: 1200, userId: 'u1', items })).resolves.toMatchObject({ discount: 20 });
    await expect(service.calculateDiscount({ code: 'SAVE50', subtotal: 1000, userId: 'u1', items: [items[1]] })).rejects.toThrow('not valid for the items');
  });

  it('a coupon that has not started looks like an unknown one, an expired one says so', async () => {
    const later = new Date(Date.now() + 1e6);
    const before = new Date(Date.now() - 1e6);
    await expect(build(coupon({ startsAt: later })).service.calculateDiscount({ code: 'SAVE50', subtotal: 1 })).rejects.toThrow('not valid');
    await expect(build(coupon({ expiresAt: before })).service.calculateDiscount({ code: 'SAVE50', subtotal: 1 })).rejects.toThrow('expired');
  });

  it('public list hides usage counters and seller coupons never leak through it', async () => {
    const { service } = build(coupon({ usageCount: 7, usageLimit: 9 }));
    const [row] = await service.listForUser('u1');
    expect(Object.keys(row).sort()).toEqual(['code', 'description', 'expiresAt', 'maxDiscount', 'minOrderAmount', 'type', 'value']);
  });
});

describe('P38 purchase limits before an order is created', () => {
  const cart = Object.assign(Object.create(CartService.prototype), {
    _limits: async () => ({ maxQuantityPerItem: 10, maxCartItems: 2, message: 'Limited quantity due to high demand' }),
  });

  it('checks quantity, listing cap, split lines and number of items', async () => {
    const line = (over) => ({ productId: 'p1', quantity: 1, ...over });
    await expect(cart.assertPurchaseLimits([line({ quantity: 10 })])).resolves.toBeUndefined();
    await expect(cart.assertPurchaseLimits([line({ quantity: 11 })])).rejects.toMatchObject({ statusCode: 409 });
    await expect(cart.assertPurchaseLimits([line({ quantity: 3, maxOrderQuantity: 2 })])).rejects.toMatchObject({ statusCode: 409 });
    await expect(cart.assertPurchaseLimits([line({ quantity: 6 }), line({ quantity: 6 })])).rejects.toMatchObject({ statusCode: 409 });
    await expect(cart.assertPurchaseLimits([line(), line({ productId: 'p2' }), line({ productId: 'p3' })])).rejects.toThrow('up to 2 different items');
  });
});

describe('P23 surge follows real demand when the admin chooses it', () => {
  const cfg = (orders, trigger = 'demand') => ({ surgeConfig: { trigger, demandOrders: 5 }, recentOrdersByTab: { quick_shop: orders } });

  it('is on only once the tab reaches the number of recent orders', () => {
    expect(surgeActiveForTab(cfg(4), 'quick_shop')).toBe(false);
    expect(surgeActiveForTab(cfg(5), 'quick_shop')).toBe(true);
    expect(surgeActiveForTab(cfg(5), 'groceries_fresh')).toBe(false);
    expect(surgeActiveForTab(cfg(0, 'always'), 'quick_shop')).toBe(true);
  });

  it('charges 30 below 499 and nothing from 499', () => {
    expect(computeSurge(cfg(9), { cartValue: 498.99, marketplaceTab: 'quick_shop' }).charge).toBe(30);
    expect(computeSurge(cfg(9), { cartValue: 499, marketplaceTab: 'quick_shop' }).charge).toBe(0);
  });
});

describe('P61 shop hours are decided by the server', () => {
  const at = (hhmmIst) => new Date(`2026-11-23T${hhmmIst}:00+05:30`);

  it('default: closed 00:00–06:00 IST on quick tabs only', () => {
    expect(shopStatusForTab({}, 'quick_shop', at('05:59')).open).toBe(false);
    expect(shopStatusForTab({}, 'quick_shop', at('06:00')).open).toBe(true);
    expect(shopStatusForTab({}, 'quick_shop', at('23:59')).open).toBe(true);
    expect(shopStatusForTab({}, 'mithilak', at('03:00')).open).toBe(true);
  });

  it('supports hours past midnight, force close and switching hours off', () => {
    const late = { shopHours: { open: '18:00', close: '02:00' } };
    expect(shopStatusForTab(late, 'quick_shop', at('01:30')).open).toBe(true);
    expect(shopStatusForTab(late, 'quick_shop', at('03:00')).open).toBe(false);
    expect(shopStatusForTab({ shopHours: { enabled: false } }, 'quick_shop', at('03:00')).open).toBe(true);
    expect(() => assertShopOpen({ shopHours: { enabled: false, forceClosed: true, message: 'Shut' } }, 'quick_shop', at('12:00'))).toThrow('Shut');
  });
});
