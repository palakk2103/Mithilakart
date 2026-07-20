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
