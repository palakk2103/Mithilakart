const mongoose = require('mongoose');

const userPaymentMethodSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: { type: String, enum: ['VISA', 'MASTERCARD', 'RUPAY', 'UPI', 'OTHER'], default: 'VISA' },
    last4: { type: String, required: true, trim: true },
    expiryMonth: { type: String, trim: true, default: null },
    expiryYear: { type: String, trim: true, default: null },
    holderName: { type: String, required: true, trim: true },
    gatewayToken: { type: String, default: null },
    isDefault: { type: Boolean, default: false, index: true },
    deletedAt: { type: Date, default: null },
  },
  {
    timestamps: true,
    collection: 'user_payment_methods',
  }
);

userPaymentMethodSchema.index({ userId: 1, isDefault: 1 });

module.exports =
  mongoose.models.UserPaymentMethod ||
  mongoose.model('UserPaymentMethod', userPaymentMethodSchema);
