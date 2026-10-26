const { SellerEligibilityService } = require('../../../../src/services/fulfillment/SellerEligibilityService');
const { FULFILLMENT_FAILURE_CODE: FAIL } = require('../../../../src/constants/fulfillment');
const { MARKETPLACE_TABS } = require('../../../../src/constants/marketplace');

const TAB = MARKETPLACE_TABS.QUICK_SHOP;

const BASE_CONFIG = {
  sellerSearchRadiusKm: 10,
  crossSellerSubstitutionEnabled: false,
};

function seller(overrides = {}) {
  return {
    _id: 'seller-1',
    status: 'active',
    kycStatus: 'approved',
    isAcceptingOrders: true,
    quickCommerceEligible: true,
    isWarehouse: false,
    latitude: 28.61,
    longitude: 77.20,
    deletedAt: null,
    ...overrides,
  };
}

function product(overrides = {}) {
  return {
    _id: 'prod-A',
    sellerId: 'seller-1',
    stock: 10,
    reservedStock: 0,
    catalogKey: null,
    deletedAt: null,
    ...overrides,
  };
}

function listing(overrides = {}) {
  return {
    _id: 'listing-A',
    productId: 'prod-A',
    marketplaceTab: TAB,
    price: 100,
    maxOrderQuantity: null,
    ...overrides,
  };
}

function item(overrides = {}) {
  return {
    productId: 'prod-A',
    originSellerId: 'seller-1',
    catalogKey: null,
    quantity: 1,
    unitPrice: 100,
    ...overrides,
  };
}

/** Builds the two lookup indexes the service expects. */
function indexes(products, listings) {
  const productIndex = new Map();
  for (const p of products) {
    productIndex.set(String(p._id), p);
    if (p.catalogKey) productIndex.set(`${p.catalogKey}::${String(p.sellerId)}`, p);
  }
  const listingIndex = new Map();
  for (const l of listings) listingIndex.set(`${String(l.productId)}::${l.marketplaceTab}`, l);
  return { productIndex, listingIndex };
}

function buildService({ nearby = [], warehouses = [], products = [], listings = [] } = {}) {
  const sellerRepository = {
    findNearby: jest.fn(async () => nearby),
    find: jest.fn(async () => warehouses),
  };
  const productRepository = { find: jest.fn(async () => products) };
  const marketplaceListingRepository = { findPublic: jest.fn(async () => listings) };

  return {
    service: new SellerEligibilityService({
      sellerRepository, productRepository, marketplaceListingRepository,
    }),
    sellerRepository,
    productRepository,
    marketplaceListingRepository,
  };
}

describe('SellerEligibilityService', () => {
  describe('tabEligibilityField', () => {
    it('maps each quick/exclusive tab to its gating seller flag', () => {
      expect(SellerEligibilityService.tabEligibilityField(MARKETPLACE_TABS.QUICK_SHOP)).toBe('quickCommerceEligible');
      expect(SellerEligibilityService.tabEligibilityField(MARKETPLACE_TABS.GROCERIES_FRESH)).toBe('groceryEligible');
      expect(SellerEligibilityService.tabEligibilityField(MARKETPLACE_TABS.MITHILAK)).toBe('mithilakEligible');
    });

    it('gates nothing for the general marketplace or an unknown tab', () => {
      expect(SellerEligibilityService.tabEligibilityField(MARKETPLACE_TABS.MITHILAKART)).toBeNull();
      expect(SellerEligibilityService.tabEligibilityField('nonsense')).toBeNull();
      expect(SellerEligibilityService.tabEligibilityField(null)).toBeNull();
    });

    it('accepts a legacy commerceFlow alias', () => {
      expect(SellerEligibilityService.tabEligibilityField('fresh_grocery')).toBe('groceryEligible');
    });
  });

  describe('seller attribute conditions', () => {
    const cases = [
      ['KYC not approved', { kycStatus: 'pending' }, FAIL.SELLER_NOT_APPROVED],
      ['suspended', { status: 'suspended' }, FAIL.SELLER_INACTIVE],
      ['soft-deleted', { deletedAt: new Date() }, FAIL.SELLER_INACTIVE],
      ['not accepting orders (T-05)', { isAcceptingOrders: false }, FAIL.SELLER_NOT_ACCEPTING],
      ['tab ineligible', { quickCommerceEligible: false }, FAIL.SELLER_TAB_INELIGIBLE],
      ['no location', { latitude: null, longitude: null }, FAIL.SELLER_NO_LOCATION],
    ];

    it.each(cases)('rejects a seller that is %s', (_label, overrides, expected) => {
      const { service } = buildService();
      const result = service.checkSellerAttributes({
        seller: seller(overrides), marketplaceTab: TAB, distanceKm: 2, config: BASE_CONFIG,
      });

      expect(result.ok).toBe(false);
      expect(result.failureCode).toBe(expected);
    });

    it('accepts a fully compliant seller', () => {
      const { service } = buildService();
      const result = service.checkSellerAttributes({
        seller: seller(), marketplaceTab: TAB, distanceKm: 2, config: BASE_CONFIG,
      });
      expect(result.ok).toBe(true);
    });

    it('T-06: rejects a seller beyond the platform search radius', () => {
      const { service } = buildService();
      const result = service.checkSellerAttributes({
        seller: seller(), marketplaceTab: TAB, distanceKm: 25, config: BASE_CONFIG,
      });
      expect(result.failureCode).toBe(FAIL.SELLER_OUT_OF_RADIUS);
    });

    it('rejects a seller beyond its own tighter fulfillment radius', () => {
      const { service } = buildService();
      const result = service.checkSellerAttributes({
        seller: seller({ fulfillmentRadiusKm: 3 }),
        marketplaceTab: TAB, distanceKm: 8, config: BASE_CONFIG,
      });
      expect(result.failureCode).toBe(FAIL.SELLER_OUT_OF_RADIUS);
    });

    it('rejects a seller already tried and excluded', () => {
      const { service } = buildService();
      const result = service.checkSellerAttributes({
        seller: seller(), marketplaceTab: TAB, distanceKm: 2, config: BASE_CONFIG,
        excludedSellerIds: ['seller-1'],
      });
      expect(result.failureCode).toBe(FAIL.SELLER_REJECTED);
    });

    it('treats a legacy seller with no isAcceptingOrders field as accepting', () => {
      const s = seller();
      delete s.isAcceptingOrders;
      const { service } = buildService();
      expect(service.checkSellerAttributes({
        seller: s, marketplaceTab: TAB, distanceKm: 2, config: BASE_CONFIG,
      }).ok).toBe(true);
    });
  });

  describe('complete-cart check — the governing CR-002 rule', () => {
    it('T-01/T-02: accepts a seller stocking every line', () => {
      const { service } = buildService();
      const products = [
        product({ _id: 'prod-A' }),
        product({ _id: 'prod-B' }),
        product({ _id: 'prod-C' }),
      ];
      const listings = [
        listing({ _id: 'l-A', productId: 'prod-A' }),
        listing({ _id: 'l-B', productId: 'prod-B' }),
        listing({ _id: 'l-C', productId: 'prod-C' }),
      ];
      const items = [item({ productId: 'prod-A' }), item({ productId: 'prod-B' }), item({ productId: 'prod-C' })];

      const result = service.checkCompleteCart({
        seller: seller(), requiredItems: items, marketplaceTab: TAB, config: BASE_CONFIG,
        ...indexes(products, listings),
      });

      expect(result.ok).toBe(true);
      expect(result.resolvedItems).toHaveLength(3);
    });

    it('T-03: rejects the WHOLE seller when one product is missing', () => {
      const { service } = buildService();
      const products = [product({ _id: 'prod-A' }), product({ _id: 'prod-B' })]; // no prod-C
      const listings = [
        listing({ _id: 'l-A', productId: 'prod-A' }),
        listing({ _id: 'l-B', productId: 'prod-B' }),
      ];
      const items = [item({ productId: 'prod-A' }), item({ productId: 'prod-B' }), item({ productId: 'prod-C' })];

      const result = service.checkCompleteCart({
        seller: seller(), requiredItems: items, marketplaceTab: TAB, config: BASE_CONFIG,
        ...indexes(products, listings),
      });

      expect(result.ok).toBe(false);
      expect(result.failureCode).toBe(FAIL.SELLER_MISSING_PRODUCT);
      // No partial result may leak out — a partially-resolved cart is exactly
      // what CR-002 forbids.
      expect(result.resolvedItems).toBeUndefined();
    });

    it('T-04: rejects the WHOLE seller when one line has insufficient quantity', () => {
      const { service } = buildService();
      const products = [
        product({ _id: 'prod-A', stock: 10 }),
        product({ _id: 'prod-B', stock: 10 }),
        product({ _id: 'prod-C', stock: 1 }),
      ];
      const listings = [
        listing({ _id: 'l-A', productId: 'prod-A' }),
        listing({ _id: 'l-B', productId: 'prod-B' }),
        listing({ _id: 'l-C', productId: 'prod-C' }),
      ];
      const items = [
        item({ productId: 'prod-A', quantity: 1 }),
        item({ productId: 'prod-B', quantity: 1 }),
        item({ productId: 'prod-C', quantity: 5 }),
      ];

      const result = service.checkCompleteCart({
        seller: seller(), requiredItems: items, marketplaceTab: TAB, config: BASE_CONFIG,
        ...indexes(products, listings),
      });

      expect(result.ok).toBe(false);
      expect(result.failureCode).toBe(FAIL.SELLER_INSUFFICIENT_QUANTITY);
    });

    it('counts reservedStock against availability', () => {
      const { service } = buildService();
      const products = [product({ stock: 5, reservedStock: 5 })];
      const result = service.checkCompleteCart({
        seller: seller(), requiredItems: [item({ quantity: 1 })], marketplaceTab: TAB, config: BASE_CONFIG,
        ...indexes(products, [listing()]),
      });

      expect(result.failureCode).toBe(FAIL.SELLER_INSUFFICIENT_QUANTITY);
    });

    it('rejects when the listing is not approved/visible for the tab', () => {
      const { service } = buildService();
      // Listing exists but for a different tab, so findPublic would not return it.
      const result = service.checkCompleteCart({
        seller: seller(), requiredItems: [item()], marketplaceTab: TAB, config: BASE_CONFIG,
        ...indexes([product()], [listing({ marketplaceTab: MARKETPLACE_TABS.MITHILAKART })]),
      });

      expect(result.failureCode).toBe(FAIL.SELLER_LISTING_UNAVAILABLE);
    });

    it('respects the listing maxOrderQuantity cap', () => {
      const { service } = buildService();
      const result = service.checkCompleteCart({
        seller: seller(), requiredItems: [item({ quantity: 5 })], marketplaceTab: TAB, config: BASE_CONFIG,
        ...indexes([product({ stock: 100 })], [listing({ maxOrderQuantity: 2 })]),
      });

      expect(result.failureCode).toBe(FAIL.SELLER_INSUFFICIENT_QUANTITY);
    });

    it('prices from the listing, not from the client-supplied cart price', () => {
      const { service } = buildService();
      const result = service.checkCompleteCart({
        seller: seller(),
        requiredItems: [item({ unitPrice: 1 })], // client claims Rs 1
        marketplaceTab: TAB, config: BASE_CONFIG,
        ...indexes([product()], [listing({ price: 250 })]),
      });

      expect(result.resolvedItems[0].unitPrice).toBe(250);
    });
  });

  describe('cross-seller substitution (D1 — catalogKey)', () => {
    const substitutionOn = { ...BASE_CONFIG, crossSellerSubstitutionEnabled: true };

    it('T-34: with a null catalogKey, only the origin seller qualifies', () => {
      const { service } = buildService();
      const otherSellerProduct = product({ _id: 'prod-A2', sellerId: 'seller-2' });

      const result = service.checkCompleteCart({
        seller: seller({ _id: 'seller-2' }),
        requiredItems: [item({ productId: 'prod-A', originSellerId: 'seller-1', catalogKey: null })],
        marketplaceTab: TAB,
        config: substitutionOn,
        ...indexes([otherSellerProduct], [listing({ productId: 'prod-A2' })]),
      });

      expect(result.ok).toBe(false);
      expect(result.failureCode).toBe(FAIL.SELLER_MISSING_PRODUCT);
    });

    it('T-35: with substitution disabled, a keyed product still does not substitute', () => {
      const { service } = buildService();
      const sellerTwoProduct = product({ _id: 'prod-A2', sellerId: 'seller-2', catalogKey: 'ATTA-5KG' });

      const result = service.checkCompleteCart({
        seller: seller({ _id: 'seller-2' }),
        requiredItems: [item({ productId: 'prod-A', originSellerId: 'seller-1', catalogKey: 'ATTA-5KG' })],
        marketplaceTab: TAB,
        config: BASE_CONFIG, // substitution OFF — the ship default
        ...indexes([sellerTwoProduct], [listing({ productId: 'prod-A2' })]),
      });

      expect(result.ok).toBe(false);
    });

    it('substitutes across sellers when enabled and the key matches', () => {
      const { service } = buildService();
      const sellerTwoProduct = product({ _id: 'prod-A2', sellerId: 'seller-2', catalogKey: 'ATTA-5KG' });

      const result = service.checkCompleteCart({
        seller: seller({ _id: 'seller-2' }),
        requiredItems: [item({ productId: 'prod-A', originSellerId: 'seller-1', catalogKey: 'ATTA-5KG' })],
        marketplaceTab: TAB,
        config: substitutionOn,
        ...indexes([sellerTwoProduct], [listing({ _id: 'l-A2', productId: 'prod-A2' })]),
      });

      expect(result.ok).toBe(true);
      expect(String(result.resolvedItems[0].productId)).toBe('prod-A2');
    });
  });

  describe('serviceability', () => {
    it('passes when the tab declares no pincode restriction', () => {
      const { service } = buildService();
      expect(service.checkServiceability({ seller: seller(), tabConfig: null }).ok).toBe(true);
    });

    it('rejects a seller outside the tab serviceable pincodes', () => {
      const { service } = buildService();
      const result = service.checkServiceability({
        seller: seller({ pincode: '560001' }),
        tabConfig: { serviceablePincodes: ['110'] },
      });
      expect(result.failureCode).toBe(FAIL.SELLER_NOT_SERVICEABLE);
    });

    it('accepts a seller matching a pincode prefix', () => {
      const { service } = buildService();
      const result = service.checkServiceability({
        seller: seller({ pincode: '110001' }),
        tabConfig: { serviceablePincodes: ['110'] },
      });
      expect(result.ok).toBe(true);
    });
  });

  describe('findEligibleSellers', () => {
    it('returns eligible candidates and records why each rejection happened', async () => {
      const good = seller({ _id: 'seller-good', distanceKm: 1 });
      const bad = seller({ _id: 'seller-bad', distanceKm: 2, isAcceptingOrders: false });

      const { service } = buildService({
        nearby: [good, bad],
        products: [product({ _id: 'prod-A', sellerId: 'seller-good' })],
        listings: [listing()],
      });

      const result = await service.findEligibleSellers({
        requiredItems: [item({ originSellerId: 'seller-good' })],
        customerLocation: { lat: 28.61, lng: 77.20 },
        marketplaceTab: TAB,
        config: BASE_CONFIG,
      });

      expect(result.eligible.map((e) => e.sellerId)).toEqual(['seller-good']);
      expect(result.rejected[0].failureCode).toBe(FAIL.SELLER_NOT_ACCEPTING);
    });

    it('excludes warehouses from the local-seller pass', async () => {
      const warehouse = seller({ _id: 'wh-1', isWarehouse: true, distanceKm: 0.5 });

      const { service, productRepository } = buildService({ nearby: [warehouse] });

      const result = await service.findEligibleSellers({
        requiredItems: [item()],
        customerLocation: { lat: 28.61, lng: 77.20 },
        marketplaceTab: TAB,
        config: BASE_CONFIG,
      });

      expect(result.eligible).toHaveLength(0);
      // Short-circuits before any product lookup.
      expect(productRepository.find).not.toHaveBeenCalled();
    });

    it('returns empty when the customer has no location', async () => {
      const { service, sellerRepository } = buildService();
      const result = await service.findEligibleSellers({
        requiredItems: [item()],
        customerLocation: { lat: null, lng: null },
        marketplaceTab: TAB,
        config: BASE_CONFIG,
      });

      expect(result.eligible).toHaveLength(0);
      expect(result.failureCode).toBe(FAIL.SELLER_NO_LOCATION);
      expect(sellerRepository.findNearby).not.toHaveBeenCalled();
    });

    it('queries by catalogKey and indexes substitutes when substitution is enabled', async () => {
      const other = seller({ _id: 'seller-2', distanceKm: 1 });
      const substitute = product({ _id: 'prod-A2', sellerId: 'seller-2', catalogKey: 'ATTA-5KG' });

      const { service, productRepository } = buildService({
        nearby: [other],
        products: [substitute],
        listings: [listing({ _id: 'l-A2', productId: 'prod-A2' })],
      });

      const result = await service.findEligibleSellers({
        requiredItems: [item({ productId: 'prod-A', originSellerId: 'seller-1', catalogKey: 'ATTA-5KG' })],
        customerLocation: { lat: 28.61, lng: 77.20 },
        marketplaceTab: TAB,
        config: { ...BASE_CONFIG, crossSellerSubstitutionEnabled: true },
      });

      // A seller who never carted the original product becomes eligible via key.
      expect(result.eligible.map((e) => String(e.sellerId))).toEqual(['seller-2']);

      const query = productRepository.find.mock.calls[0][0];
      expect(query.$or).toEqual(expect.arrayContaining([
        expect.objectContaining({ catalogKey: { $in: ['ATTA-5KG'] } }),
      ]));
    });

    it('does not query by catalogKey when substitution is disabled', async () => {
      const { service, productRepository } = buildService({
        nearby: [seller({ distanceKm: 1 })],
        products: [product()],
        listings: [listing()],
      });

      await service.findEligibleSellers({
        requiredItems: [item({ catalogKey: 'ATTA-5KG' })],
        customerLocation: { lat: 28.61, lng: 77.20 },
        marketplaceTab: TAB,
        config: BASE_CONFIG,
      });

      const query = productRepository.find.mock.calls[0][0];
      expect(JSON.stringify(query)).not.toContain('catalogKey');
    });

    it('returns empty for an empty cart without querying', async () => {
      const { service, sellerRepository } = buildService();
      const result = await service.findEligibleSellers({
        requiredItems: [],
        customerLocation: { lat: 28.61, lng: 77.20 },
        marketplaceTab: TAB,
        config: BASE_CONFIG,
      });

      expect(result.eligible).toHaveLength(0);
      expect(sellerRepository.findNearby).not.toHaveBeenCalled();
    });
  });

  describe('findEligibleWarehouses (fallback level 2)', () => {
    it('evaluates warehouses with the same complete-cart rule', async () => {
      const warehouse = seller({ _id: 'wh-1', isWarehouse: true, latitude: 28.7, longitude: 77.1 });

      const { service } = buildService({
        warehouses: [warehouse],
        products: [product({ _id: 'prod-A', sellerId: 'wh-1' })],
        listings: [listing()],
      });

      const result = await service.findEligibleWarehouses({
        requiredItems: [item({ originSellerId: 'wh-1' })],
        marketplaceTab: TAB,
        config: BASE_CONFIG,
        customerLocation: { lat: 28.61, lng: 77.20 },
      });

      expect(result.eligible).toHaveLength(1);
      expect(result.eligible[0].distanceKm).toEqual(expect.any(Number));
    });

    it('does not radius-limit warehouses', async () => {
      // Far away — a local seller at this distance would be rejected.
      const warehouse = seller({ _id: 'wh-far', isWarehouse: true, latitude: 19.07, longitude: 72.87 });

      const { service } = buildService({
        warehouses: [warehouse],
        products: [product({ _id: 'prod-A', sellerId: 'wh-far' })],
        listings: [listing()],
      });

      const result = await service.findEligibleWarehouses({
        requiredItems: [item({ originSellerId: 'wh-far' })],
        marketplaceTab: TAB,
        config: BASE_CONFIG,
        customerLocation: { lat: 28.61, lng: 77.20 },
      });

      expect(result.eligible).toHaveLength(1);
    });

    it('records why a warehouse was rejected', async () => {
      const warehouse = seller({ _id: 'wh-1', isWarehouse: true });

      const { service } = buildService({
        warehouses: [warehouse],
        products: [product({ _id: 'prod-A', sellerId: 'wh-1', stock: 0 })],
        listings: [listing()],
      });

      const result = await service.findEligibleWarehouses({
        requiredItems: [item({ originSellerId: 'wh-1' })],
        marketplaceTab: TAB,
        config: BASE_CONFIG,
      });

      expect(result.eligible).toHaveLength(0);
      expect(result.rejected[0].failureCode).toBe(FAIL.SELLER_INSUFFICIENT_QUANTITY);
    });

    it('reports a null distance when the customer location is unknown', async () => {
      const warehouse = seller({ _id: 'wh-1', isWarehouse: true });

      const { service } = buildService({
        warehouses: [warehouse],
        products: [product({ _id: 'prod-A', sellerId: 'wh-1' })],
        listings: [listing()],
      });

      const result = await service.findEligibleWarehouses({
        requiredItems: [item({ originSellerId: 'wh-1' })],
        marketplaceTab: TAB,
        config: BASE_CONFIG,
        customerLocation: null,
      });

      expect(result.eligible[0].distanceKm).toBeNull();
    });

    it('returns empty when no warehouse is configured', async () => {
      const { service } = buildService({ warehouses: [] });
      const result = await service.findEligibleWarehouses({
        requiredItems: [item()], marketplaceTab: TAB, config: BASE_CONFIG,
      });
      expect(result.eligible).toHaveLength(0);
    });
  });
});
