const { BaseRepository } = require('../core/BaseRepository');
const DeliveryEarning = require('../models/DeliveryEarning');

class DeliveryEarningRepository extends BaseRepository {
  constructor() {
    super(DeliveryEarning);
  }

  async findByPartner(partnerId, options = {}) {
    return this.find({ partnerId, deletedAt: null }, options);
  }

  async sumByPartner(partnerId, filter = {}) {
    const result = await this.model.aggregate([
      { $match: { partnerId, deletedAt: null, ...filter } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);
    return result[0]?.total || 0;
  }
}

module.exports = { DeliveryEarningRepository };
