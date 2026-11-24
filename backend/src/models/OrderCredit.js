const mongoose = require('mongoose');

/**
 * What one order used besides its payment: a gift card, wallet money or a
 * cashback slot. `key` is unique, which is what makes every use happen once:
 *   gift:<orderId> · wallet:<orderId> · cashback:<campaign>:<userId>:<n>
 * Releasing (order cancelled / never paid) sets releasedAt; a cashback slot is
 * removed instead, so the customer can use it again.
 */
const orderCreditSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true },
    kind: { type: String, enum: ['gift_card', 'wallet', 'cashback'], required: true },
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true, index: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    giftCardId: { type: mongoose.Schema.Types.ObjectId, ref: 'GiftCard', default: null, index: true },
    campaign: { type: String, default: null },
    amount: { type: Number, required: true, min: 0 },
    releasedAt: { type: Date, default: null },
  },
  { timestamps: true, collection: 'order_credits' }
);

module.exports = mongoose.models.OrderCredit || mongoose.model('OrderCredit', orderCreditSchema);
