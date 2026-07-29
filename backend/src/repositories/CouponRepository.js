const { BaseRepository } = require('../core/BaseRepository');
const Coupon = require('../models/Coupon');

class CouponRepository extends BaseRepository {
  constructor() {
    super(Coupon);
  }

  async findByCode(code) {
    return this.findOne({
      code: String(code).toUpperCase().trim(),
      deletedAt: null,
      isActive: true,
    });
  }

  async findBySeller(sellerId, options = {}) {
    return this.find({ sellerId, deletedAt: null }, options);
  }

  async countBySeller(sellerId, filter = {}) {
    return this.count({ sellerId, deletedAt: null, ...filter });
  }

  async incrementUsage(id, session = null) {
    const query = this.model.updateOne({ _id: id }, { $inc: { usageCount: 1 } });
    if (session) query.session(session);
    return query.exec();
  }
}

module.exports = {
  CouponRepository,
};
