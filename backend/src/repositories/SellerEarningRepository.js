const { BaseRepository } = require('../core/BaseRepository');
const SellerEarning = require('../models/SellerEarning');
const mongoose = require('mongoose');

class SellerEarningRepository extends BaseRepository {
  constructor() {
    super(SellerEarning);
  }

  async findBySeller(sellerId, options = {}) {
    return this.find({ sellerId }, { sort: { createdAt: -1 }, ...options });
  }

  async sumNetBySeller(sellerId) {
    const result = await this.model.aggregate([
      { $match: { sellerId: new mongoose.Types.ObjectId(String(sellerId)) } },
      { $group: { _id: null, total: { $sum: '$netAmount' } } },
    ]);
    return result[0]?.total || 0;
  }
}

module.exports = { SellerEarningRepository };
