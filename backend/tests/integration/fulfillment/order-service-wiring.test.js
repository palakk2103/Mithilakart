/**
 * CR-002 P7 — the wiring of the fulfillment engine into the live order flow.
 *
 * This is the highest-regression-risk change in CR-002: `_afterOrderConfirmed`
 * runs for EVERY order in the system. These tests pin the guarantees that make
 * the edit safe.
 */
jest.mock('../../../src/database', () => ({
  withTransaction: (callback) => callback(null),
}));

const { OrderService } = require('../../../src/services/orders/OrderService');
const { ORDER_STATUS } = require('../../../src/constants/commerce');

const ORDER_ID = 'order-cr002';
const SELLER_ID = 'seller-cr002';

function buildOrderService({ marketplaceTab, engine = undefined, commerceFlow } = {}) {
  const order = {
    _id: ORDER_ID,
    userId: 'user-1',
    orderNumber: 'MK-CR002',
    status: ORDER_STATUS.PENDING,
    marketplaceTab: marketplaceTab ?? null,
    commerceFlow: commerceFlow ?? 'standard',
    inventoryDeducted: false,
    addressSnapshot: { lat: 28.61, lng: 77.20, pincode: '110001' },
    sellerSubOrders: [{ sellerId: SELLER_ID, items: [], subtotal: 100, status: ORDER_STATUS.PENDING }],
  };

  const orderRepository = {
    findById: jest.fn(async () => order),
    updateById: jest.fn(async (id, data) => Object.assign(order, data)),
    updateStatus: jest.fn(async () => order),
  };

  const courierShipmentService = {
    createForOrder: jest.fn(async () => ({ provider: 'shiprocket', awb: 'AWB-1' })),
  };

  const deliveryOrderService = {
    notifyNearbyPartnersForOrder: jest.fn(async () => ({ partnerIds: [], count: 0 })),
  };

  const service = new OrderService({
    cartService: { persistCartSnapshot: jest.fn(), clearCart: jest.fn(), getCart: jest.fn() },
    productRepository: { decrementStock: jest.fn(async () => true) },
    orderRepository,
    orderItemRepository: { listByOrderId: jest.fn(async () => [{ productId: 'p1', quantity: 1, sellerId: SELLER_ID }]) },
    orderTrackingRepository: { createInitial: jest.fn() },
    orderStatusHistoryRepository: { addTransition: jest.fn() },
    paymentService: { initiatePayment: jest.fn() },
    pricingService: { buildSellerSubOrders: jest.fn(() => order.sellerSubOrders) },
    couponService: null,
    cartRepository: {},
    cartItemRepository: {},
    courierShipmentService,
  });

  service.setDeliveryOrderService(deliveryOrderService);
  if (engine !== undefined) service.setFulfillmentEngineService(engine);

  return { service, order, orderRepository, courierShipmentService, deliveryOrderService };
}

function fakeEngine({ enabled = true, startImpl } = {}) {
  return {
    isEnabledForTab: jest.fn(async () => enabled),
    start: jest.fn(startImpl || (async () => ({ state: 'searching' }))),
  };
}

/** The engine is fire-and-forget, so let its microtask settle before asserting. */
const flush = () => new Promise((resolve) => setImmediate(resolve));

describe('CR-002 P7 — engine wiring into OrderService', () => {
  describe('quick-commerce tabs', () => {
    it('starts the engine for quick_shop', async () => {
      const engine = fakeEngine();
      const { service } = buildOrderService({ marketplaceTab: 'quick_shop', engine });

      await service.confirmOrder(ORDER_ID, 'user-1');
      await flush();

      expect(engine.isEnabledForTab).toHaveBeenCalledWith('quick_shop');
      expect(engine.start).toHaveBeenCalledWith(ORDER_ID);
    });

    it('starts the engine for groceries_fresh', async () => {
      const engine = fakeEngine();
      const { service } = buildOrderService({ marketplaceTab: 'groceries_fresh', engine });

      await service.confirmOrder(ORDER_ID, 'user-1');
      await flush();

      expect(engine.start).toHaveBeenCalled();
    });

    it('still marks the order local_delivery, exactly as before CR-002', async () => {
      const engine = fakeEngine();
      const { service, order } = buildOrderService({ marketplaceTab: 'quick_shop', engine });

      await service.confirmOrder(ORDER_ID, 'user-1');

      expect(order.fulfilmentType).toBe('local_delivery');
    });

    it('does not create a courier shipment for a quick tab', async () => {
      const engine = fakeEngine();
      const { service, courierShipmentService } = buildOrderService({ marketplaceTab: 'quick_shop', engine });

      await service.confirmOrder(ORDER_ID, 'user-1');
      await flush();

      expect(courierShipmentService.createForOrder).not.toHaveBeenCalled();
    });
  });

  describe('T-38 — standard tabs are untouched', () => {
    it('does not invoke the engine for mithilakart', async () => {
      const engine = fakeEngine();
      const { service, courierShipmentService, order } = buildOrderService({
        marketplaceTab: 'mithilakart', engine,
      });

      await service.confirmOrder(ORDER_ID, 'user-1');
      await flush();

      expect(engine.isEnabledForTab).not.toHaveBeenCalled();
      expect(engine.start).not.toHaveBeenCalled();
      // The existing courier path runs unchanged.
      expect(courierShipmentService.createForOrder).toHaveBeenCalled();
      expect(order.fulfilmentType).toBe('courier');
    });

    it('does not invoke the engine for mithilak', async () => {
      const engine = fakeEngine();
      const { service, courierShipmentService } = buildOrderService({ marketplaceTab: 'mithilak', engine });

      await service.confirmOrder(ORDER_ID, 'user-1');
      await flush();

      expect(engine.start).not.toHaveBeenCalled();
      expect(courierShipmentService.createForOrder).toHaveBeenCalled();
    });

    it('does not invoke the engine for a legacy standard commerceFlow', async () => {
      const engine = fakeEngine();
      const { service, courierShipmentService } = buildOrderService({
        marketplaceTab: null, commerceFlow: 'standard', engine,
      });

      await service.confirmOrder(ORDER_ID, 'user-1');
      await flush();

      expect(engine.start).not.toHaveBeenCalled();
      expect(courierShipmentService.createForOrder).toHaveBeenCalled();
    });
  });

  describe('safety guarantees', () => {
    it('behaves exactly as pre-CR-002 when no engine is injected', async () => {
      const { service, order } = buildOrderService({ marketplaceTab: 'quick_shop' });

      const result = await service.confirmOrder(ORDER_ID, 'user-1');

      expect(result).toBeTruthy();
      expect(order.fulfilmentType).toBe('local_delivery');
      expect(order.status).toBe(ORDER_STATUS.PLACED);
    });

    it('skips the engine when the tab is disabled by Admin', async () => {
      const engine = fakeEngine({ enabled: false });
      const { service, order } = buildOrderService({ marketplaceTab: 'quick_shop', engine });

      await service.confirmOrder(ORDER_ID, 'user-1');
      await flush();

      expect(engine.isEnabledForTab).toHaveBeenCalled();
      expect(engine.start).not.toHaveBeenCalled();
      // Order still confirms and stays on the local-delivery path.
      expect(order.fulfilmentType).toBe('local_delivery');
      expect(order.status).toBe(ORDER_STATUS.PLACED);
    });

    it('a rejected engine start cannot fail order confirmation', async () => {
      const engine = fakeEngine({ startImpl: async () => { throw new Error('engine exploded'); } });
      const { service, order } = buildOrderService({ marketplaceTab: 'quick_shop', engine });

      await expect(service.confirmOrder(ORDER_ID, 'user-1')).resolves.toBeTruthy();
      await flush();

      // Order remains confirmed — a paid order is never rolled back by an
      // engine fault.
      expect(order.status).toBe(ORDER_STATUS.PLACED);
      expect(order.inventoryDeducted).toBe(true);
    });

    it('a throwing gate check cannot fail order confirmation', async () => {
      const engine = {
        isEnabledForTab: jest.fn(async () => { throw new Error('config down'); }),
        start: jest.fn(),
      };
      const { service, order } = buildOrderService({ marketplaceTab: 'quick_shop', engine });

      await expect(service.confirmOrder(ORDER_ID, 'user-1')).resolves.toBeTruthy();

      expect(engine.start).not.toHaveBeenCalled();
      expect(order.status).toBe(ORDER_STATUS.PLACED);
    });

    it('does not block confirmation on a slow engine', async () => {
      let release;
      const engine = fakeEngine({
        startImpl: () => new Promise((resolve) => { release = resolve; }),
      });
      const { service, order } = buildOrderService({ marketplaceTab: 'quick_shop', engine });

      // Resolves while the engine is still pending — the customer is never
      // made to wait for the discovery window.
      await expect(service.confirmOrder(ORDER_ID, 'user-1')).resolves.toBeTruthy();
      expect(order.status).toBe(ORDER_STATUS.PLACED);

      release({ state: 'searching' });
    });

    it('deducts inventory exactly once, regardless of the engine', async () => {
      const engine = fakeEngine();
      const { service } = buildOrderService({ marketplaceTab: 'quick_shop', engine });

      await service.confirmOrder(ORDER_ID, 'user-1');
      await flush();

      expect(service.productRepository.decrementStock).toHaveBeenCalledTimes(1);
    });
  });
});
