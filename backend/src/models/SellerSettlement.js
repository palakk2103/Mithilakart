const mongoose = require('mongoose');

const sellerSettlementSchema = new mongoose.Schema(
  {
    sellerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Seller', required: true, index: true },
    periodStart: { type: Date, required: true },
    periodEnd: { type: Date, required: true },
    grossAmount: { type: Number, default: 0, min: 0 },
    commission: { type: Number, default: 0, min: 0 },
    netAmount: { type: Number, default: 0, min: 0 },
    status: { type: String, enum: ['pending', 'settled'], default: 'pending' },
  },
  {
    timestamps: true,
    collection: 'seller_settlements',
  }
);

module.exports =
  mongoose.models.SellerSettlement ||
  mongoose.model('SellerSettlement', sellerSettlementSchema);
