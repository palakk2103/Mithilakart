jest.mock('../../../src/database', () => ({
  withTransaction: (callback) => callback(null),
}));

const { bootstrapProviders } = require('../../../src/core/providers/bootstrapProviders');
const { getProvider } = require('../../../src/core/providers.registry');
const { OrderService } = require('../../../src/services/orders/OrderService');
const { CourierShipmentService } = require('../../../src/services/shipping/CourierShipmentService');
const { ORDER_STATUS, PAYMENT_METHOD, PAYMENT_STATUS } = require('../../../src/constants/commerce');

function createInMemoryOrderStore(initial = {}) {
  const store = { ...initial };

  return {
    store,
    orderRepository: {
      create: jest.fn(async (data) => {
        const order = { _id: data._id || 'order1', orderNumber: data.orderNumber || 'MK-TEST', ...data };
        store.order = order;
        return order;
      }),
      findById: jest.fn(async (id) => store.order?._id === id ? store.order : null),
      findActiveById: jest.fn(async (id) => store.order?._id === id ? store.order : null),
      findByIdempotencyKey: jest.fn().mockResolvedValue(null),
      findUnpaidPendingByUser: jest.fn().mockResolvedValue([]),
      updateById: jest.fn(async (id, patch) => {
        if (store.order?._id === id) {
          store.order = { ...store.order, ...patch };
        }
        return store.order;
      }),
      updateStatus: jest.fn(async (id, status) => {
        if (store.order?._id === id) {
          store.order = { ...store.order, status };
        }
        return store.order;
      }),
      updateStatusOptimistic: jest.fn(async (id, fromStatus, toStatus) => {
        if (store.order?._id === id && store.order.status === fromStatus) {
          store.order = { ...store.order, status: toStatus };
          return store.order;
        }
        return null;
      }),
      findOne: jest.fn(async (filter) => {
        if (filter._id && store.order?._id !== filter._id) return null;
        if (filter['shipment.awb'] && store.order?.shipment?.awb !== filter['shipment.awb']) return null;
        if (filter.deletedAt === null && store.order?.deletedAt) return null;
        return store.order;
      }),
    },
  };
}

function buildOrderFlowServices({ commerceFlow = 'standard', orderOverrides = {} } = {}) {
  const userId = 'user1';
  const sellerId = 'seller1';
  const productId = 'prod1';
  const orderId = 'order1';

  const { store, orderRepository } = createInMemoryOrderStore({
    order: {
      _id: orderId,
      userId,
      orderNumber: 'MK-FLOW-1',
      status: ORDER_STATUS.PENDING,
      commerceFlow,
      paymentMethod: PAYMENT_METHOD.COD,
      paymentStatus: PAYMENT_STATUS.PENDING,
      inventoryDeducted: false,
      sellerSubOrders: [{ sellerId, items: [], subtotal: 200, status: ORDER_STATUS.PENDING }],
      addressSnapshot: { pincode: '110001', city: 'Delhi', name: 'Test User' },
      subtotal: 200,
      ...orderOverrides,
    },
  });

  const orderItemRepository = {
    listByOrderId: jest.fn().mockResolvedValue([
      { productId, quantity: 1, sellerId, unitPrice: 200 },
    ]),
    createMany: jest.fn().mockResolvedValue(true),
  };

  const productRepository = {
    decrementStock: jest.fn().mockResolvedValue(true),
    incrementStock: jest.fn().mockResolvedValue(true),
    reserveStock: jest.fn().mockResolvedValue(true),
    releaseReservedStock: jest.fn().mockResolvedValue(true),
    getAvailableStock: jest.fn(() => 10),
    find: jest.fn().mockResolvedValue([
      { _id: productId, title: 'Test Product', sku: 'SKU1', attributes: {} },
    ]),
    findPublicById: jest.fn(),
  };

  const orderTrackingRepository = { createInitial: jest.fn().mockResolvedValue(true) };
  const orderStatusHistoryRepository = { addTransition: jest.fn().mockResolvedValue(true) };

  const paymentService = {
    initiatePayment: jest.fn().mockResolvedValue({ paymentStatus: PAYMENT_STATUS.PAID }),
  };

  const pricingService = {
    buildSellerSubOrders: jest.fn().mockReturnValue([
      { sellerId, items: [], subtotal: 200, status: ORDER_STATUS.PENDING },
    ]),
  };

  const cartService = {
    getCart: jest.fn().mockResolvedValue({
      items: [{ productId, sellerId, quantity: 1, unitPrice: 200 }],
      subtotal: 200,
      total: 200,
    }),
    persistCartSnapshot: jest.fn(),
    clearCart: jest.fn(),
  };

  const sellerRepository = {
    findById: jest.fn().mockResolvedValue({ _id: sellerId, pincode: '560001' }),
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

  const deliveryOrderService = {
    notifyNearbyPartnersForOrder: jest.fn().mockResolvedValue(true),
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
  orderService.setDeliveryOrderService(deliveryOrderService);

  return {
    orderService,
    courierShipmentService,
    orderRepository,
    store,
    sellerId,
    userId,
    orderId,
    deliveryOrderService,
  };
}

describe('Order flows — mock courier (no Shiprocket API)', () => {
  it('e-commerce payment confirm creates mock courier shipment with AWB', async () => {
    const { orderService, store, userId, orderId } = buildOrderFlowServices({
      commerceFlow: 'standard',
    });

    await orderService.confirmOrder(orderId, userId);

    expect(store.order.status).toBe(ORDER_STATUS.PLACED);
    expect(store.order.fulfilmentType).toBe('courier');
    expect(store.order.shipment?.awb).toMatch(/^MKC/);
    expect(store.order.shipment?.courierName).toBe('Mithilakart Courier');
    expect(store.order.shipment?.labelUrl).toContain('mock.mithilakart.local');
  });

  it('quick commerce payment confirm uses local delivery without courier shipment', async () => {
    const { orderService, store, userId, orderId } = buildOrderFlowServices({
      commerceFlow: 'quick_shop',
    });

    await orderService.confirmOrder(orderId, userId);

    expect(store.order.status).toBe(ORDER_STATUS.PLACED);
    expect(store.order.fulfilmentType).toBe('local_delivery');
    expect(store.order.shipment).toBeUndefined();
  });

  it('seller accepts placed order → confirmed', async () => {
    const { orderService, store, sellerId, orderId } = buildOrderFlowServices({
      commerceFlow: 'standard',
      orderOverrides: {
        status: ORDER_STATUS.PLACED,
        fulfilmentType: 'courier',
        shipment: { awb: 'MKC12345678' },
      },
    });

    const result = await orderService.updateStatusAsSeller({
      orderId,
      sellerId,
      toStatus: ORDER_STATUS.CONFIRMED,
    });

    expect(result.status).toBe(ORDER_STATUS.CONFIRMED);
    expect(store.order.status).toBe(ORDER_STATUS.CONFIRMED);
  });

  it('mock shipping provider reports pincode serviceability without external API', async () => {
    bootstrapProviders();
    const shipping = getProvider('shipping');

    const ok = await shipping.checkServiceability({
      address: { pincode: '110001' },
      paymentMethod: PAYMENT_METHOD.COD,
    });
    const bad = await shipping.checkServiceability({
      address: { pincode: 'bad' },
      paymentMethod: PAYMENT_METHOD.UPI,
    });

    expect(ok.serviceable).toBe(true);
    expect(ok.provider).toBe('courier_mock');
    expect(bad.serviceable).toBe(false);
  });

  it('courier webhook updates order status using mock shipment AWB', async () => {
    const { courierShipmentService, store, orderId } = buildOrderFlowServices({
      commerceFlow: 'standard',
      orderOverrides: {
        status: ORDER_STATUS.PLACED,
        fulfilmentType: 'courier',
        shipment: { awb: 'AWB-MOCK-001' },
      },
    });

    const result = await courierShipmentService.handleWebhookPayload({
      awb: 'AWB-MOCK-001',
      current_status: 'IN TRANSIT',
    });

    expect(result.handled).toBe(true);
    expect(result.orderId).toBe(orderId);
    expect(store.order.shipment.checkpoints?.length).toBeGreaterThan(0);
    expect(store.order.status).toBe(ORDER_STATUS.SHIPPED);
  });
});
