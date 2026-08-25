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
    // Indexed via the PARTIAL unique index declared below, not field-level
    // `index: true` (that would register a second, conflicting index). See
    // Order.js for why `sparse` alone is not safe with a `default: null`
    // field.
    idempotencyKey: { type: String, default: null },
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
refundSchema.index(
  { idempotencyKey: 1 },
  { unique: true, partialFilterExpression: { idempotencyKey: { $type: 'string' } } }
);

module.exports = mongoose.models.Refund || mongoose.model('Refund', refundSchema);
