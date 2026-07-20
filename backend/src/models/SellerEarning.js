const mongoose = require('mongoose');

const sellerEarningSchema = new mongoose.Schema(
  {
    sellerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Seller', required: true, index: true },
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', default: null, index: true },
    orderItemId: { type: mongoose.Schema.Types.ObjectId, ref: 'OrderItem', default: null },
    grossAmount: { type: Number, required: true, min: 0 },
    commission: { type: Number, required: true, min: 0 },
    netAmount: { type: Number, required: true, min: 0 },
    type: { type: String, enum: ['order', 'adjustment', 'payout'], default: 'order' },
    referenceId: { type: mongoose.Schema.Types.ObjectId, default: null },
    note: { type: String, default: null },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    collection: 'seller_earnings',
  }
);

sellerEarningSchema.index({ sellerId: 1, createdAt: -1 });

module.exports =
  mongoose.models.SellerEarning ||
  mongoose.model('SellerEarning', sellerEarningSchema);
