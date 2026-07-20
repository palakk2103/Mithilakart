const mongoose = require('mongoose');
const { REVIEW_STATUS_VALUES } = require('../constants/engagement');

const reviewSchema = new mongoose.Schema(
  {
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true, index: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true, index: true },
    sellerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Seller', required: true, index: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    title: { type: String, default: null, trim: true },
    body: { type: String, required: true, trim: true },
    images: { type: [String], default: [] },
    isVerifiedPurchase: { type: Boolean, default: true },
    status: { type: String, enum: REVIEW_STATUS_VALUES, default: 'pending', index: true },
    sellerReply: { type: String, default: null },
    sellerRepliedAt: { type: Date, default: null },
    reportedAt: { type: Date, default: null },
    reportReason: { type: String, default: null },
    deletedAt: { type: Date, default: null },
  },
  {
    timestamps: true,
    collection: 'reviews',
  }
);

reviewSchema.index({ productId: 1, userId: 1, orderId: 1 }, { unique: true });
reviewSchema.index({ sellerId: 1, status: 1, createdAt: -1 });

module.exports = mongoose.models.Review || mongoose.model('Review', reviewSchema);
