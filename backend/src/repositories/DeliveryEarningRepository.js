const mongoose = require('mongoose');
const { BaseRepository } = require('../core/BaseRepository');
const DeliveryEarning = require('../models/DeliveryEarning');

class DeliveryEarningRepository extends BaseRepository {
  constructor() {
    super(DeliveryEarning);
  }

  _toPartnerObjectId(partnerId) {
    return new mongoose.Types.ObjectId(String(partnerId));
  }

  async findByPartner(partnerId, options = {}) {
    return this.find({ partnerId: this._toPartnerObjectId(partnerId), deletedAt: null }, options);
  }

  async sumByPartner(partnerId, filter = {}) {
    const result = await this.model.aggregate([
      { $match: { partnerId: this._toPartnerObjectId(partnerId), deletedAt: null, ...filter } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);
    return result[0]?.total || 0;
  }
}

module.exports = { DeliveryEarningRepository };
