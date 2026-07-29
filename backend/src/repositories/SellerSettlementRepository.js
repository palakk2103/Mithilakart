const { BaseRepository } = require('../core/BaseRepository');
const SellerSettlement = require('../models/SellerSettlement');

class SellerSettlementRepository extends BaseRepository {
  constructor() {
    super(SellerSettlement);
  }

  async findBySeller(sellerId, options = {}) {
    return this.find({ sellerId }, { sort: { periodEnd: -1 }, ...options });
  }
}

module.exports = { SellerSettlementRepository };
