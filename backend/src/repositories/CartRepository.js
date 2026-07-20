const { BaseRepository } = require('../core/BaseRepository');
const Cart = require('../models/Cart');

class CartRepository extends BaseRepository {
  constructor() {
    super(Cart);
  }

  async findActiveByUser(userId) {
    return this.findOne({ userId, status: 'active', deletedAt: null });
  }

  async findActiveBySession(sessionId) {
    return this.findOne({ sessionId, status: 'active', deletedAt: null });
  }

  async upsertActiveCart({ userId, sessionId, commerceFlow, currency = 'INR' }, session = null) {
    const filter = { userId: userId || null, sessionId: sessionId || null, status: 'active', deletedAt: null };
    const existing = await this.findOne(filter, { session });

    if (existing) {
      const updated = await this.updateById(
        existing._id,
        { commerceFlow: commerceFlow || existing.commerceFlow, currency, lastActiveAt: new Date() },
        session
      );
      return updated;
    }

    return this.create(
      {
        userId: userId || null,
        sessionId: sessionId || null,
        commerceFlow: commerceFlow || 'standard',
        currency,
        subtotal: 0,
        shippingFee: 0,
        total: 0,
        lastActiveAt: new Date(),
      },
      session
    );
  }
}

module.exports = {
  CartRepository,
};

