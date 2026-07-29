const { BaseRepository } = require('../core/BaseRepository');
const Order = require('../models/Order');

class OrderRepository extends BaseRepository {
  constructor() {
    super(Order);
  }

  async findByUser(userId, options = {}) {
    return this.find({ userId, deletedAt: null }, options);
  }

  async findActiveById(orderId, userId = null) {
    const isObjectId = typeof orderId === 'string' && /^[0-9a-fA-F]{24}$/.test(orderId);
    const filter = isObjectId ? { _id: orderId } : { orderNumber: String(orderId) };
    if (userId) filter.userId = userId;
    return this.findOne(filter);
  }

  async findByIdempotencyKey(idempotencyKey, userId = null) {
    if (!idempotencyKey) return null;
    const filter = { idempotencyKey, deletedAt: null };
    if (userId) filter.userId = userId;
    return this.findOne(filter, { sort: { createdAt: -1 } });
  }

  async findUnpaidPendingByUser(userId, options = {}) {
    return this.find(
      {
        userId,
        deletedAt: null,
        status: 'pending',
        paymentStatus: 'pending',
        inventoryDeducted: false,
      },
      options
    );
  }

  async updateStatus(orderId, status, session = null) {
    return this.updateById(orderId, { status }, session);
  }

  /**
   * Atomically update status only if the current status matches expectedFromStatus.
   * Returns null if the precondition fails (status already changed by another actor).
   */
  async updateStatusOptimistic(orderId, expectedFromStatus, toStatus, session = null) {
    return this.model.findOneAndUpdate(
      { _id: orderId, status: expectedFromStatus },
      { $set: { status: toStatus } },
      { new: true, session }
    );
  }
}

module.exports = {
  OrderRepository,
};

