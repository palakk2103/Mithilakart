const mongoose = require('mongoose');
const { PAYMENT_METHOD, PAYMENT_STATUS } = require('../constants/commerce');

const paymentTransactionSchema = new mongoose.Schema(
  {
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true, index: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },

    paymentMethod: { type: String, enum: Object.values(PAYMENT_METHOD), required: true },
    provider: { type: String, default: null, index: true }, // e.g., 'razorpay' or 'mock'

    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, default: 'INR' },

    status: { type: String, enum: Object.values(PAYMENT_STATUS), default: PAYMENT_STATUS.PENDING, index: true },

    idempotencyKey: { type: String, default: null, index: true },
    providerPaymentId: { type: String, default: null, index: true },

    rawRequest: { type: mongoose.Schema.Types.Mixed, default: {} },
    rawResponse: { type: mongoose.Schema.Types.Mixed, default: {} },

    deletedAt: { type: Date, default: null },
  },
  {
    timestamps: true,
    collection: 'payment_transactions',
  }
);

paymentTransactionSchema.index({ orderId: 1, idempotencyKey: 1 }, { unique: false });

module.exports =
  mongoose.models.PaymentTransaction ||
  mongoose.model('PaymentTransaction', paymentTransactionSchema);

