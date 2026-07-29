const { BaseRepository } = require('../core/BaseRepository');
const PaymentWebhook = require('../models/PaymentWebhook');

class PaymentWebhookRepository extends BaseRepository {
  constructor() {
    super(PaymentWebhook);
  }

  async hasProcessed({ provider, eventId, idempotencyKey }) {
    const filter = { provider, status: 'processed' };
    if (eventId) filter.eventId = eventId;
    if (idempotencyKey) filter.idempotencyKey = idempotencyKey;

    const existing = await this.findOne(filter);
    return Boolean(existing);
  }
}

module.exports = {
  PaymentWebhookRepository,
};

