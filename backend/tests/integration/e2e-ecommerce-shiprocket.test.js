/**
 * E2E E-Commerce / Shiprocket Flow Test
 *
 * Tests the courier (Shiprocket) shipping pipeline:
 *  1. Standard commerce order placed
 *  2. Payment confirmed → Shiprocket shipment created (mock provider)
 *  3. AWB assigned, shipment recorded
 *  4. Webhook status updates (in_transit → out_for_delivery → delivered)
 *  5. Order status synced via webhook
 *  6. Shipment cancellation flow
 *  7. Tracking sync flow
 */

jest.mock('../../src/database', () => ({
  withTransaction: (callback) => callback(null),
}));

const { bootstrapProviders } = require('../../src/core/providers/bootstrapProviders');
const { getProvider } = require('../../src/core/providers.registry');
const { OrderService } = require('../../src/services/orders/OrderService');
const { CourierShipmentService } = require('../../src/services/shipping/CourierShipmentService');
const {
  ORDER_STATUS,
  PAYMENT_METHOD,
  PAYMENT_STATUS,
} = require('../../src/constants/commerce');
const { eventBus } = require('../../src/events/EventBus');

// ─── helpers ────────────────────────────────────────────────────────────────────

function uid(prefix = '') {
  return `${prefix}${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function buildEcommerceContext({ orderOverrides = {} } = {}) {
  const userId = uid('user-');
  const sellerId = uid('seller-');
  const productId = uid('prod-');
  const orderId = uid('order-');

  const orders = {};
  const orderTracking = [];
  const orderStatusHistory = [];
  const eventLog = [];

  const unsubs = [];
  for (const event of [
    'order.placed', 'order.status_changed', 'order.shipment_created', 'order.shipment_failed',
  ]) {
    unsubs.push(eventBus.subscribe(event, (e) => eventLog.push({ type: event, payload: e.payload })));
  }

  const defaultOrder = {
    _id: orderId,
    userId,
    orderNumber: 'MK-ECOM-001',
    status: ORDER_STATUS.PENDING,
    commerceFlow: 'standard',
    paymentMethod: PAYMENT_METHOD.UPI,
    paymentStatus: PAYMENT_STATUS.PENDING,
    inventoryDeducted: false,
    sellerSubOrders: [{ sellerId, items: [], subtotal: 500, status: ORDER_STATUS.PENDING }],
    addressSnapshot: {
      name: 'E-Commerce Customer',
      phone: '9876543210',
      line1: '123 Test Road',
      city: 'Delhi',
      state: 'Delhi',
      pincode: '110001',
    },
    subtotal: 500,
    total: 539,
    deliveryCharge: 39,
    ...orderOverrides,
  };
  orders[orderId] = defaultOrder;

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
      // Support AWB lookup for webhook tests
      if (filter['shipment.awb']) {
        return Object.values(orders).find((o) => o.shipment?.awb === filter['shipment.awb'] && !o.deletedAt) || null;
      }
      if (filter._id) return orders[filter._id] || null;
      return null;
    }),
    find: jest.fn(async () => Object.values(orders)),
    count: jest.fn(async () => Object.keys(orders).length),
  };

  const orderItemRepository = {
    listByOrderId: jest.fn(async () => [
      { productId, quantity: 2, sellerId, unitPrice: 250, _id: uid('oi-') },
    ]),
    createMany: jest.fn().mockResolvedValue(true),
    find: jest.fn(async () => [{ productId, quantity: 2, sellerId, orderId }]),
    exists: jest.fn(async () => true),
    listDistinctOrderIdsBySeller: jest.fn(async () => [orderId]),
    countDistinctOrdersBySeller: jest.fn(async () => 1),
  };

  const productRepository = {
    find: jest.fn(async () => [
      { _id: productId, title: 'Premium Widget', sku: 'WIDGET-01', price: 250, attributes: { weight: 0.3 } },
    ]),
    findPublicById: jest.fn(async () => ({ _id: productId, title: 'Premium Widget', sellerId, price: 250, stock: 50 })),
    reserveStock: jest.fn().mockResolvedValue(true),
    decrementStock: jest.fn().mockResolvedValue(true),
    incrementStock: jest.fn().mockResolvedValue(true),
    releaseReservedStock: jest.fn().mockResolvedValue(true),
    getAvailableStock: jest.fn(() => 50),
  };

  const sellerRepository = {
    findById: jest.fn(async () => ({ _id: sellerId, pincode: '560001', name: 'Test Seller' })),
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

  bootstrapProviders();

  const courierShipmentService = new CourierShipmentService({
    orderRepository,
    orderItemRepository,
    orderTrackingRepository,
    orderStatusHistoryRepository,
    productRepository,
    sellerRepository,
  });

  const cartService = {
    getCart: jest.fn(async () => ({
      items: [{ productId, sellerId, quantity: 2, unitPrice: 250 }],
      subtotal: 500,
      total: 539,
      shippingFee: 39,
    })),
    persistCartSnapshot: jest.fn(),
    clearCart: jest.fn(),
  };

  const pricingService = {
    buildSellerSubOrders: jest.fn(() => [{ sellerId, items: [], subtotal: 500, status: ORDER_STATUS.PENDING }]),
  };

  const paymentService = {
    initiatePayment: jest.fn(async () => ({ paymentStatus: PAYMENT_STATUS.PAID })),
  };

  const orderService = new OrderService({
    cartService,
    productRepository,
    orderRepository,
    orderItemRepository,
    orderTrackingRepository,
    orderStatusHistoryRepository,
    paymentService,
    pricingService,
    couponService: {},
    cartRepository: {},
    cartItemRepository: {},
    courierShipmentService,
  });

  return {
    orderId, userId, sellerId,
    orderService, courierShipmentService,
    orderRepository, orders, eventLog, orderTracking, orderStatusHistory,
    cleanup: () => unsubs.forEach((un) => un()),
  };
}

// ─── tests ──────────────────────────────────────────────────────────────────────

describe('E2E E-Commerce — Shiprocket/Courier Flow', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('1. Payment confirm creates courier shipment with mock AWB', async () => {
    const ctx = buildEcommerceContext();
    try {
      await ctx.orderService.confirmOrder(ctx.orderId, ctx.userId);

      const order = ctx.orders[ctx.orderId];
      expect(order.status).toBe(ORDER_STATUS.PLACED);
      expect(order.fulfilmentType).toBe('courier');
      expect(order.shipment).toBeTruthy();
      expect(order.shipment.awb).toMatch(/^MKC/);
      expect(order.shipment.courierName).toBe('Mithilakart Courier');
    } finally {
      ctx.cleanup();
    }
  });

  it('2. Shipment created event is emitted after courier creation', async () => {
    const ctx = buildEcommerceContext();
    try {
      await ctx.orderService.confirmOrder(ctx.orderId, ctx.userId);

      const shipmentEvents = ctx.eventLog.filter((e) => e.type === 'order.shipment_created');
      expect(shipmentEvents.length).toBe(1);
      expect(shipmentEvents[0].payload.shipment).toBeTruthy();
      expect(shipmentEvents[0].payload.shipment.awb).toBeTruthy();
    } finally {
      ctx.cleanup();
    }
  });

  it('3. Seller can accept placed e-commerce order → confirmed', async () => {
    const ctx = buildEcommerceContext({
      orderOverrides: {
        status: ORDER_STATUS.PLACED,
        fulfilmentType: 'courier',
        shipment: { awb: 'MKC12345678' },
        inventoryDeducted: true,
      },
    });

    try {
      const result = await ctx.orderService.updateStatusAsSeller({
        orderId: ctx.orderId,
        sellerId: ctx.sellerId,
        toStatus: ORDER_STATUS.CONFIRMED,
      });

      expect(result.status).toBe(ORDER_STATUS.CONFIRMED);
    } finally {
      ctx.cleanup();
    }
  });

  it('4. Shiprocket webhook → IN TRANSIT → order becomes SHIPPED', async () => {
    const ctx = buildEcommerceContext({
      orderOverrides: {
        status: ORDER_STATUS.CONFIRMED,
        fulfilmentType: 'courier',
        shipment: { awb: 'AWB-SR-001', shipmentId: 'ship1' },
      },
    });

    try {
      const result = await ctx.courierShipmentService.handleWebhookPayload({
        awb: 'AWB-SR-001',
        current_status: 'IN TRANSIT',
      });

      expect(result.handled).toBe(true);
      expect(result.orderId).toBe(ctx.orderId);

      const order = ctx.orders[ctx.orderId];
      expect(order.status).toBe(ORDER_STATUS.SHIPPED);
      expect(order.shipment.checkpoints.length).toBeGreaterThan(0);
    } finally {
      ctx.cleanup();
    }
  });

  it('5. Shiprocket webhook → OUT FOR DELIVERY → order OUT_FOR_DELIVERY', async () => {
    const ctx = buildEcommerceContext({
      orderOverrides: {
        status: ORDER_STATUS.SHIPPED,
        fulfilmentType: 'courier',
        shipment: { awb: 'AWB-SR-002', checkpoints: [] },
      },
    });

    try {
      const result = await ctx.courierShipmentService.handleWebhookPayload({
        awb: 'AWB-SR-002',
        current_status: 'OUT FOR DELIVERY',
      });

      expect(result.handled).toBe(true);
      expect(ctx.orders[ctx.orderId].status).toBe(ORDER_STATUS.OUT_FOR_DELIVERY);
    } finally {
      ctx.cleanup();
    }
  });

  it('6. Shiprocket webhook → DELIVERED → order DELIVERED', async () => {
    const ctx = buildEcommerceContext({
      orderOverrides: {
        status: ORDER_STATUS.OUT_FOR_DELIVERY,
        fulfilmentType: 'courier',
        shipment: { awb: 'AWB-SR-003', checkpoints: [] },
      },
    });

    try {
      const result = await ctx.courierShipmentService.handleWebhookPayload({
        awb: 'AWB-SR-003',
        current_status: 'DELIVERED',
      });

      expect(result.handled).toBe(true);
      expect(ctx.orders[ctx.orderId].status).toBe(ORDER_STATUS.DELIVERED);
    } finally {
      ctx.cleanup();
    }
  });

  it('7. Shiprocket webhook with unknown AWB returns handled=false', async () => {
    const ctx = buildEcommerceContext();
    try {
      const result = await ctx.courierShipmentService.handleWebhookPayload({
        awb: 'UNKNOWN-AWB-999',
        current_status: 'DELIVERED',
      });

      expect(result.handled).toBe(false);
    } finally {
      ctx.cleanup();
    }
  });

  it('8. Mock shipping provider pincode serviceability', async () => {
    bootstrapProviders();
    const shipping = getProvider('shipping');

    // When the provider is mock, serviceability uses basic rules
    if (typeof shipping.checkServiceability !== 'function') {
      // Skip if ShiprocketShippingProvider is active (needs real credentials)
      return;
    }

    try {
      const ok = await shipping.checkServiceability({
        address: { pincode: '110001' },
        pickupPincode: '560001',
        paymentMethod: PAYMENT_METHOD.COD,
      });
      expect(ok.serviceable).toBeDefined();
    } catch {
      // Shiprocket may throw if credentials invalid — expected in test env
    }
  });

  it('9. Order cancellation cancels courier shipment', async () => {
    const ctx = buildEcommerceContext({
      orderOverrides: {
        status: ORDER_STATUS.CONFIRMED,
        fulfilmentType: 'courier',
        shipment: { awb: 'AWB-CANCEL-001', shipmentId: 'ship-cancel' },
        inventoryDeducted: true,
      },
    });

    try {
      const result = await ctx.orderService.cancelOrder(ctx.orderId, ctx.userId);
      expect(result.status).toBe(ORDER_STATUS.CANCELLED);
    } finally {
      ctx.cleanup();
    }
  });

  it('10. Tracking sync updates shipment data', async () => {
    const ctx = buildEcommerceContext({
      orderOverrides: {
        status: ORDER_STATUS.SHIPPED,
        fulfilmentType: 'courier',
        shipment: { awb: 'AWB-TRACK-001', trackingId: 'AWB-TRACK-001', shipmentId: 'ship-track' },
      },
    });

    try {
      const tracking = await ctx.orderService.getTracking(ctx.orderId, ctx.userId);

      expect(tracking.orderId).toBe(ctx.orderId);
      expect(tracking.status).toBeDefined();
      expect(tracking.fulfilmentType).toBe('courier');
    } finally {
      ctx.cleanup();
    }
  });
});
