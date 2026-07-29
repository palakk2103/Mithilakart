const mongoose = require('mongoose');
const {
  MARKETPLACE_TAB_VALUES,
  DELIVERY_TYPE_VALUES,
  LISTING_STATUS_VALUES,
  LISTING_STATUS,
} = require('../constants/marketplace');

const marketplaceListingSchema = new mongoose.Schema(
  {
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true, index: true },
    sellerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Seller', required: true, index: true },
    marketplaceTab: { type: String, enum: MARKETPLACE_TAB_VALUES, required: true, index: true },

    price: { type: Number, required: true, min: 0 },
    mrp: { type: Number, required: true, min: 0 },
    maxOrderQuantity: { type: Number, default: null, min: 1 },

    listingStatus: {
      type: String,
      enum: LISTING_STATUS_VALUES,
      default: LISTING_STATUS.DRAFT,
      index: true,
    },
    isVisible: { type: Boolean, default: false },
    moderationNote: { type: String, default: null },

    deliveryType: { type: String, enum: DELIVERY_TYPE_VALUES, required: true },
    deliveryPromiseMinutes: { type: Number, default: null },

    promotionTags: { type: [String], default: [] },
    sortBoost: { type: Number, default: 0 },

    publishedAt: { type: Date, default: null },
    approvedAt: { type: Date, default: null },
    rejectedAt: { type: Date, default: null },
    deletedAt: { type: Date, default: null },
  },
  {
    timestamps: true,
    collection: 'marketplace_listings',
  }
);

marketplaceListingSchema.index(
  { productId: 1, marketplaceTab: 1 },
  { unique: true, partialFilterExpression: { deletedAt: null } }
);
marketplaceListingSchema.index({ sellerId: 1, marketplaceTab: 1, listingStatus: 1 });
marketplaceListingSchema.index({ marketplaceTab: 1, listingStatus: 1, isVisible: 1, price: 1 });
marketplaceListingSchema.index({ productId: 1, listingStatus: 1 });

module.exports =
  mongoose.models.MarketplaceListing
  || mongoose.model('MarketplaceListing', marketplaceListingSchema);
