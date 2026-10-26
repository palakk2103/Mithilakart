/**
 * CR-002 fulfillment test harness.
 *
 * Wires the REAL eligibility, ranking, reservation, config, routing and engine
 * services against in-memory repositories. Only persistence is faked, so the
 * business logic under test is genuinely the shipped logic.
 *
 * The product store reproduces MongoDB's single-document conditional-update
 * semantics for reserveStock, which is what makes the concurrency assertions
 * meaningful rather than decorative.
 */
const { FulfillmentConfigService } = require('../../src/services/fulfillment/FulfillmentConfigService');
const { SellerEligibilityService } = require('../../src/services/fulfillment/SellerEligibilityService');
const { SellerRankingService } = require('../../src/services/fulfillment/SellerRankingService');
const { FulfillmentReservationService } = require('../../src/services/fulfillment/FulfillmentReservationService');
const { FulfillmentEngineService } = require('../../src/services/fulfillment/FulfillmentEngineService');
const { RoutingService } = require('../../src/services/maps/RoutingService');
const { AppError } = require('../../src/utils/AppError');
const { DEFAULT_PLATFORM_SETTINGS } = require('../../src/constants/platformSettings');
const { haversineKm } = require('../../src/utils/geoHelper');

let seq = 0;
const nextId = (prefix) => `${prefix}-${++seq}`;

function clone(doc) {
  return doc == null ? doc : JSON.parse(JSON.stringify(doc));
}

/** Naive but sufficient subset of the Mongo query operators the code uses. */
function matches(doc, filter) {
  for (const [key, condition] of Object.entries(filter)) {
    if (key === '$or') {
      if (!condition.some((sub) => matches(doc, sub))) return false;
      continue;
    }

    const value = key.split('.').reduce((acc, part) => (acc == null ? acc : acc[part]), doc);

    if (condition && typeof condition === 'object' && !Array.isArray(condition)) {
      if ('$in' in condition) {
        if (!condition.$in.map(String).includes(String(value))) return false;
        continue;
      }
      if ('$ne' in condition) {
        if (String(value) === String(condition.$ne)) return false;
        continue;
      }
      if ('$lt' in condition) {
        if (!(value != null && new Date(value) < new Date(condition.$lt))) return false;
        continue;
      }
      if ('$type' in condition) {
        if (typeof value !== 'string') return false;
        continue;
      }
      continue;
    }

    if (condition === null) {
      if (value !== null && value !== undefined) return false;
      continue;
    }

    if (String(value) !== String(condition)) return false;
  }

  return true;
}

function createHarness({ platformSettings = {}, tabConfig = null } = {}) {
  const db = {
    sellers: new Map(),
    products: new Map(),
    listings: new Map(),
    orders: new Map(),
    orderItems: [],
    fulfillments: new Map(),
    attempts: new Map(),
  };

  // ── repositories ──────────────────────────────────────────────────────────

  const productRepository = {
    find: jest.fn(async (filter) => [...db.products.values()].filter((p) => matches(p, filter))),

    // Mirrors the real conditional update: compare and increment with no await
    // between, so two concurrent callers cannot both take the last unit.
    reserveStock: jest.fn(async (productId, quantity) => {
      const product = db.products.get(String(productId));
      if (!product || product.deletedAt) throw AppError.outOfStock('Insufficient stock');
      if ((product.stock - product.reservedStock) < quantity) {
        throw AppError.outOfStock('Insufficient stock');
      }
      product.reservedStock += quantity;
      return { matchedCount: 1 };
    }),

    releaseReservedStock: jest.fn(async (productId, quantity) => {
      const product = db.products.get(String(productId));
      if (!product || product.reservedStock < quantity) return { matchedCount: 0 };
      product.reservedStock -= quantity;
      return { matchedCount: 1 };
    }),

    decrementStock: jest.fn(async (productId, quantity) => {
      const product = db.products.get(String(productId));
      if (!product || product.stock < quantity) throw AppError.outOfStock('Insufficient stock');
      product.stock -= quantity;
      product.reservedStock = Math.max(0, product.reservedStock - quantity);
      return { matchedCount: 1 };
    }),
  };

  const sellerRepository = {
    findById: jest.fn(async (id) => db.sellers.get(String(id)) || null),
    find: jest.fn(async (filter) => [...db.sellers.values()].filter((s) => matches(s, filter))),
    findNearby: jest.fn(async ({ latitude, longitude, radiusKm }) => [...db.sellers.values()]
      .filter((s) => s.status === 'active' && s.kycStatus === 'approved' && !s.deletedAt)
      .filter((s) => s.latitude != null && s.longitude != null)
      .map((s) => ({ ...s, distanceKm: haversineKm(latitude, longitude, s.latitude, s.longitude) }))
      .filter((s) => s.distanceKm <= radiusKm)
      .sort((a, b) => a.distanceKm - b.distanceKm)),
  };

  const marketplaceListingRepository = {
    findPublic: jest.fn(async (filter) => [...db.listings.values()]
      .filter((l) => l.listingStatus === 'approved' && l.isVisible !== false && !l.deletedAt)
      .filter((l) => matches(l, filter))),
  };

  const orderRepository = {
    findById: jest.fn(async (id) => db.orders.get(String(id)) || null),
    find: jest.fn(async (filter) => [...db.orders.values()].filter((o) => matches(o, filter))),
    updateById: jest.fn(async (id, data) => {
      const order = db.orders.get(String(id));
      if (!order) return null;
      Object.assign(order, data);
      return order;
    }),
    count: jest.fn(async (filter) => [...db.orders.values()].filter((o) => matches(o, filter)).length),
  };

  const orderItemRepository = {
    listByOrderId: jest.fn(async (orderId) => db.orderItems.filter((it) => String(it.orderId) === String(orderId))),
  };

  const orderFulfillmentRepository = {
    findById: jest.fn(async (id) => db.fulfillments.get(String(id)) || null),
    findByOrderId: jest.fn(async (orderId) => [...db.fulfillments.values()]
      .find((f) => String(f.orderId) === String(orderId)) || null),

    createIfAbsent: jest.fn(async (data) => {
      const existing = [...db.fulfillments.values()].find((f) => String(f.orderId) === String(data.orderId));
      if (existing) return { fulfillment: existing, created: false };

      const doc = {
        _id: nextId('ful'),
        attemptCount: 0,
        fallbackLevel: 0,
        excludedSellerIds: [],
        currentAttemptId: null,
        resolvedSellerId: null,
        failureCode: null,
        ...data,
      };
      db.fulfillments.set(doc._id, doc);
      return { fulfillment: doc, created: true };
    }),

    // Compare-and-set, exactly as the real repository does.
    transitionState: jest.fn(async (id, expectedState, toState, extra = {}) => {
      const { isValidFulfillmentTransition } = require('../../src/constants/fulfillment');
      if (!isValidFulfillmentTransition(expectedState, toState)) return null;

      const doc = db.fulfillments.get(String(id));
      if (!doc || doc.state !== expectedState) return null;

      Object.assign(doc, extra, { state: toState });
      return doc;
    }),

    addExcludedSeller: jest.fn(async (id, sellerId) => {
      const doc = db.fulfillments.get(String(id));
      if (!doc) return null;
      if (!doc.excludedSellerIds.map(String).includes(String(sellerId))) {
        doc.excludedSellerIds.push(sellerId);
      }
      return doc;
    }),

    incrementAttemptCount: jest.fn(async (id) => {
      const doc = db.fulfillments.get(String(id));
      if (!doc) return null;
      doc.attemptCount += 1;
      return doc;
    }),

    findExpiredAcceptances: jest.fn(async (now = new Date()) => [...db.fulfillments.values()]
      .filter((f) => f.state === 'seller_assigned' && f.acceptanceDeadlineAt && f.acceptanceDeadlineAt < now)),

    findExpiredSearches: jest.fn(async (now = new Date()) => [...db.fulfillments.values()]
      .filter((f) => f.state === 'searching' && f.searchDeadlineAt && f.searchDeadlineAt < now)),
  };

  const fulfillmentAttemptRepository = {
    findById: jest.fn(async (id) => db.attempts.get(String(id)) || null),

    create: jest.fn(async (data) => {
      const doc = { _id: nextId('att'), reservations: [], ...data };
      db.attempts.set(doc._id, doc);
      return doc;
    }),

    updateById: jest.fn(async (id, data) => {
      const doc = db.attempts.get(String(id));
      if (!doc) throw AppError.notFound('Attempt not found');
      Object.assign(doc, data);
      return doc;
    }),

    transitionStatus: jest.fn(async (id, expectedStatus, toStatus, extra = {}) => {
      const doc = db.attempts.get(String(id));
      if (!doc || doc.status !== expectedStatus) return null;
      Object.assign(doc, extra, { status: toStatus });
      return doc;
    }),

    markReservationsReleased: jest.fn(async (id) => {
      const doc = db.attempts.get(String(id));
      if (!doc) return { matchedCount: 0 };
      for (const entry of doc.reservations || []) {
        if (!entry.releasedAt) entry.releasedAt = new Date();
      }
      return { matchedCount: 1 };
    }),

    listByFulfillment: jest.fn(async (fulfillmentId) => [...db.attempts.values()]
      .filter((a) => String(a.fulfillmentId) === String(fulfillmentId))
      .sort((a, b) => a.attemptNumber - b.attemptNumber)),

    listByOrderId: jest.fn(async (orderId) => [...db.attempts.values()]
      .filter((a) => String(a.orderId) === String(orderId))
      .sort((a, b) => a.attemptNumber - b.attemptNumber)),

    findCurrentOffer: jest.fn(async (sellerId, orderId) => [...db.attempts.values()]
      .find((a) => String(a.sellerId) === String(sellerId)
        && String(a.orderId) === String(orderId)
        && a.status === 'offered') || null),

    listPendingOffersForSeller: jest.fn(async (sellerId) => [...db.attempts.values()]
      .filter((a) => String(a.sellerId) === String(sellerId) && a.status === 'offered')
      .sort((a, b) => b.attemptNumber - a.attemptNumber)),

    nextAttemptNumber: jest.fn(async (fulfillmentId) => {
      const existing = [...db.attempts.values()]
        .filter((a) => String(a.fulfillmentId) === String(fulfillmentId));
      return existing.reduce((max, a) => Math.max(max, a.attemptNumber), 0) + 1;
    }),
  };

  const marketplaceConfigRepository = { findByTab: jest.fn(async () => tabConfig) };

  const platformConfigService = {
    getConfig: jest.fn(async () => ({ ...DEFAULT_PLATFORM_SETTINGS, ...platformSettings })),
  };

  const courierShipmentService = {
    createForOrder: jest.fn(async () => ({ provider: 'shiprocket', awb: 'AWB-TEST-1', shipmentId: 'SH-1' })),
  };

  // ── real services ─────────────────────────────────────────────────────────

  const configService = new FulfillmentConfigService({ platformConfigService, marketplaceConfigRepository });
  const eligibilityService = new SellerEligibilityService({
    sellerRepository, productRepository, marketplaceListingRepository,
  });
  const routingService = new RoutingService();
  const rankingService = new SellerRankingService({
    routingService, orderRepository, fulfillmentConfigService: configService,
  });
  const reservationService = new FulfillmentReservationService({
    productRepository, fulfillmentAttemptRepository,
  });

  const engine = new FulfillmentEngineService({
    orderRepository,
    orderItemRepository,
    orderFulfillmentRepository,
    fulfillmentAttemptRepository,
    sellerEligibilityService: eligibilityService,
    sellerRankingService: rankingService,
    fulfillmentReservationService: reservationService,
    fulfillmentConfigService: configService,
    routingService,
    sellerRepository,
    productRepository,
    marketplaceConfigRepository,
    courierShipmentService,
  });

  // ── fixture builders ──────────────────────────────────────────────────────

  const api = {
    db,
    engine,
    configService,
    eligibilityService,
    rankingService,
    reservationService,
    routingService,
    repos: {
      productRepository,
      sellerRepository,
      marketplaceListingRepository,
      orderRepository,
      orderItemRepository,
      orderFulfillmentRepository,
      fulfillmentAttemptRepository,
      marketplaceConfigRepository,
    },
    courierShipmentService,

    addSeller(overrides = {}) {
      const seller = {
        _id: overrides._id || nextId('seller'),
        status: 'active',
        kycStatus: 'approved',
        isAcceptingOrders: true,
        isWarehouse: false,
        quickCommerceEligible: true,
        groceryEligible: true,
        mithilakEligible: true,
        latitude: 28.6139,
        longitude: 77.2090,
        preparationTimeMinutes: null,
        fulfillmentRadiusKm: null,
        pincode: '110001',
        deletedAt: null,
        ...overrides,
      };
      db.sellers.set(String(seller._id), seller);
      return seller;
    },

    /** Adds a product plus its approved, visible listing for the tab. */
    addProduct(sellerId, overrides = {}) {
      const product = {
        _id: overrides._id || nextId('prod'),
        sellerId,
        stock: 10,
        reservedStock: 0,
        catalogKey: null,
        deletedAt: null,
        ...overrides,
      };
      db.products.set(String(product._id), product);

      const listing = {
        _id: nextId('listing'),
        productId: product._id,
        sellerId,
        marketplaceTab: overrides.marketplaceTab || 'quick_shop',
        price: overrides.price ?? 100,
        listingStatus: overrides.listingStatus || 'approved',
        isVisible: overrides.isVisible !== false,
        maxOrderQuantity: overrides.maxOrderQuantity ?? null,
        deletedAt: null,
      };
      db.listings.set(String(listing._id), listing);

      return { product, listing };
    },

    addOrder({ items, marketplaceTab = 'quick_shop', ...overrides } = {}) {
      const order = {
        _id: overrides._id || nextId('order'),
        userId: nextId('user'),
        orderNumber: `MK-${nextId('n')}`,
        status: 'placed',
        marketplaceTab,
        paymentStatus: 'paid',
        addressSnapshot: { lat: 28.6139, lng: 77.2090, pincode: '110001' },
        deliveryPromiseMinutes: null,
        ...overrides,
      };
      db.orders.set(String(order._id), order);

      for (const item of items || []) {
        db.orderItems.push({
          _id: nextId('oi'),
          orderId: order._id,
          sellerId: item.sellerId,
          productId: item.productId,
          quantity: item.quantity ?? 1,
          unitPrice: item.unitPrice ?? 100,
          variantId: null,
        });
      }

      return order;
    },

    stockOf(productId) {
      const product = db.products.get(String(productId));
      return { stock: product.stock, reservedStock: product.reservedStock };
    },

    fulfillmentFor(orderId) {
      return [...db.fulfillments.values()].find((f) => String(f.orderId) === String(orderId)) || null;
    },

    attemptsFor(orderId) {
      return [...db.attempts.values()]
        .filter((a) => String(a.orderId) === String(orderId))
        .sort((a, b) => a.attemptNumber - b.attemptNumber);
    },

    currentOffer(orderId) {
      return api.attemptsFor(orderId).find((a) => a.status === 'offered') || null;
    },

    /** Asserts the global inventory invariants CR-002 must never violate. */
    assertInventorySane() {
      for (const product of db.products.values()) {
        expect(product.stock).toBeGreaterThanOrEqual(0);
        expect(product.reservedStock).toBeGreaterThanOrEqual(0);
        expect(product.reservedStock).toBeLessThanOrEqual(product.stock);
      }
    },

    totalReserved() {
      return [...db.products.values()].reduce((sum, p) => sum + p.reservedStock, 0);
    },

    clone,
  };

  return api;
}

module.exports = { createHarness };
