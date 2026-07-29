const { BaseRepository } = require('../core/BaseRepository');
const InventoryHistory = require('../models/InventoryHistory');

class InventoryHistoryRepository extends BaseRepository {
  constructor() {
    super(InventoryHistory);
  }

  async listByProduct(productId, sellerId, options = {}) {
    return this.find({ productId, sellerId }, { sort: { createdAt: -1 }, ...options });
  }
}

module.exports = { InventoryHistoryRepository };
