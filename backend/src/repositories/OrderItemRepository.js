const { BaseRepository } = require('../core/BaseRepository');
const OrderItem = require('../models/OrderItem');

class OrderItemRepository extends BaseRepository {
  constructor() {
    super(OrderItem);
  }

  async listByOrderId(orderId) {
    return this.find({ orderId, deletedAt: null });
  }

  async countDistinctOrdersBySeller(sellerId) {
    const result = await this.model.aggregate([
      { $match: { sellerId, deletedAt: null } },
      { $group: { _id: '$orderId' } },
      { $count: 'total' },
    ]);

    return result[0]?.total || 0;
  }

  async listDistinctOrderIdsBySeller(sellerId, { skip = 0, limit = 20 } = {}) {
    const rows = await this.model.aggregate([
      { $match: { sellerId, deletedAt: null } },
      { $group: { _id: '$orderId', lastAt: { $max: '$createdAt' } } },
      { $sort: { lastAt: -1 } },
      { $skip: skip },
      { $limit: limit },
    ]);

    return rows.map((row) => row._id);
  }

  async createMany(items, session = null) {
    if (!Array.isArray(items) || items.length === 0) {
      return [];
    }

    if (session) {
      const docs = await this.model.insertMany(items, { session });
      return docs;
    }

    return this.model.insertMany(items);
  }
}

module.exports = {
  OrderItemRepository,
};

