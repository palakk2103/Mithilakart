const mongoose = require('mongoose');
const { MARKETPLACE_TAB_VALUES } = require('../constants/marketplace');

const wishlistSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true, index: true },
    // Tab the shopper saved it from, so the wishlist shows it under that tab whatever tab is open.
    marketplaceTab: { type: String, enum: [...MARKETPLACE_TAB_VALUES, null], default: null },
    deletedAt: { type: Date, default: null },
  },
  {
    timestamps: true,
    collection: 'wishlists',
  }
);

wishlistSchema.index({ userId: 1, productId: 1 }, { unique: true });

module.exports = mongoose.models.Wishlist || mongoose.model('Wishlist', wishlistSchema);
