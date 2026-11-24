const mongoose = require('mongoose');

/**
 * A gift card. The code itself is never stored: only its SHA-256 hash (codes
 * carry 80 random bits, so the hash cannot be reversed by guessing) and the
 * last four characters for support. Admin sees the full code once, on creation.
 */
const giftCardSchema = new mongoose.Schema(
  {
    codeHash: { type: String, required: true, unique: true, select: false },
    last4: { type: String, required: true },
    initialAmount: { type: Number, required: true, min: 1 },
    balance: { type: Number, required: true, min: 0 },
    // When set, only the customer with this mobile number can use the card, so a
    // code stolen by phishing is worthless to anyone else.
    phone: { type: String, default: null },
    note: { type: String, default: '', maxlength: 200 },
    expiresAt: { type: Date, default: null },
    isActive: { type: Boolean, default: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'AdminUser', default: null },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true, collection: 'gift_cards' }
);

giftCardSchema.index({ createdAt: -1 });

module.exports = mongoose.models.GiftCard || mongoose.model('GiftCard', giftCardSchema);
