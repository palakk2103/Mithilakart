const mongoose = require('mongoose');
const { RETURN_STATUS_VALUES } = require('../constants/pricing');

const returnSchema = new mongoose.Schema(
  {
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true, index: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    sellerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Seller', required: true, index: true },
    orderItemId: { type: mongoose.Schema.Types.ObjectId, ref: 'OrderItem', required: true },
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    quantity: { type: Number, required: true, min: 1 },
    reason: { type: String, default: null },
    images: { type: [String], default: [] },
    status: { type: String, enum: RETURN_STATUS_VALUES, default: 'requested', index: true },
    sellerNote: { type: String, default: null },
    adminNote: { type: String, default: null },
    deletedAt: { type: Date, default: null },
  },
  {
    timestamps: true,
    collection: 'returns',
  }
);

returnSchema.index({ sellerId: 1, status: 1, createdAt: -1 });

module.exports = mongoose.models.Return || mongoose.model('Return', returnSchema);
