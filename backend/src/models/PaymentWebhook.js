const mongoose = require('mongoose');

const paymentWebhookSchema = new mongoose.Schema(
  {
    provider: { type: String, required: true, index: true },
    eventId: { type: String, default: null, index: true }, // gateway event id if present
    idempotencyKey: { type: String, default: null, index: true },

    orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', default: null, index: true },
    paymentTransactionId: { type: mongoose.Schema.Types.ObjectId, ref: 'PaymentTransaction', default: null },

    status: { type: String, default: 'processed' },
    rawPayload: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  {
    timestamps: true,
    collection: 'payment_webhooks',
  }
);

paymentWebhookSchema.index({ provider: 1, eventId: 1 }, { unique: false });

module.exports =
  mongoose.models.PaymentWebhook ||
  mongoose.model('PaymentWebhook', paymentWebhookSchema);

