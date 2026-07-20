jest.mock('../../../src/database', () => ({
  withTransaction: (callback) => callback(null),
}));

const { OrderService } = require('../../../src/services/orders/OrderService');
const { ORDER_STATUS, PAYMENT_METHOD, PAYMENT_STATUS } = require('../../../src/constants/commerce');

describe('OrderService inventory timing', () => {
  const userId = 'user123';
  const productId = 'prod123';
  const sellerId = 'seller123';
  const orderId = 'order123';

  function buildService(overrides = {}) {
    const cartService = {
      getCart: jest.fn().mockResolvedValue({
        items: [
          {
            productId,
            sellerId,
            quantity: 2,
            unitPrice: 100,
          },
        ],
        subtotal: 200,
        couponDiscount: 0,
        tax: 0,
        deliveryCharge: 0,
        total: 200,
      }),
      persistCartSnapshot: jest.fn().mockResolvedValue(true),
      clearCart: jest.fn().mockResolvedValue(true),
      ...overrides.cartService,
    };

    const productRepository = {
      decrementStock: jest.fn().mockResolvedValue(true),
      incrementStock: jest.fn().mockResolvedValue(true),
      findPublicById: jest.fn(),
      ...overrides.productRepository,
    };

    const orderRepository = {
      create: jest.fn().mockResolvedValue({
        _id: orderId,
        orderNumber: 'MK-TEST',
        status: ORDER_STATUS.PENDING,
        paymentStatus: PAYMENT_STATUS.PENDING,
        sellerSubOrders: [{ sellerId, items: [], subtotal: 200, status: ORDER_STATUS.PENDING }],
      }),
      findById: jest.fn().mockImplementation((id) => Promise.resolve({
        _id: id,
        status: ORDER_STATUS.PENDING,
        inventoryDeducted: false,
        sellerSubOrders: [{ sellerId, items: [], subtotal: 200, status: ORDER_STATUS.PENDING }],
      })),
      updateById: jest.fn().mockResolvedValue(true),
      ...overrides.orderRepository,
    };

    const orderItemRepository = {
      createMany: jest.fn().mockResolvedValue(true),
      listByOrderId: jest.fn().mockResolvedValue([
        { productId, quantity: 2, sellerId },
      ]),
      ...overrides.orderItemRepository,
    };

    const orderTrackingRepository = {
      createInitial: jest.fn().mockResolvedValue(true),
    };

    const orderStatusHistoryRepository = {
      addTransition: jest.fn().mockResolvedValue(true),
    };

    const paymentService = {
      initiatePayment: jest.fn().mockResolvedValue({
        paymentStatus: PAYMENT_STATUS.PENDING,
      }),
      ...overrides.paymentService,
    };

    const pricingService = {
      buildSellerSubOrders: jest.fn().mockReturnValue([
        { sellerId, items: [], subtotal: 200, status: ORDER_STATUS.PENDING },
      ]),
    };

    const couponService = {
      validateForCheckout: jest.fn(),
      incrementUsage: jest.fn(),
    };

    const cartRepository = {};
    const cartItemRepository = {};

    return {
      service: new OrderService({
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
      }),
      productRepository,
      paymentService,
      orderRepository,
    };
  }

  it('does not decrement inventory when gateway payment is pending', async () => {
    const { service, productRepository } = buildService();

    await service.placeOrder({
      userId,
      addressId: 'addr1',
      paymentMethod: PAYMENT_METHOD.UPI,
    });

    expect(productRepository.decrementStock).not.toHaveBeenCalled();
  });

  it('decrements inventory when COD payment confirms the order', async () => {
    const { service, productRepository, paymentService } = buildService({
      paymentService: {
        initiatePayment: jest.fn().mockResolvedValue({
          paymentStatus: PAYMENT_STATUS.PAID,
        }),
      },
    });

    await service.placeOrder({
      userId,
      addressId: 'addr1',
      paymentMethod: PAYMENT_METHOD.COD,
    });

    expect(paymentService.initiatePayment).toHaveBeenCalled();
    expect(productRepository.decrementStock).toHaveBeenCalledWith(productId, 2, null);
  });

  it('deducts inventory exactly once on confirmOrder', async () => {
    const { service, productRepository, orderRepository } = buildService();

    let confirmed = false;
    orderRepository.findById.mockImplementation(() => Promise.resolve({
      _id: orderId,
      status: confirmed ? ORDER_STATUS.CONFIRMED : ORDER_STATUS.PENDING,
      inventoryDeducted: confirmed,
      sellerSubOrders: [{ sellerId, items: [], subtotal: 200, status: ORDER_STATUS.PENDING }],
    }));

    orderRepository.updateById.mockImplementation(async () => {
      confirmed = true;
      return true;
    });

    await service.confirmOrder(orderId, userId);
    await service.confirmOrder(orderId, userId);

    expect(productRepository.decrementStock).toHaveBeenCalledTimes(1);
  });
});
