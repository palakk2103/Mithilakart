const { BaseService } = require('../../core/BaseService');
const { AppError } = require('../../utils/AppError');
const { COUPON_TYPE } = require('../../constants/pricing');

class CouponService extends BaseService {
  constructor({ couponRepository, couponUsageRepository = null }) {
    super();
    this.couponRepository = couponRepository;
    this.couponUsageRepository = couponUsageRepository;
  }

  _isExpired(coupon) {
    const now = new Date();
    if (coupon.startsAt && now < new Date(coupon.startsAt)) return true;
    if (coupon.expiresAt && now > new Date(coupon.expiresAt)) return true;
    return false;
  }

  _computeDiscount(coupon, subtotal) {
    if (subtotal < (coupon.minOrderAmount || 0)) {
      throw AppError.validation('Order amount does not meet coupon minimum');
    }

    let discount = 0;
    if (coupon.type === COUPON_TYPE.PERCENT) {
      discount = (subtotal * coupon.value) / 100;
    } else {
      discount = coupon.value;
    }

    if (coupon.maxDiscount != null) {
      discount = Math.min(discount, coupon.maxDiscount);
    }

    return Math.min(discount, subtotal);
  }

  async calculateDiscount({ code, subtotal, userId = null, sellerId = null }) {
    const coupon = await this.couponRepository.findByCode(code);
    if (!coupon) {
      throw AppError.notFound('Coupon not found');
    }

    if (this._isExpired(coupon)) {
      throw AppError.validation('Coupon has expired');
    }

    if (coupon.usageLimit != null && coupon.usageCount >= coupon.usageLimit) {
      throw AppError.validation('Coupon usage limit reached');
    }

    if (userId && coupon.perUserLimit && this.couponUsageRepository) {
      const userUsage = await this.couponUsageRepository.countByCouponAndUser(coupon._id, userId);
      if (userUsage >= coupon.perUserLimit) {
        throw AppError.validation('Coupon usage limit reached for this user');
      }
    }

    if (coupon.sellerId && sellerId && String(coupon.sellerId) !== String(sellerId)) {
      throw AppError.validation('Coupon not valid for this seller');
    }

    const discount = this._computeDiscount(coupon, subtotal);
    return { discount, coupon };
  }

  async validateForCheckout({ code, subtotal, userId = null }) {
    return this.calculateDiscount({ code, subtotal, userId });
  }

  async validateCoupon({ code, subtotal, userId = null }) {
    const result = await this.calculateDiscount({ code, subtotal, userId });
    return {
      valid: true,
      code: result.coupon.code,
      discount: result.discount,
      type: result.coupon.type,
      value: result.coupon.value,
    };
  }

  async listForUser(_userId) {
    const coupons = await this.couponRepository.find({
      isActive: true,
      deletedAt: null,
      $or: [{ expiresAt: null }, { expiresAt: { $gte: new Date() } }],
    }, { limit: 50, sort: '-createdAt' });

    return coupons;
  }

  /**
   * CART-3 "Coupons & Offers": every live platform coupon with what it means
   * for this cart — Apply (eligible, with the saving) or Locked ("Shop for ₹877
   * more", "Already used"). Same rules as calculateDiscount, so a coupon shown
   * as eligible is one the order will accept.
   */
  async listOffers({ userId = null, subtotal = 0 }) {
    const now = new Date();
    const coupons = await this.couponRepository.find({
      isActive: true,
      deletedAt: null,
      sellerId: null,
      $or: [{ expiresAt: null }, { expiresAt: { $gte: now } }],
    }, { limit: 50, sort: '-createdAt' });

    const value = Math.max(0, Number(subtotal) || 0);
    const offers = await Promise.all(coupons.filter((c) => !this._isExpired(c)).map(async (c) => {
      const min = Number(c.minOrderAmount) || 0;
      let lockedReason = null;
      let amountNeeded = 0;
      if (c.usageLimit != null && c.usageCount >= c.usageLimit) lockedReason = 'Offer fully claimed';
      if (!lockedReason && userId && c.perUserLimit && this.couponUsageRepository) {
        const used = await this.couponUsageRepository.countByCouponAndUser(c._id, userId);
        if (used >= c.perUserLimit) lockedReason = 'Already used';
      }
      if (!lockedReason && value < min) {
        amountNeeded = Math.round((min - value) * 100) / 100;
        lockedReason = `Shop for ₹${amountNeeded} more to apply`;
      }
      // What it is worth: on this cart if eligible, else at the minimum order.
      let saving = 0;
      try { saving = this._computeDiscount(c, lockedReason ? Math.max(value, min) : value); } catch { saving = 0; }
      saving = Math.round(saving * 100) / 100;
      return {
        code: c.code,
        description: c.description || null,
        type: c.type,
        value: c.value,
        maxDiscount: c.maxDiscount ?? null,
        minOrderAmount: min,
        expiresAt: c.expiresAt || null,
        eligible: !lockedReason && saving > 0,
        lockedReason,
        amountNeeded,
        saving,
        title: `Save ₹${saving} with ${c.code}`,
      };
    }));

    return offers.sort((a, b) => (Number(b.eligible) - Number(a.eligible))
      || (a.eligible ? b.saving - a.saving : a.amountNeeded - b.amountNeeded));
  }

  async listBySeller(sellerId, query = {}) {
    const page = Number(query.page) || 1;
    const limit = Math.min(Number(query.limit) || 20, 100);
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      this.couponRepository.findBySeller(sellerId, { skip, limit, sort: '-createdAt' }),
      this.couponRepository.countBySeller(sellerId),
    ]);

    return { items, total, page, limit };
  }

  async createForSeller(sellerId, data) {
    return this.couponRepository.create({
      ...data,
      code: String(data.code).toUpperCase().trim(),
      sellerId,
      scope: 'seller',
    });
  }

  async updateForSeller(sellerId, couponId, data) {
    const coupon = await this.couponRepository.findOne({ _id: couponId, sellerId, deletedAt: null });
    if (!coupon) throw AppError.notFound('Coupon not found');

    const update = { ...data };
    if (update.code) update.code = String(update.code).toUpperCase().trim();
    return this.couponRepository.updateById(couponId, update);
  }

  async incrementUsage(id, session = null) {
    return this.couponRepository.incrementUsage(id, session);
  }
}

module.exports = {
  CouponService,
};
