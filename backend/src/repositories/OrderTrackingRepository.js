const { BaseRepository } = require('../core/BaseRepository');
const OrderTracking = require('../models/OrderTracking');

class OrderTrackingRepository extends BaseRepository {
  constructor() {
    super(OrderTracking);
  }

  async createInitial(orderId, status, note = null, metadata = {}, session = null) {
    return this.create(
      {
        orderId,
        status,
        note,
        metadata,
      },
      session
    );
  }

  async listByOrderId(orderId) {
    return this.find({ orderId }, { sort: { createdAt: 1 } });
  }
}

module.exports = {
  OrderTrackingRepository,
};

