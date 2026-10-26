/**
 * Production bug fix — cart clearing after checkout.
 *
 * `placeOrder` previously did `return withTransaction(...)`, which made the
 * cart-clearing block after it unreachable. Consequence: a successful order
 * never cleared the customer's cart, and the trailing `return result` also
 * referenced an undefined variable.
 *
 * These tests pin the corrected behaviour, including the cases where the cart
 * must specifically NOT be cleared.
 */
jest.mock('../../../src/database', () => ({
  withTransaction: (callback) => callback(null),
}));

const { OrderService } = require('../../../src/services/orders/OrderService');
const { ORDER_STATUS, PAYMENT_STATUS, PAYMENT_METHOD } = require('../../../src/constants/commerce');
const { AppError } = require('../../../src/utils/AppError');

const USER_ID = 'user-1';
const ORDER_ID = 'order-1';
const SELLER_ID = 'seller-1';

function buildService({ paymentResult, paymentThrows, createThrows, reserveThrows } = {}) {
  const cartService = {
    getCart: jest.fn(async () => ({
      items: [{ productId: 'p1', sellerId: SELLER_ID, quantity: 1, unitPrice: 100 }],
      subtotal: 100, couponDiscount: 0, tax: 0, deliveryCharge: 0, total: 100,
    })),
    persistCartSnapshot: jest.fn(async () => true),
    clearCart: jest.fn(async () => true),
  };

  const order = {
    _id: ORDER_ID,
    orderNumber: 'MK-1',
    status: ORDER_STATUS.PENDING,
    paymentStatus: PAYMENT_STATUS.PENDING,
    sellerSubOrders: [{ sellerId: SELLER_ID, items: [], subtotal: 100, status: ORDER_STATUS.PENDING }],
  };

  const orderRepository = {
    create: jest.fn(async () => {
      if (createThrows) throw AppError.database('order create failed');
      return order;
    }),
    findById: jest.fn(async () => order),
    findByIdempotencyKey: jest.fn(async () => null),
    findUnpaidPendingByUser: jest.fn(async () => []),
    updateById: jest.fn(async (id, data) => Object.assign(order, data)),
  };

  const productRepository = {
    reserveStock: jest.fn(async () => {
      if (reserveThrows) throw AppError.outOfStock('Insufficient stock');
      return true;
    }),
    releaseReservedStock: jest.fn(async () => true),
    decrementStock: jest.fn(async () => true),
    // Used only by the direct "Buy Now" path.
    findPublicById: jest.fn(async (id) => ({
      _id: id, sellerId: SELLER_ID, price: 100, stock: 10, reservedStock: 0, title: 'Product',
    })),
    getAvailableStock: jest.fn((p) => Math.max(0, (p?.stock || 0) - (p?.reservedStock || 0))),
  };

  const paymentService = {
    initiatePayment: jest.fn(async () => {
      if (paymentThrows) throw AppError.paymentFailed('Card declined');
      return paymentResult ?? { paymentStatus: PAYMENT_STATUS.PENDING };
    }),
  };

  const service = new OrderService({
    cartService,
    productRepository,
    orderRepository,
    orderItemRepository: { createMany: jest.fn(async () => true), listByOrderId: jest.fn(async () => []) },
    orderTrackingRepository: { createInitial: jest.fn() },
    orderStatusHistoryRepository: { addTransition: jest.fn() },
    paymentService,
    pricingService: {
      buildSellerSubOrders: jest.fn(() => order.sellerSubOrders),
      calculateTotals: jest.fn(async () => ({
        subtotal: 100, discount: 0, couponDiscount: 0, tax: 0, deliveryCharge: 0, total: 100,
      })),
    },
    couponService: null,
    cartRepository: {},
    cartItemRepository: {},
  });

  return { service, cartService, orderRepository, productRepository, order };
}

const place = (service, overrides = {}) => service.placeOrder({
  userId: USER_ID,
  addressId: 'addr-1',
  paymentMethod: PAYMENT_METHOD.COD,
  ...overrides,
});

describe('checkout — cart clearing (production bug fix)', () => {
  describe('successful orders clear the cart', () => {
    it('COD order clears the cart', async () => {
      const { service, cartService } = buildService({
        paymentResult: { paymentStatus: PAYMENT_STATUS.PENDING },
      });

      const result = await place(service);

      expect(result.orderId).toBe(ORDER_ID);
      expect(cartService.clearCart).toHaveBeenCalledWith({ userId: USER_ID, sessionId: null });
    });

    it('paid (Razorpay) order clears the cart', async () => {
      const { service, cartService } = buildService({
        paymentResult: { paymentStatus: PAYMENT_STATUS.PAID },
      });

      await place(service, { paymentMethod: PAYMENT_METHOD.UPI });

      expect(cartService.clearCart).toHaveBeenCalledTimes(1);
    });

    it('pending Razorpay order still clears — the order exists', async () => {
      const { service, cartService } = buildService({
        paymentResult: { paymentStatus: PAYMENT_STATUS.PENDING, gatewayOrderId: 'rzp_1' },
      });

      await place(service, { paymentMethod: PAYMENT_METHOD.UPI });

      expect(cartService.clearCart).toHaveBeenCalled();
    });

    it('returns the order result (the old code returned an undefined variable)', async () => {
      const { service } = buildService();
      const result = await place(service);

      expect(result).toMatchObject({ orderId: ORDER_ID, orderNumber: 'MK-1' });
    });
  });

  describe('failed orders do NOT clear the cart', () => {
    it('payment failure leaves the cart intact', async () => {
      const { service, cartService } = buildService({ paymentThrows: true });

      await expect(place(service)).rejects.toMatchObject({ code: 'PAYMENT_FAILED' });
      expect(cartService.clearCart).not.toHaveBeenCalled();
    });

    it('order creation failure leaves the cart intact', async () => {
      const { service, cartService } = buildService({ createThrows: true });

      await expect(place(service)).rejects.toBeTruthy();
      expect(cartService.clearCart).not.toHaveBeenCalled();
    });

    it('out-of-stock leaves the cart intact so the customer can adjust it', async () => {
      const { service, cartService } = buildService({ reserveThrows: true });

      await expect(place(service)).rejects.toMatchObject({ code: 'OUT_OF_STOCK' });
      expect(cartService.clearCart).not.toHaveBeenCalled();
    });

    it('an empty cart is rejected without clearing', async () => {
      const { service, cartService } = buildService();
      cartService.getCart.mockResolvedValue({ items: [], subtotal: 0, total: 0 });

      await expect(place(service)).rejects.toMatchObject({ code: 'VALIDATION_ERROR' });
      expect(cartService.clearCart).not.toHaveBeenCalled();
    });
  });

  describe('Buy Now does not wipe the cart', () => {
    it('an order placed from explicit items leaves the cart alone', async () => {
      const { service, cartService } = buildService();

      // Direct purchase bypasses the cart; clearing it would delete unrelated
      // items the customer still intends to buy.
      await place(service, {
        items: [{ productId: 'p9', quantity: 1 }],
      });

      expect(cartService.clearCart).not.toHaveBeenCalled();
      expect(cartService.getCart).not.toHaveBeenCalled();
    });
  });

  describe('robustness', () => {
    it('a cart-clearing failure does not fail an already-committed order', async () => {
      const { service, cartService } = buildService();
      cartService.clearCart.mockRejectedValue(new Error('redis down'));

      // The order is committed; the customer must still get their confirmation.
      await expect(place(service)).resolves.toMatchObject({ orderId: ORDER_ID });
    });

    it('a duplicate request short-circuits on idempotency without clearing again', async () => {
      const { service, cartService, orderRepository } = buildService();
      orderRepository.findByIdempotencyKey.mockResolvedValue({
        _id: ORDER_ID, orderNumber: 'MK-1', status: ORDER_STATUS.PLACED, paymentStatus: PAYMENT_STATUS.PAID,
      });

      const result = await place(service, { idempotencyKey: 'key-1' });

      expect(result.idempotent).toBe(true);
      expect(cartService.clearCart).not.toHaveBeenCalled();
    });

    it('clears exactly once per successful order', async () => {
      const { service, cartService } = buildService();
      await place(service);
      expect(cartService.clearCart).toHaveBeenCalledTimes(1);
    });
  });
});
