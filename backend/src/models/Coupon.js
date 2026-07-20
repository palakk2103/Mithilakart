const mongoose = require('mongoose');
const { COUPON_TYPE_VALUES, COUPON_SCOPE_VALUES } = require('../constants/pricing');

const couponSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true, index: true },
    description: { type: String, default: null },
    type: { type: String, enum: COUPON_TYPE_VALUES, required: true },
    value: { type: Number, required: true, min: 0 },
    minOrderAmount: { type: Number, default: 0, min: 0 },
    maxDiscount: { type: Number, default: null, min: 0 },
    perUserLimit: { type: Number, default: null, min: 1 },
    usageLimit: { type: Number, default: null, min: 1 },
    usageCount: { type: Number, default: 0, min: 0 },
    scope: { type: String, enum: COUPON_SCOPE_VALUES, default: 'platform' },
    sellerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Seller', default: null, index: true },
    isActive: { type: Boolean, default: true, index: true },
    startsAt: { type: Date, default: null },
    expiresAt: { type: Date, default: null },
    deletedAt: { type: Date, default: null },
  },
  {
    timestamps: true,
    collection: 'coupons',
  }
);

couponSchema.index({ sellerId: 1, isActive: 1 });

module.exports = mongoose.models.Coupon || mongoose.model('Coupon', couponSchema);
