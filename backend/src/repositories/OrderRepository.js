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
    const filter = { _id: orderId };
    if (userId) filter.userId = userId;
    return this.findOne(filter);
  }

  async updateStatus(orderId, status, session = null) {
    return this.updateById(orderId, { status }, session);
  }
}

module.exports = {
  OrderRepository,
};

