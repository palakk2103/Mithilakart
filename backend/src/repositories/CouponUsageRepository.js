const { BaseRepository } = require('../core/BaseRepository');
const CouponUsage = require('../models/CouponUsage');

class CouponUsageRepository extends BaseRepository {
  constructor() {
    super(CouponUsage);
  }

  async countByCouponAndUser(couponId, userId, session = null) {
    return this.count({ couponId, userId, deletedAt: null }, session);
  }

  /** Give the use back when its order is cancelled or never paid. Returns the released rows. */
  async releaseForOrder(orderId, session = null) {
    const find = this.model.find({ orderId, deletedAt: null });
    if (session) find.session(session);
    const rows = await find.lean().exec();
    if (!rows.length) return [];
    const upd = this.model.updateMany({ _id: { $in: rows.map((r) => r._id) } }, { $set: { deletedAt: new Date() } });
    if (session) upd.session(session);
    await upd.exec();
    return rows;
  }

  async countByCoupon(couponId) {
    return this.count({ couponId, deletedAt: null });
  }
}

module.exports = { CouponUsageRepository };
