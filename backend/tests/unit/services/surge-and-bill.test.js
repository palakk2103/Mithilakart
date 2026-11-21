/**
 * FEE-1/2/3 + CART-4: the bill for the client's QA cart values on Quick Shop
 * (surge applies) and Mithilakart (no surge), and the surge time windows.
 */
const { PlatformConfigService } = require('../../../src/services/platform/PlatformConfigService');
const { PricingService } = require('../../../src/services/pricing/PricingService');
const { AdminPlatformSettingsService } = require('../../../src/services/admin/AdminPlatformSettingsService');
const { DEFAULT_PLATFORM_SETTINGS } = require('../../../src/constants/platformSettings');
const { inSurgeWindow, computeSurge, publicSurgeInfo } = require('../../../src/services/pricing/surge');

const platform = new PlatformConfigService({});

function pricingWith(overrides = {}) {
  const config = { ...DEFAULT_PLATFORM_SETTINGS, gst: '', ...overrides };
  return new PricingService({
    platformConfigService: {
      getConfig: async () => config,
      describeDelivery: platform.describeDelivery.bind(platform),
      computeHandlingFee: platform.computeHandlingFee.bind(platform),
      computeSurge: platform.computeSurge.bind(platform),
    },
  });
}

const cartOf = (value) => [{ unitPrice: value, quantity: 1, mrp: value }];

describe('QA bills (defaults: handling ₹11 tiers, delivery ₹25 free ≥ ₹150, surge ₹30 below ₹499)', () => {
  // [cart value, handling, delivery, surge on Quick Shop]
  const rows = [
    [80, 11, 25, 30],
    [120, 7.7, 25, 30],
    [200, 4.4, 0, 30],
    [300, 0, 0, 30],
    [520, 0, 0, 0],
  ];

  it.each(rows)('₹%d on Quick Shop', async (value, handling, delivery, surge) => {
    const bill = await pricingWith().calculateTotals({ items: cartOf(value), marketplaceTab: 'quick_shop' });
    expect(bill.handlingFee).toBe(handling);
    expect(bill.deliveryCharge).toBe(delivery);
    expect(bill.surgeCharge).toBe(surge);
    expect(bill.total).toBe(Math.round((value + handling + delivery + surge) * 100) / 100);
    expect(bill.surge.applies).toBe(surge > 0);
    if (surge) expect(bill.surge.amountToAvoid).toBe(499 - value);
  });

  it.each(rows)('₹%d on Mithilakart has no surge', async (value, handling, delivery) => {
    const bill = await pricingWith().calculateTotals({ items: cartOf(value), marketplaceTab: 'mithilakart' });
    expect(bill.surgeCharge).toBe(0);
    expect(bill.total).toBe(Math.round((value + handling + delivery) * 100) / 100);
  });

  it('Fresh & Groceries gets surge too; exactly ₹499 does not', async () => {
    expect((await pricingWith().calculateTotals({ items: cartOf(498), marketplaceTab: 'groceries_fresh' })).surgeCharge).toBe(30);
    expect((await pricingWith().calculateTotals({ items: cartOf(499), marketplaceTab: 'groceries_fresh' })).surgeCharge).toBe(0);
  });

  it('total = items − coupon + handling + delivery + surge (CART-4)', async () => {
    const items = [
      { unitPrice: 50, quantity: 2, mrp: 60 },
      { unitPrice: 40, quantity: 1, mrp: 40 },
    ];
    const bill = await pricingWith().calculateTotals({ items, marketplaceTab: 'quick_shop' });
    // 140 items: handling 7.70 (30%), delivery 25, surge 30.
    expect(bill.mrpTotal).toBe(160);
    expect(bill.productDiscount).toBe(20);
    expect(bill.total).toBe(140 + 7.7 + 25 + 30);
  });

  it('empty cart owes no surge', async () => {
    const bill = await pricingWith().calculateTotals({ items: [], marketplaceTab: 'quick_shop' });
    expect(bill.surgeCharge).toBe(0);
    expect(bill.total).toBe(0);
  });

  it('admin can switch surge off, change amount/threshold and tabs', async () => {
    const off = pricingWith({ surgeConfig: { enabled: false } });
    expect((await off.calculateTotals({ items: cartOf(80), marketplaceTab: 'quick_shop' })).surgeCharge).toBe(0);

    const custom = pricingWith({ surgeConfig: { amount: 20, threshold: 300, tabs: ['quick_shop'] } });
    expect((await custom.calculateTotals({ items: cartOf(250), marketplaceTab: 'quick_shop' })).surgeCharge).toBe(20);
    expect((await custom.calculateTotals({ items: cartOf(350), marketplaceTab: 'quick_shop' })).surgeCharge).toBe(0);
    expect((await custom.calculateTotals({ items: cartOf(250), marketplaceTab: 'groceries_fresh' })).surgeCharge).toBe(0);
  });
});

describe('surge time windows (IST)', () => {
  // 2026-11-18 is a Wednesday (day 3). 13:30 UTC = 19:00 IST.
  const wed1900Ist = new Date('2026-11-18T13:30:00Z');
  const wed1000Ist = new Date('2026-11-18T04:30:00Z');
  const thu0100Ist = new Date('2026-11-18T19:30:00Z'); // Thursday 01:00 IST

  it('no windows = always on', () => {
    expect(inSurgeWindow([], wed1000Ist)).toBe(true);
  });

  it('evening window', () => {
    const windows = [{ start: '18:00', end: '22:00' }];
    expect(inSurgeWindow(windows, wed1900Ist)).toBe(true);
    expect(inSurgeWindow(windows, wed1000Ist)).toBe(false);
  });

  it('window past midnight belongs to the day it starts', () => {
    const windows = [{ days: [3], start: '22:00', end: '02:00' }];
    expect(inSurgeWindow(windows, thu0100Ist)).toBe(true);
    expect(inSurgeWindow([{ days: [4], start: '22:00', end: '02:00' }], thu0100Ist)).toBe(false);
  });

  it('weekend-only window is off on Wednesday', () => {
    expect(inSurgeWindow([{ days: [0, 6], start: '00:00', end: '23:59' }], wed1900Ist)).toBe(false);
  });

  it('outside the window the bill has no surge', () => {
    const config = { ...DEFAULT_PLATFORM_SETTINGS, surgeConfig: { windows: [{ start: '18:00', end: '22:00' }] } };
    expect(computeSurge(config, { cartValue: 100, marketplaceTab: 'quick_shop', now: wed1000Ist }).charge).toBe(0);
    expect(computeSurge(config, { cartValue: 100, marketplaceTab: 'quick_shop', now: wed1900Ist }).charge).toBe(30);
  });
});

describe('public surge info for the tab banner', () => {
  it('fills the threshold into the banner text', () => {
    const info = publicSurgeInfo(DEFAULT_PLATFORM_SETTINGS);
    expect(info.bannerTitle).toBe('Place an order above ₹499 to avoid surge charge');
    expect(info.activeTabs).toEqual(['quick_shop', 'groceries_fresh']);
  });
});

describe('admin validation of surgeConfig', () => {
  const svc = new AdminPlatformSettingsService({});
  it.each([
    [{ amount: -1 }],
    [{ amount: '30' }],
    [{ tabs: ['nope'] }],
    [{ windows: [{ start: '25:00', end: '02:00' }] }],
    [{ windows: [{ days: [7], start: '10:00', end: '12:00' }] }],
    [{ bannerText: '<script>' }],
  ])('rejects %j', (surgeConfig) => {
    expect(() => svc._validateCheckoutSettings({ surgeConfig })).toThrow();
  });

  it('accepts a full valid config', () => {
    expect(() => svc._validateCheckoutSettings({
      surgeConfig: {
        enabled: true, amount: 30, threshold: 499, tabs: ['quick_shop', 'groceries_fresh'],
        windows: [{ days: [5, 6], start: '18:00', end: '23:30' }], bannerText: 'High demand',
      },
    })).not.toThrow();
  });
});
