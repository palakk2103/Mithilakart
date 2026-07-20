const mongoose = require('mongoose');
const { REFUND_METHOD_VALUES, REFUND_STATUS_VALUES } = require('../constants/wallet');

const refundSchema = new mongoose.Schema(
  {
    returnId: { type: mongoose.Schema.Types.ObjectId, ref: 'Return', required: true, index: true },
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true, index: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    amount: { type: Number, required: true, min: 0 },
    method: { type: String, enum: REFUND_METHOD_VALUES, default: 'wallet' },
    status: { type: String, enum: REFUND_STATUS_VALUES, default: 'pending', index: true },
    idempotencyKey: { type: String, default: null, index: true, sparse: true },
    processedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'AdminUser', default: null },
    processedAt: { type: Date, default: null },
    failureReason: { type: String, default: null },
    deletedAt: { type: Date, default: null },
  },
  {
    timestamps: true,
    collection: 'refunds',
  }
);

refundSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.models.Refund || mongoose.model('Refund', refundSchema);
