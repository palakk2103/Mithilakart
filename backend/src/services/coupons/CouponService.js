const { BaseService } = require('../../core/BaseService');
const { AppError } = require('../../utils/AppError');
const { COUPON_TYPE } = require('../../constants/pricing');

// Guessing protection: this many unknown codes per customer (or IP, when logged out) per window.
const MAX_BAD_CODES = 8;
const BAD_CODE_WINDOW_SECONDS = 15 * 60;
const CODE_RE = /^[A-Z0-9_-]{3,32}$/;

/** Coupon problems are marked so the cart can fall back to a price without the coupon. */
const couponError = (error) => Object.assign(error, { isCouponError: true });
const invalidCode = () => couponError(AppError.notFound('This coupon code is not valid'));

class CouponService extends BaseService {
  constructor({ couponRepository, couponUsageRepository = null, redisClient = null }) {
    super();
    this.couponRepository = couponRepository;
    this.couponUsageRepository = couponUsageRepository;
    this.redis = redisClient;
  }

  _badCodeKey(userId, clientKey) {
    const who = userId ? `u:${userId}` : clientKey ? `ip:${clientKey}` : null;
    return who ? `coupon:bad:${who}` : null;
  }

  async _assertMayTry(key) {
    if (!this.redis || !key) return;
    const tries = Number(await this.redis.get(key)) || 0;
    if (tries >= MAX_BAD_CODES) {
      const ttl = Math.max(1, Number(await this.redis.ttl(key)) || BAD_CODE_WINDOW_SECONDS);
      throw couponError(AppError.rateLimited(
        `Too many wrong coupon codes. Please try again in ${Math.ceil(ttl / 60)} minutes.`,
        { retryAfterSeconds: ttl, locked: true }
      ));
    }
  }

  async _countBadCode(key) {
    if (!this.redis || !key) return;
    const n = await this.redis.incr(key);
    if (n === 1) await this.redis.expire(key, BAD_CODE_WINDOW_SECONDS);
  }

  _isExpired(coupon) {
    const now = new Date();
    if (coupon.startsAt && now < new Date(coupon.startsAt)) return true;
    if (coupon.expiresAt && now > new Date(coupon.expiresAt)) return true;
    return false;
  }

  _computeDiscount(coupon, subtotal) {
    const min = Number(coupon.minOrderAmount) || 0;
    if (subtotal < min) {
      const need = Math.round((min - subtotal) * 100) / 100;
      throw couponError(AppError.validation(`Add items worth ₹${need} more to use this coupon`));
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

  /**
   * @param {object[]} [p.items]  cart lines; a seller's coupon only discounts that seller's lines
   * @param {string} [p.clientKey]  IP, to rate-limit code guessing when nobody is logged in
   */
  async calculateDiscount({ code, subtotal, userId = null, sellerId = null, items = null, clientKey = null }) {
    const clean = String(code || '').toUpperCase().trim();
    const key = this._badCodeKey(userId, clientKey);
    await this._assertMayTry(key);

    const coupon = CODE_RE.test(clean) ? await this.couponRepository.findByCode(clean) : null;
    // Unknown, inactive and not-yet-started codes all answer the same.
    if (!coupon || (coupon.startsAt && new Date() < new Date(coupon.startsAt))) {
      await this._countBadCode(key);
      throw invalidCode();
    }

    if (this._isExpired(coupon)) {
      throw couponError(AppError.validation('This coupon has expired'));
    }

    if (coupon.usageLimit != null && coupon.usageCount >= coupon.usageLimit) {
      throw couponError(AppError.validation('This offer has been fully claimed'));
    }

    if (coupon.perUserLimit && this.couponUsageRepository) {
      if (!userId) throw couponError(AppError.validation('Log in to use this coupon'));
      const userUsage = await this.couponUsageRepository.countByCouponAndUser(coupon._id, userId);
      if (userUsage >= coupon.perUserLimit) {
        throw couponError(AppError.validation('You have already used this coupon'));
      }
    }

    let base = subtotal;
    if (coupon.sellerId) {
      const own = String(coupon.sellerId);
      if (Array.isArray(items)) {
        base = items
          .filter((it) => String(it.sellerId || '') === own)
          .reduce((sum, it) => sum + (Number(it.unitPrice) || 0) * (Number(it.quantity) || 0), 0);
      } else if (!sellerId || String(sellerId) !== own) {
        base = 0;
      }
      if (!(base > 0)) throw couponError(AppError.validation('This coupon is not valid for the items in your cart'));
    }

    const discount = this._computeDiscount(coupon, base);
    return { discount, coupon };
  }

  /**
   * Uses the coupon for one order, inside the order's transaction. Incrementing
   * first makes two simultaneous orders conflict on the coupon document, so the
   * per-customer count read after it is exact.
   */
  async redeem({ code, subtotal, items = null, userId, orderId }, session = null) {
    const { coupon } = await this.calculateDiscount({ code, subtotal, items, userId });
    const result = await this.couponRepository.incrementUsage(coupon._id, session);
    if (result && result.matchedCount === 0) throw couponError(AppError.conflict('This offer has been fully claimed'));
    if (!this.couponUsageRepository) return;
    if (coupon.perUserLimit) {
      const used = await this.couponUsageRepository.countByCouponAndUser(coupon._id, userId, session);
      if (used >= coupon.perUserLimit) throw couponError(AppError.conflict('You have already used this coupon'));
    }
    await this.couponUsageRepository.create({ couponId: coupon._id, userId, orderId }, session);
  }

  /** Order cancelled or never paid: the use goes back to the customer. */
  async releaseForOrder(orderId, session = null) {
    if (!this.couponUsageRepository?.releaseForOrder) return;
    const rows = await this.couponUsageRepository.releaseForOrder(orderId, session);
    for (const row of rows || []) {
      // eslint-disable-next-line no-await-in-loop
      await this.couponRepository.decrementUsage(row.couponId, session);
    }
  }

  async validateForCheckout({ code, subtotal, userId = null }) {
    return this.calculateDiscount({ code, subtotal, userId });
  }

  async validateCoupon({ code, subtotal, userId = null, clientKey = null }) {
    const result = await this.calculateDiscount({ code, subtotal, userId, clientKey });
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
      sellerId: null,
      $or: [{ expiresAt: null }, { expiresAt: { $gte: new Date() } }],
    }, { limit: 50, sort: '-createdAt' });

    // Only what a customer may see: no usage counts, limits or internal ids.
    return coupons.filter((c) => !this._isExpired(c)).map((c) => ({
      code: c.code,
      description: c.description || null,
      type: c.type,
      value: c.value,
      minOrderAmount: Number(c.minOrderAmount) || 0,
      maxDiscount: c.maxDiscount ?? null,
      expiresAt: c.expiresAt || null,
    }));
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
