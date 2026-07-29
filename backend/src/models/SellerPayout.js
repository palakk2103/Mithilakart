const mongoose = require('mongoose');

const sellerPayoutSchema = new mongoose.Schema(
  {
    sellerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Seller', required: true, index: true },
    amount: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'rejected'],
      default: 'pending',
      index: true,
    },
    bankSnapshot: { type: mongoose.Schema.Types.Mixed, default: {} },
    processedAt: { type: Date, default: null },
    rejectionReason: { type: String, default: null },
  },
  {
    timestamps: true,
    collection: 'seller_payouts',
  }
);

module.exports =
  mongoose.models.SellerPayout ||
  mongoose.model('SellerPayout', sellerPayoutSchema);
