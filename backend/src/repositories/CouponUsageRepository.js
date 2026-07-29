const { BaseRepository } = require('../core/BaseRepository');
const CouponUsage = require('../models/CouponUsage');

class CouponUsageRepository extends BaseRepository {
  constructor() {
    super(CouponUsage);
  }

  async countByCouponAndUser(couponId, userId) {
    return this.count({ couponId, userId, deletedAt: null });
  }

  async countByCoupon(couponId) {
    return this.count({ couponId, deletedAt: null });
  }
}

module.exports = { CouponUsageRepository };
