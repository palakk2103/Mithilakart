const { BaseRepository } = require('../core/BaseRepository');
const OrderStatusHistory = require('../models/OrderStatusHistory');

class OrderStatusHistoryRepository extends BaseRepository {
  constructor() {
    super(OrderStatusHistory);
  }

  async addTransition({ orderId, fromStatus, toStatus, changedBy, changedById, note = null }, session = null) {
    return this.create(
      {
        orderId,
        fromStatus: fromStatus || null,
        toStatus,
        changedBy: changedBy || null,
        changedById: changedById || null,
        note,
      },
      session
    );
  }

  async listByOrderId(orderId) {
    return this.find({ orderId }, { sort: { createdAt: 1 } });
  }
}

module.exports = {
  OrderStatusHistoryRepository,
};

