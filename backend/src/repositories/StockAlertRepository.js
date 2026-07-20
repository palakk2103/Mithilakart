const { BaseRepository } = require('../core/BaseRepository');
const StockAlert = require('../models/StockAlert');

class StockAlertRepository extends BaseRepository {
  constructor() {
    super(StockAlert);
  }

  async listBySeller(sellerId, filter = {}) {
    return this.find({ sellerId, isResolved: false, ...filter }, { sort: { createdAt: -1 } });
  }
}

module.exports = { StockAlertRepository };
