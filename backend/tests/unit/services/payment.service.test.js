const { PaymentService } = require('../../../src/services/payments/PaymentService');
const { PAYMENT_METHOD, PAYMENT_STATUS } = require('../../../src/constants/commerce');

describe('PaymentService idempotency', () => {
  it('returns existing paid transaction for duplicate idempotency key', async () => {
    const existingTx = {
      _id: 'tx123',
      providerPaymentId: 'prov123',
      status: PAYMENT_STATUS.PAID,
      provider: 'mock',
    };

    const paymentTransactionRepository = {
      findByIdempotencyKey: jest.fn().mockResolvedValue(existingTx),
      create: jest.fn(),
      updateStatus: jest.fn(),
    };

    const service = new PaymentService({
      paymentTransactionRepository,
      paymentWebhookRepository: {},
      orderRepository: { updateById: jest.fn() },
      orderTrackingRepository: {},
      orderStatusHistoryRepository: {},
    });

    const result = await service.initiatePayment({
      userId: 'user1',
      orderId: 'order1',
      orderNumber: 'MK-1',
      paymentMethod: PAYMENT_METHOD.UPI,
      amount: 500,
      currency: 'INR',
      idempotencyKey: 'idem-123',
    });

    expect(paymentTransactionRepository.create).not.toHaveBeenCalled();
    expect(result.paymentStatus).toBe(PAYMENT_STATUS.PAID);
    expect(result.paymentTransactionId).toBe('tx123');
  });
});
