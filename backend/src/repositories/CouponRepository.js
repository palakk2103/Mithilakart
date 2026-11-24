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

  /** Counts one use; matches nothing once the total limit is reached, so two orders cannot share the last use. */
  async incrementUsage(id, session = null) {
    const query = this.model.updateOne(
      {
        _id: id,
        $or: [{ usageLimit: null }, { $expr: { $lt: ['$usageCount', '$usageLimit'] } }],
      },
      { $inc: { usageCount: 1 } }
    );
    if (session) query.session(session);
    return query.exec();
  }

  async decrementUsage(id, session = null) {
    const query = this.model.updateOne({ _id: id, usageCount: { $gt: 0 } }, { $inc: { usageCount: -1 } });
    if (session) query.session(session);
    return query.exec();
  }
}

module.exports = {
  CouponRepository,
};
