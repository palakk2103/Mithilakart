const { BaseRepository } = require('../core/BaseRepository');
const SellerPayout = require('../models/SellerPayout');

class SellerPayoutRepository extends BaseRepository {
  constructor() {
    super(SellerPayout);
  }

  async findBySeller(sellerId, options = {}) {
    return this.find({ sellerId }, { sort: { createdAt: -1 }, ...options });
  }
}

module.exports = { SellerPayoutRepository };
