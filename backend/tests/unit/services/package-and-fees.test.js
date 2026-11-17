const mongoose = require('mongoose');
const { PackageService } = require('../../../src/services/catalog/PackageService');
const { PlatformConfigService } = require('../../../src/services/platform/PlatformConfigService');
const { PricingService } = require('../../../src/services/pricing/PricingService');
const { DEFAULT_PLATFORM_SETTINGS } = require('../../../src/constants/platformSettings');

const id = () => new mongoose.Types.ObjectId();

// 24 items, ₹3500 in total (the Mithila Dwirangman shape): 20 × ₹150 + 4 × ₹125.
const buildPackage = (overrides = {}) => {
  const items = [
    ...Array.from({ length: 20 }, (_, i) => ({ _id: id(), name: `Item ${i + 1}`, price: 150, sortOrder: i, isMandatory: false })),
    ...Array.from({ length: 4 }, (_, i) => ({ _id: id(), name: `Item ${i + 21}`, price: 125, sortOrder: 20 + i, isMandatory: false })),
  ];
  return { _id: id(), name: 'Mithila Dwirangman', fullPrice: 3500, minPriceAmount: null, minPricePercent: null, items, ...overrides };
};

describe('PackageService.quote', () => {
  const service = new PackageService({ platformConfigService: { getConfig: async () => ({ packageMinPricePercent: 40 }) } });

  it('prices every item ticked at the full package price', async () => {
    const pkg = buildPackage();
    const q = await service.quote(pkg, pkg.items.map((i) => String(i._id)));
    expect(q).toMatchObject({ valid: true, price: 3500, selectedCount: 24, totalCount: 24, savings: 0 });
  });

  it('recomputes the price as items are unticked', async () => {
    const pkg = buildPackage();
    const keep = pkg.items.slice(0, 12).map((i) => String(i._id)); // 12 × 150 = 1800
    const q = await service.quote(pkg, keep);
    expect(q.price).toBe(1800);
    expect(q.valid).toBe(true);
    expect(q.savings).toBe(1700);
  });

  it('enforces the default 40% minimum (₹1400 of ₹3500)', async () => {
    const pkg = buildPackage();
    expect(await service.minimumPrice(pkg)).toBe(1400);
    const tooLittle = await service.quote(pkg, pkg.items.slice(0, 5).map((i) => String(i._id))); // ₹750
    expect(tooLittle.valid).toBe(false);
    expect(tooLittle.message).toMatch(/at least ₹1400/);
  });

  it('lets an explicit minimum amount (₹1200) override the percentage', async () => {
    const pkg = buildPackage({ minPriceAmount: 1200 });
    expect(await service.minimumPrice(pkg)).toBe(1200);
    const q = await service.quote(pkg, pkg.items.slice(0, 8).map((i) => String(i._id))); // 8 × 150 = 1200
    expect(q.valid).toBe(true);
  });

  it('always includes mandatory items', async () => {
    const pkg = buildPackage();
    pkg.items[0].isMandatory = true;
    const q = await service.quote(pkg, pkg.items.slice(1, 9).map((i) => String(i._id)));
    expect(q.selectedItemIds).toContain(String(pkg.items[0]._id));
  });

  it('scales proportionally when item prices do not add up to the full price', async () => {
    const pkg = buildPackage();
    pkg.items.forEach((it) => { it.price = 100; }); // sums to 2400, package is 3500
    const q = await service.quote(pkg, pkg.items.slice(0, 12).map((i) => String(i._id)));
    expect(q.price).toBe(1750);
  });

  it('rejects items that are not part of the package (a client cannot inject its own)', async () => {
    const pkg = buildPackage();
    await expect(service.quote(pkg, [String(id())])).rejects.toThrow(/not part of this package/);
  });

  it('resolveForCart refuses a selection below the minimum', async () => {
    const pkg = buildPackage();
    service._findActive = async () => pkg;
    await expect(service.resolveForCart(String(pkg._id), [String(pkg.items[0]._id)])).rejects.toThrow(/at least/);
  });

  it('gives the same hash for the same selection in any order', () => {
    const a = String(id());
    const b = String(id());
    expect(service.selectionHash([a, b])).toBe(service.selectionHash([b, a]));
    expect(service.selectionHash([a, b])).toMatch(/^[a-f0-9]{12}$/);
  });
});

describe('checkout fees (admin-configurable)', () => {
  const config = { ...DEFAULT_PLATFORM_SETTINGS, deliveryRules: [] };
  const platform = new PlatformConfigService({});

  it.each([
    [50, 11, 0],
    [98.99, 11, 0],
    [99, 7.7, 30],
    [150, 4.4, 60],
    [249, 4.4, 60],
    [250, 0, 100],
  ])('handling fee at ₹%s is ₹%s (%s%% off)', (subtotal, fee, pct) => {
    const h = platform.computeHandlingFee(config, subtotal);
    expect(h.fee).toBe(fee);
    expect(h.discountPercent).toBe(pct);
  });

  it('charges ₹25 delivery below ₹150 and nothing from ₹150', () => {
    expect(platform.describeDelivery(config, 149).charge).toBe(25);
    expect(platform.describeDelivery(config, 149).amountToFree).toBe(1);
    expect(platform.describeDelivery(config, 150).charge).toBe(0);
  });

  it('follows admin-edited tiers', () => {
    const custom = { ...config, handlingFee: 20, handlingFeeTiers: [{ minSubtotal: 500, discountPercent: 50 }] };
    expect(platform.computeHandlingFee(custom, 499).fee).toBe(20);
    expect(platform.computeHandlingFee(custom, 500).fee).toBe(10);
  });

  it('totals match the cart mock-up: ₹70 cart, ₹100 MRP', async () => {
    const pricing = new PricingService({
      platformConfigService: {
        getConfig: async () => config,
        describeDelivery: platform.describeDelivery.bind(platform),
        computeHandlingFee: platform.computeHandlingFee.bind(platform),
      },
    });
    const r = await pricing.calculateTotals({
      items: [{ unitPrice: 25, mrp: 30, quantity: 1 }, { unitPrice: 45, mrp: 70, quantity: 1 }],
    });
    expect(r).toMatchObject({
      subtotal: 70, mrpTotal: 100, productDiscount: 30, handlingFee: 11, deliveryCharge: 25, amountToFreeDelivery: 80, total: 106,
    });
  });

  it('charges nothing for an empty cart', async () => {
    const pricing = new PricingService({
      platformConfigService: {
        getConfig: async () => config,
        describeDelivery: platform.describeDelivery.bind(platform),
        computeHandlingFee: platform.computeHandlingFee.bind(platform),
      },
    });
    const r = await pricing.calculateTotals({ items: [] });
    expect(r.total).toBe(0);
  });
});
