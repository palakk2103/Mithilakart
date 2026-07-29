const { PaymentProvider } = require('./index');
const { randomUuid } = require('../../utils/cryptoHelper');

class MockPaymentProvider extends PaymentProvider {
  constructor() {
    super();
    this.providerName = 'mock';
    this.markConfigured();
  }

  async createOrder({ orderId, amount, currency, paymentMethod }) {
    // Simulate gateway order creation.
    return {
      provider: this.providerName,
      providerOrderId: `mock_order_${orderId}_${randomUuid().slice(0, 8)}`,
      amount,
      currency,
      paymentMethod,
    };
  }

  async verifyPayment({ providerPaymentId, _payload }) {
    // Simulate successful payment verification.
    return {
      provider: this.providerName,
      providerPaymentId,
      status: 'paid',
    };
  }

  async capturePayment(payload) {
    return this.verifyPayment(payload);
  }

  async refund(_payload) {
    return { refunded: true };
  }

  async verifyWebhookSignature({ _payload, _signature, _secret }) {
    // In Phase 3 we keep it mock-only: accept webhook signature in dev/tests.
    return true;
  }
}

module.exports = {
  MockPaymentProvider,
};

