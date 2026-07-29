const { BaseRepository } = require('../core/BaseRepository');
const PaymentTransaction = require('../models/PaymentTransaction');

class PaymentTransactionRepository extends BaseRepository {
  constructor() {
    super(PaymentTransaction);
  }

  async findByOrderId(orderId) {
    return this.findOne({ orderId, deletedAt: null }, { sort: { createdAt: -1 } });
  }

  async findByIdempotencyKey(idempotencyKey) {
    if (!idempotencyKey) return null;
    return this.findOne({ idempotencyKey, deletedAt: null }, { sort: { createdAt: -1 } });
  }

  async findByProviderPaymentId(providerPaymentId) {
    if (!providerPaymentId) return null;
    return this.findOne({ providerPaymentId, deletedAt: null }, { sort: { createdAt: -1 } });
  }

  async updateStatus(paymentTransactionId, status, rawResponse = {}, session = null) {
    return this.updateById(
      paymentTransactionId,
      { status, rawResponse },
      session
    );
  }
}

module.exports = {
  PaymentTransactionRepository,
};

