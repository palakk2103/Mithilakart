const mongoose = require('mongoose');

const couponUsageSchema = new mongoose.Schema(
  {
    couponId: { type: mongoose.Schema.Types.ObjectId, ref: 'Coupon', required: true, index: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', default: null, index: true },
    deletedAt: { type: Date, default: null },
  },
  {
    timestamps: true,
    collection: 'coupon_usages',
  }
);

couponUsageSchema.index({ couponId: 1, userId: 1 });

module.exports = mongoose.models.CouponUsage || mongoose.model('CouponUsage', couponUsageSchema);
