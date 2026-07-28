const mongoose = require('mongoose');
const { COMMERCE_FLOW_VALUES } = require('../constants/catalog');
const { MARKETPLACE_TAB_VALUES } = require('../constants/marketplace');

const cartSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null, index: true },
    sessionId: { type: String, default: null, index: true },
    status: { type: String, enum: ['active', 'inactive'], default: 'active', index: true },
    commerceFlow: {
      type: String,
      enum: COMMERCE_FLOW_VALUES,
      default: 'standard',
    },
    marketplaceTab: {
      type: String,
      enum: MARKETPLACE_TAB_VALUES,
      default: null,
    },
    currency: { type: String, default: 'INR' },
    subtotal: { type: Number, default: 0 },
    shippingFee: { type: Number, default: 0 },
    total: { type: Number, default: 0 },
    lastActiveAt: { type: Date, default: Date.now },
    deletedAt: { type: Date, default: null },
  },
  {
    timestamps: true,
    collection: 'carts',
  }
);

cartSchema.index({ lastActiveAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 30 }); // ~30d

module.exports = mongoose.models.Cart || mongoose.model('Cart', cartSchema);

