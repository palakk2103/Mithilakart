/**
 * E2E Quick Commerce Flow Test
 *
 * Complete pipeline:
 *  1. Seller registered (active, approved, with location)
 *  2. Seller adds quick-commerce product → admin approves
 *  3. User discovers nearby seller products
 *  4. User places order (quick_shop flow)
 *  5. Seller gets notified (order.placed event)
 *  6. Seller confirms → packs
 *  7. Delivery partners nearby are notified
 *  8. Partner accepts, gets pickup OTP
 *  9. Partner confirms pickup (OTP) → order SHIPPED
 * 10. Partner marks out for delivery
 * 11. Partner confirms delivery (OTP) → order DELIVERED
 * 12. Delivery earnings credited
 * 13. Admin can view delivered order
 */

jest.mock('../../src/database', () => ({
  withTransaction: (callback) => callback(null),
}));

const { bootstrapProviders } = require('../../src/core/providers/bootstrapProviders');
const { OrderService } = require('../../src/services/orders/OrderService');
const { DeliveryOrderService } = require('../../src/services/delivery/DeliveryOrderService');
const { SellerProductService } = require('../../src/services/seller/SellerProductService');
const { NearbyService } = require('../../src/services/maps/NearbyService');
const { NotificationService } = require('../../src/services/notifications/NotificationService');
const { eventBus } = require('../../src/events/EventBus');
const {
  ORDER_STATUS,
  PAYMENT_METHOD,
  PAYMENT_STATUS,
} = require('../../src/constants/commerce');
const {
  ASSIGNMENT_STATUS,
  DEFAULT_DELIVERY_EARNING_AMOUNT,
} = require('../../src/constants/delivery');

// ─── helpers ────────────────────────────────────────────────────────────────────

function mockRedis() {
  const store = {};
  return {
    get: jest.fn(async (key) => store[key] ?? null),
    set: jest.fn(async (key, value) => { store[key] = value; }),
    del: jest.fn(async (key) => { delete store[key]; }),
  };
}

function uid(prefix = '') {
  return `${prefix}${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

// ─── build full test context ────────────────────────────────────────────────────

function buildQuickCommerceContext() {
  const sellerId = uid('seller-');
  const userId = uid('user-');
  const partnerId = uid('partner-');
  const productId = uid('product-');
  const categoryId = uid('cat-');
  const orderId = uid('order-');
  const addressId = uid('addr-');

  // ── Seller ──
  const seller = {
    _id: sellerId,
    name: 'Quick Mart',
    storeName: 'Quick Mart',
    email: 'quickmart@test.com',
    status: 'active',
    kycStatus: 'approved',
    latitude: 28.6139,
    longitude: 77.2090,
    city: 'Delhi',
    pincode: '110001',
    location: { type: 'Point', coordinates: [77.2090, 28.6139] },
    quickCommerceEligible: true,
    toObject() { return { ...this }; },
  };

  // ── Product (quick_shop) ──
  const product = {
    _id: productId,
    sellerId,
    title: 'Fresh Milk 500ml',
    sku: 'MILK-500',
    price: 45,
    mrp: 50,
    stock: 100,
    reservedStock: 0,
    status: 'active',
    masterStatus: 'active',
    categoryId,
    commerceFlows: ['quick_shop'],
    images: [{ url: '/img/milk.jpg' }],
    attributes: { serviceableRadius: 10 },
    toObject() { return { ...this }; },
  };

  // ── Delivery Partner ──
  const partner = {
    _id: partnerId,
    name: 'Raju Rider',
    phone: '9876543210',
    status: 'approved',
    isOnline: true,
    latitude: 28.6145,
    longitude: 77.2095,
    location: { type: 'Point', coordinates: [77.2095, 28.6145] },
    balance: 0,
    vehicleType: 'bike',
    toObject() { return { ...this }; },
  };

  // ── In-memory stores ──
  const orders = {};
  const orderItems = {};
  const orderTracking = [];
  const orderStatusHistory = [];
  const assignments = {};
  const earnings = [];
  const notifications = [];
  const sellerNotifications = [];
  const devices = [];
  const eventLog = [];

  // ── Track events ──
  const unsubs = [];
  for (const event of [
    'order.placed', 'order.status_changed', 'delivery.order_available',
    'delivery.otp_created', 'delivery.location_updated', 'order.shipment_created',
  ]) {
    unsubs.push(eventBus.subscribe(event, (e) => eventLog.push({ type: event, payload: e.payload })));
  }

  // ── Repositories ──
  const sellerRepository = {
    findById: jest.fn(async (id) => id === sellerId ? seller : null),
    findNearby: jest.fn(async () => [{ ...seller, distanceKm: 0.5 }]),
    find: jest.fn(async () => [seller]),
  };

  const productRepository = {
    findPublic: jest.fn(async () => [product]),
    countPublic: jest.fn(async () => 1),
    findPublicById: jest.fn(async (id) => id === productId ? product : null),
    find: jest.fn(async () => [product]),
    findBySeller: jest.fn(async () => [product]),
    countBySeller: jest.fn(async () => 1),
    findOne: jest.fn(async ({ _id }) => _id === productId ? product : null),
    findById: jest.fn(async (id) => id === productId ? product : null),
    create: jest.fn(async (data) => ({ ...data, _id: productId })),
    updateById: jest.fn(async (id, patch) => ({ ...product, ...patch })),
    updateStatus: jest.fn(async (id, status) => ({ ...product, status })),
    reserveStock: jest.fn(async () => true),
    decrementStock: jest.fn(async () => true),
    incrementStock: jest.fn(async () => true),
    releaseReservedStock: jest.fn(async () => true),
    getAvailableStock: jest.fn(() => 100),
  };

  const productVariantRepository = {
    findByProductId: jest.fn(async () => []),
  };

  const categoryRepository = {
    findById: jest.fn(async (id) => ({ _id: id, name: 'Dairy', deletedAt: null })),
  };

  const orderRepository = {
    create: jest.fn(async (data) => {
      const o = { _id: orderId, ...data };
      orders[orderId] = o;
      return o;
    }),
    findById: jest.fn(async (id) => orders[id] || null),
    findActiveById: jest.fn(async (id) => orders[id] || null),
    findByIdempotencyKey: jest.fn().mockResolvedValue(null),
    findUnpaidPendingByUser: jest.fn().mockResolvedValue([]),
    updateById: jest.fn(async (id, patch) => {
      if (orders[id]) orders[id] = { ...orders[id], ...patch };
      return orders[id];
    }),
    updateStatus: jest.fn(async (id, status) => {
      if (orders[id]) orders[id].status = status;
      return orders[id];
    }),
    updateStatusOptimistic: jest.fn(async (id, fromStatus, toStatus) => {
      if (orders[id]?.status === fromStatus) {
        orders[id].status = toStatus;
        return orders[id];
      }
      return null;
    }),
    findOne: jest.fn(async (filter) => {
      if (filter._id && orders[filter._id]) return orders[filter._id];
      return null;
    }),
    find: jest.fn(async (filter) => Object.values(orders).filter((o) => {
      if (filter._id?.$in && !filter._id.$in.includes(o._id)) return false;
      return true;
    })),
    count: jest.fn(async () => Object.keys(orders).length),
  };

  const orderItemRepository = {
    listByOrderId: jest.fn(async () => [
      { productId, quantity: 1, sellerId, unitPrice: 45, _id: uid('oi-') },
    ]),
    createMany: jest.fn(async () => true),
    find: jest.fn(async () => [{ productId, quantity: 1, sellerId, orderId }]),
    exists: jest.fn(async () => true),
    listDistinctOrderIdsBySeller: jest.fn(async () => [orderId]),
    countDistinctOrdersBySeller: jest.fn(async () => 1),
  };

  const orderTrackingRepository = {
    createInitial: jest.fn(async (oid, status, note) => {
      orderTracking.push({ orderId: oid, status, note, createdAt: new Date() });
      return true;
    }),
    find: jest.fn(async () => orderTracking),
    listByOrderId: jest.fn(async () => orderTracking),
  };

  const orderStatusHistoryRepository = {
    addTransition: jest.fn(async (data) => {
      orderStatusHistory.push(data);
      return true;
    }),
    listByOrderId: jest.fn(async () => orderStatusHistory),
  };

  const deliveryAssignmentRepository = {
    findByOrderId: jest.fn(async (oid) => assignments[oid] || null),
    create: jest.fn(async (data) => {
      const a = { _id: uid('da-'), ...data };
      assignments[data.orderId] = a;
      return a;
    }),
    findAvailable: jest.fn(async () => Object.values(assignments).filter((a) => a.status === 'pending')),
    findByPartner: jest.fn(async (pid) => Object.values(assignments).filter((a) => a.partnerId === pid)),
    countByPartner: jest.fn(async (pid, filter = {}) => {
      return Object.values(assignments).filter((a) => {
        if (a.partnerId !== pid) return false;
        if (filter.status?.$in) return filter.status.$in.includes(a.status);
        if (filter.status) return a.status === filter.status;
        return true;
      }).length;
    }),
    acceptByOrderId: jest.fn(async (oid, pid) => {
      const a = assignments[oid];
      if (!a || a.partnerId) return null;
      a.partnerId = pid;
      a.status = ASSIGNMENT_STATUS.ACCEPTED;
      a.acceptedAt = new Date();
      return a;
    }),
    updateById: jest.fn(async (id, patch) => {
      for (const [oid, a] of Object.entries(assignments)) {
        if (a._id === id) {
          Object.assign(a, patch);
          return a;
        }
      }
      return null;
    }),
  };

  const deliveryPartnerRepository = {
    findById: jest.fn(async (id) => id === partnerId ? { ...partner, balance: partner.balance } : null),
    findNearbyOnline: jest.fn(async () => [partner]),
    list: jest.fn(async () => [partner]),
    find: jest.fn(async () => [partner]),
    updateById: jest.fn(async (id, patch) => {
      if (id === partnerId) Object.assign(partner, patch);
      return partner;
    }),
    model: {
      findByIdAndUpdate: jest.fn(async (id, update) => {
        if (id === partnerId && update.$inc?.balance) {
          partner.balance += update.$inc.balance;
        }
        return partner;
      }),
    },
  };

  const deliveryEarningRepository = {
    create: jest.fn(async (data) => {
      const e = { _id: uid('earn-'), ...data };
      earnings.push(e);
      return e;
    }),
    sumByPartner: jest.fn(async () => earnings.reduce((s, e) => s + e.amount, 0)),
    findByPartner: jest.fn(async () => earnings),
    count: jest.fn(async () => earnings.length),
  };

  const userRepository = {
    findById: jest.fn(async () => ({ _id: userId, phone: '9999999999', locale: 'en', notificationPreferences: {} })),
    find: jest.fn(async () => []),
    updateById: jest.fn(async () => ({})),
  };

  const userDeviceRepository = {
    find: jest.fn(async () => devices),
    upsertDevice: jest.fn(async (data) => { devices.push(data); return data; }),
    updateById: jest.fn(async () => ({})),
  };

  const userAddressRepository = {
    findOne: jest.fn(async () => ({
      _id: addressId,
      userId,
      name: 'Test User',
      phone: '9999999999',
      addressLine: 'Test Address',
      city: 'Delhi',
      state: 'Delhi',
      pincode: '110001',
      latitude: 28.6139,
      longitude: 77.2090,
    })),
    updateById: jest.fn(async () => ({})),
  };

  const userNotificationRepository = {
    create: jest.fn(async (data) => { notifications.push(data); return data; }),
    findByUser: jest.fn(async () => notifications),
    countUnread: jest.fn(async () => notifications.length),
    markAllRead: jest.fn(async () => true),
  };

  const notificationTemplateRepository = {
    findByKeyAndLocale: jest.fn(async () => null),
    find: jest.fn(async () => []),
  };

  const sellerNotificationRepository = {
    create: jest.fn(async (data) => { sellerNotifications.push(data); return data; }),
  };

  const marketplaceListingRepository = null; // not used in direct product flow
  const cartRepository = {};
  const cartItemRepository = {};

  const redisClient = mockRedis();

  // ── Build services ──
  bootstrapProviders();

  const geocodingService = {
    isEnabled: () => false,
    reverseGeocode: jest.fn(async () => null),
    geocodeAddress: jest.fn(async () => null),
  };

  const cacheService = { get: jest.fn(), set: jest.fn(), del: jest.fn() };

  const { DeliveryOtpService } = require('../../src/services/delivery/DeliveryOtpService');
  const deliveryOtpService = new DeliveryOtpService({ redisClient });

  const deliveryOrderService = new DeliveryOrderService({
    deliveryAssignmentRepository,
    deliveryPartnerRepository,
    deliveryEarningRepository,
    deliveryOtpService,
    orderRepository,
    orderItemRepository,
    sellerRepository,
    orderTrackingRepository,
    orderStatusHistoryRepository,
    userDeviceRepository,
  });

  const cartService = {
    getCart: jest.fn(async () => ({
      items: [{ productId, sellerId, quantity: 1, unitPrice: 45, marketplaceTab: 'quick_shop' }],
      subtotal: 45,
      total: 45,
      marketplaceTab: 'quick_shop',
    })),
    persistCartSnapshot: jest.fn(),
    clearCart: jest.fn(),
  };

  const pricingService = {
    buildSellerSubOrders: jest.fn(() => [{ sellerId, items: [], subtotal: 45, status: ORDER_STATUS.PENDING }]),
    calculateTotals: jest.fn(async () => ({ subtotal: 45, total: 45, tax: 0, deliveryCharge: 0 })),
  };

  const paymentService = {
    initiatePayment: jest.fn(async () => ({ paymentStatus: PAYMENT_STATUS.PAID })),
  };

  const couponService = {};

  const orderService = new OrderService({
    cartService,
    productRepository,
    orderRepository,
    orderItemRepository,
    orderTrackingRepository,
    orderStatusHistoryRepository,
    paymentService,
    pricingService,
    couponService,
    cartRepository,
    cartItemRepository,
    userAddressRepository,
    geocodingService,
    courierShipmentService: null,
  });
  orderService.setDeliveryOrderService(deliveryOrderService);

  const nearbyService = new NearbyService({
    sellerRepository,
    productRepository,
    marketplaceListingRepository,
    geocodingService,
  });

  const sellerProductService = new SellerProductService({
    productRepository,
    productVariantRepository,
    categoryRepository,
    cacheService,
    sellerRepository,
  });

  const notificationService = new NotificationService({
    userNotificationRepository,
    notificationTemplateRepository,
    userRepository,
    userDeviceRepository,
    deliveryPartnerRepository,
    sellerNotificationRepository,
  });

  return {
    // IDs
    sellerId, userId, partnerId, productId, orderId, categoryId,
    // Services
    orderService, deliveryOrderService, nearbyService, sellerProductService, notificationService,
    deliveryOtpService, redisClient,
    // Stores
    orders, assignments, earnings, notifications, sellerNotifications, eventLog, orderTracking,
    orderStatusHistory,
    // Repos
    orderRepository, orderItemRepository, sellerRepository, productRepository,
    deliveryAssignmentRepository, deliveryPartnerRepository, deliveryEarningRepository,
    // Cleanup
    cleanup: () => unsubs.forEach((un) => un()),
  };
}

// ─── tests ──────────────────────────────────────────────────────────────────────

describe('E2E Quick Commerce — Full Pipeline', () => {
  let ctx;

  beforeEach(() => {
    ctx = buildQuickCommerceContext();
  });

  afterEach(() => {
    ctx.cleanup();
    jest.clearAllMocks();
  });

  it('1. Seller creates a quick-commerce product', async () => {
    const product = await ctx.sellerProductService.create(ctx.sellerId, {
      title: 'Fresh Milk',
      sku: `SKU-${Date.now()}`,
      price: 45,
      mrp: 50,
      stock: 100,
      categoryId: ctx.categoryId,
      commerceFlows: ['quick_shop'],
    });

    expect(product._id).toBe(ctx.productId);
    expect(product.commerceFlows).toContain('quick_shop');
    expect(product.status).toBe('approved'); // auto-approved because seller is approved
  });

  it('2. Nearby products endpoint returns seller products in range', async () => {
    const result = await ctx.nearbyService.nearbyProducts({
      lat: 28.615,
      lng: 77.210,
      radiusKm: 10,
      commerceFlow: 'quick_shop',
    });

    expect(result.sellerCount).toBeGreaterThanOrEqual(1);
    expect(result.items.length).toBeGreaterThanOrEqual(1);
    expect(result.deliverable).toBe(true);
  });

  it('3. User places quick-commerce order → payment auto-confirms → local delivery', async () => {
    const result = await ctx.orderService.placeOrder({
      userId: ctx.userId,
      addressId: 'addr-1',
      paymentMethod: PAYMENT_METHOD.UPI,
      commerceFlow: 'quick_shop',
    });

    expect(result.orderNumber).toMatch(/^MK-/);
    expect(result.paymentStatus).toBe(PAYMENT_STATUS.PAID);

    // Order should be PLACED after payment confirm
    const order = ctx.orders[ctx.orderId];
    expect(order.status).toBe(ORDER_STATUS.PLACED);
    expect(order.fulfilmentType).toBe('local_delivery');
  });

  it('4. Seller gets notified of new order via event', async () => {
    await ctx.orderService.placeOrder({
      userId: ctx.userId,
      addressId: 'addr-1',
      paymentMethod: PAYMENT_METHOD.UPI,
      commerceFlow: 'quick_shop',
    });

    const placedEvents = ctx.eventLog.filter((e) => e.type === 'order.placed');
    expect(placedEvents.length).toBeGreaterThanOrEqual(1);
    expect(placedEvents[0].payload.sellerId).toBe(ctx.sellerId);
  });

  it('5. Seller confirms → packs order', async () => {
    // Setup: place and confirm order
    await ctx.orderService.placeOrder({
      userId: ctx.userId,
      addressId: 'addr-1',
      paymentMethod: PAYMENT_METHOD.UPI,
      commerceFlow: 'quick_shop',
    });

    // Seller confirms
    let result = await ctx.orderService.updateStatusAsSeller({
      orderId: ctx.orderId,
      sellerId: ctx.sellerId,
      toStatus: ORDER_STATUS.CONFIRMED,
    });
    expect(result.status).toBe(ORDER_STATUS.CONFIRMED);

    // Seller packs
    result = await ctx.orderService.updateStatusAsSeller({
      orderId: ctx.orderId,
      sellerId: ctx.sellerId,
      toStatus: ORDER_STATUS.PACKED,
    });
    expect(result.status).toBe(ORDER_STATUS.PACKED);
  });

  it('6. Delivery partners are notified when order is packed', async () => {
    await ctx.orderService.placeOrder({
      userId: ctx.userId,
      addressId: 'addr-1',
      paymentMethod: PAYMENT_METHOD.UPI,
      commerceFlow: 'quick_shop',
    });

    await ctx.orderService.updateStatusAsSeller({
      orderId: ctx.orderId,
      sellerId: ctx.sellerId,
      toStatus: ORDER_STATUS.CONFIRMED,
    });

    ctx.eventLog.length = 0; // clear previous events
    await ctx.orderService.updateStatusAsSeller({
      orderId: ctx.orderId,
      sellerId: ctx.sellerId,
      toStatus: ORDER_STATUS.PACKED,
    });

    // delivery.order_available should have been emitted
    const deliveryEvents = ctx.eventLog.filter((e) => e.type === 'delivery.order_available');
    expect(deliveryEvents.length).toBeGreaterThanOrEqual(1);
  });

  it('7. Delivery partner accepts order and gets pickup OTP', async () => {
    // Setup full flow
    await ctx.orderService.placeOrder({
      userId: ctx.userId,
      addressId: 'addr-1',
      paymentMethod: PAYMENT_METHOD.UPI,
      commerceFlow: 'quick_shop',
    });

    await ctx.orderService.updateStatusAsSeller({
      orderId: ctx.orderId,
      sellerId: ctx.sellerId,
      toStatus: ORDER_STATUS.CONFIRMED,
    });
    await ctx.orderService.updateStatusAsSeller({
      orderId: ctx.orderId,
      sellerId: ctx.sellerId,
      toStatus: ORDER_STATUS.PACKED,
    });

    const acceptResult = await ctx.deliveryOrderService.acceptOrder(ctx.partnerId, ctx.orderId);
    expect(acceptResult.assignment.status).toBe(ASSIGNMENT_STATUS.ACCEPTED);
    expect(acceptResult.pickupOtp).toMatch(/^\d{4,6}$/);
  });

  it('8. Delivery partner confirms pickup → order SHIPPED', async () => {
    await ctx.orderService.placeOrder({
      userId: ctx.userId,
      addressId: 'addr-1',
      paymentMethod: PAYMENT_METHOD.UPI,
      commerceFlow: 'quick_shop',
    });

    await ctx.orderService.updateStatusAsSeller({
      orderId: ctx.orderId,
      sellerId: ctx.sellerId,
      toStatus: ORDER_STATUS.CONFIRMED,
    });
    await ctx.orderService.updateStatusAsSeller({
      orderId: ctx.orderId,
      sellerId: ctx.sellerId,
      toStatus: ORDER_STATUS.PACKED,
    });

    const { pickupOtp } = await ctx.deliveryOrderService.acceptOrder(ctx.partnerId, ctx.orderId);

    const pickupResult = await ctx.deliveryOrderService.confirmPickup(ctx.partnerId, ctx.orderId, pickupOtp);
    expect(pickupResult.status).toBe(ASSIGNMENT_STATUS.PICKED_UP);
    expect(pickupResult.deliveryOtp).toMatch(/^\d{4,6}$/);

    expect(ctx.orders[ctx.orderId].status).toBe(ORDER_STATUS.SHIPPED);
  });

  it('9. Full flow: pickup → out for delivery → delivery → DELIVERED with earnings', async () => {
    await ctx.orderService.placeOrder({
      userId: ctx.userId,
      addressId: 'addr-1',
      paymentMethod: PAYMENT_METHOD.UPI,
      commerceFlow: 'quick_shop',
    });

    await ctx.orderService.updateStatusAsSeller({
      orderId: ctx.orderId,
      sellerId: ctx.sellerId,
      toStatus: ORDER_STATUS.CONFIRMED,
    });
    await ctx.orderService.updateStatusAsSeller({
      orderId: ctx.orderId,
      sellerId: ctx.sellerId,
      toStatus: ORDER_STATUS.PACKED,
    });

    const { pickupOtp } = await ctx.deliveryOrderService.acceptOrder(ctx.partnerId, ctx.orderId);
    const { deliveryOtp } = await ctx.deliveryOrderService.confirmPickup(ctx.partnerId, ctx.orderId, pickupOtp);

    // Mark out for delivery
    await ctx.deliveryOrderService.markOutForDelivery(ctx.partnerId, ctx.orderId);
    expect(ctx.orders[ctx.orderId].status).toBe(ORDER_STATUS.OUT_FOR_DELIVERY);

    // Confirm delivery
    const result = await ctx.deliveryOrderService.confirmDelivery(ctx.partnerId, ctx.orderId, deliveryOtp);
    expect(result.status).toBe(ASSIGNMENT_STATUS.DELIVERED);

    // Order should be delivered
    expect(ctx.orders[ctx.orderId].status).toBe(ORDER_STATUS.DELIVERED);

    // Earnings credited
    expect(result.earning.amount).toBe(DEFAULT_DELIVERY_EARNING_AMOUNT);
    expect(ctx.earnings.length).toBe(1);
    expect(ctx.earnings[0].status).toBe('credited');
  });

  it('10. Admin can view delivered order', async () => {
    await ctx.orderService.placeOrder({
      userId: ctx.userId,
      addressId: 'addr-1',
      paymentMethod: PAYMENT_METHOD.UPI,
      commerceFlow: 'quick_shop',
    });

    ctx.orders[ctx.orderId].status = ORDER_STATUS.DELIVERED;

    const detail = await ctx.orderService.getOrderDetailForAdmin(ctx.orderId);
    expect(detail.order.status).toBe(ORDER_STATUS.DELIVERED);
    expect(detail.items.length).toBeGreaterThanOrEqual(1);
  });

  it('11. OUT_FOR_DELIVERY notification emitted when auto-transitioning in confirmDelivery', async () => {
    await ctx.orderService.placeOrder({
      userId: ctx.userId,
      addressId: 'addr-1',
      paymentMethod: PAYMENT_METHOD.UPI,
      commerceFlow: 'quick_shop',
    });

    await ctx.orderService.updateStatusAsSeller({
      orderId: ctx.orderId,
      sellerId: ctx.sellerId,
      toStatus: ORDER_STATUS.CONFIRMED,
    });
    await ctx.orderService.updateStatusAsSeller({
      orderId: ctx.orderId,
      sellerId: ctx.sellerId,
      toStatus: ORDER_STATUS.PACKED,
    });

    const { pickupOtp } = await ctx.deliveryOrderService.acceptOrder(ctx.partnerId, ctx.orderId);
    const { deliveryOtp } = await ctx.deliveryOrderService.confirmPickup(ctx.partnerId, ctx.orderId, pickupOtp);

    // Skip markOutForDelivery — go directly to confirmDelivery
    ctx.eventLog.length = 0;
    await ctx.deliveryOrderService.confirmDelivery(ctx.partnerId, ctx.orderId, deliveryOtp);

    // Should have emitted OUT_FOR_DELIVERY before DELIVERED
    const statusEvents = ctx.eventLog
      .filter((e) => e.type === 'order.status_changed')
      .map((e) => e.payload.status);

    expect(statusEvents).toContain(ORDER_STATUS.OUT_FOR_DELIVERY);
    expect(statusEvents).toContain(ORDER_STATUS.DELIVERED);
  });

  it('12. Delivery partner can update location', async () => {
    const result = await ctx.deliveryOrderService.updateLocation(ctx.partnerId, {
      latitude: 28.6200,
      longitude: 77.2100,
    });

    expect(ctx.deliveryPartnerRepository.updateById).toHaveBeenCalledWith(
      ctx.partnerId,
      expect.objectContaining({ latitude: 28.62, longitude: 77.21 })
    );
  });
});
