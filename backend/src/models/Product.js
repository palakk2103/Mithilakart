const mongoose = require('mongoose');
const { COMMERCE_FLOW_VALUES, PRODUCT_STATUS_VALUES } = require('../constants/catalog');

const productImageSchema = new mongoose.Schema(
  {
    url: { type: String, required: true },
    alt: { type: String, default: '' },
    sortOrder: { type: Number, default: 0 },
  },
  { _id: false }
);

const productVideoSchema = new mongoose.Schema(
  {
    url: { type: String, required: true },
    alt: { type: String, default: '' },
    sortOrder: { type: Number, default: 0 },
  },
  { _id: false }
);

const productSchema = new mongoose.Schema(
  {
    sellerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Seller', required: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    sku: { type: String, required: true, trim: true },
    price: { type: Number, required: true, min: 0 },
    mrp: { type: Number, required: true, min: 0 },
    stock: { type: Number, default: 0, min: 0 },
    reservedStock: { type: Number, default: 0, min: 0 },
    categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
    status: { type: String, enum: PRODUCT_STATUS_VALUES, default: 'pending' },
    masterStatus: { type: String, enum: PRODUCT_STATUS_VALUES, default: 'pending' },
    moderationNote: { type: String, default: null },
    images: { type: [productImageSchema], default: [] },
    videos: { type: [productVideoSchema], default: [] },
    tags: { type: [String], default: [] },
    commerceFlows: {
      type: [{ type: String, enum: COMMERCE_FLOW_VALUES }],
      default: ['standard'],
    },
    rating: { type: Number, default: 0, min: 0, max: 5 },
    reviewCount: { type: Number, default: 0, min: 0 },
    brand: { type: String, default: '' },
    attributes: { type: mongoose.Schema.Types.Mixed, default: {} },

    /**
     * CR-002 — cross-seller catalog identity.
     *
     * Products are seller-owned (`sellerId` is required, `{sellerId, sku}` is
     * unique), so there is otherwise no way to ask "which other sellers stock
     * this same thing?". Two products sharing a non-null catalogKey are
     * declared BY ADMIN to be the same sellable item and become substitutable
     * for one another during fulfillment.
     *
     * null (the default, and every pre-CR-002 product) means the product is
     * NOT substitutable — only its owning seller can fulfil it, which is
     * exactly the pre-CR-002 behaviour.
     *
     * Never auto-derived from fuzzy title matching: a wrong key means the
     * customer receives a different product than they ordered.
     */
    catalogKey: { type: String, default: null, trim: true },

    pickupCoordinates: {
      latitude: { type: Number, default: null },
      longitude: { type: Number, default: null },
    },
    pickupAddress: { type: String, trim: true, default: null },
    city: { type: String, trim: true, default: null },
    pickupPointId: { type: mongoose.Schema.Types.ObjectId, default: null },

    deletedAt: { type: Date, default: null },
  },
  {
    timestamps: true,
    collection: 'products',
  }
);

productSchema.index({ sellerId: 1, status: 1, createdAt: -1 });
productSchema.index({ categoryId: 1, status: 1, commerceFlows: 1 });
productSchema.index({ status: 1, createdAt: -1 });
productSchema.index({ sellerId: 1, sku: 1 }, { unique: true, partialFilterExpression: { deletedAt: null } });
// CR-002 — candidate lookup: "which sellers stock this catalog item?".
// Partial, so the null-keyed majority costs nothing.
productSchema.index(
  { catalogKey: 1, sellerId: 1 },
  { partialFilterExpression: { catalogKey: { $type: 'string' }, deletedAt: null } }
);
productSchema.index(
  { title: 'text', description: 'text', tags: 'text', brand: 'text' },
  { weights: { title: 10, tags: 5, brand: 3, description: 1 } }
);

module.exports = mongoose.models.Product || mongoose.model('Product', productSchema);
