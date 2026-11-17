const mongoose = require('mongoose');

/**
 * A package the customer can customise by ticking / unticking its items
 * (e.g. "Mithila Dwirangman" — ₹3500, 24 items).
 *
 * The package is sold through an ordinary Product (stock, seller, listing,
 * order flow all stay as they are); this document only holds what is
 * customisable: the items and the pricing rules. Everything a customer sees as
 * a price is computed on the server from these fields — never taken from the client.
 */
const packageItemSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    description: { type: String, default: '', trim: true, maxlength: 300 },
    imageUrl: { type: String, default: '' },
    // This item's share of the package. When the shares don't add up to fullPrice the
    // package price is scaled proportionally; when all are 0 every item weighs the same.
    price: { type: Number, default: 0, min: 0 },
    // Mandatory items cannot be unticked.
    isMandatory: { type: Boolean, default: false },
    sortOrder: { type: Number, default: 0 },
  },
  { _id: true }
);

const customPackageSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 160 },
    slug: { type: String, required: true, trim: true, lowercase: true },
    description: { type: String, default: '', maxlength: 2000 },
    imageUrl: { type: String, default: '' },
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    marketplaceTab: { type: String, default: 'mithilak' },

    // Price with every item ticked.
    fullPrice: { type: Number, required: true, min: 0 },

    // Lowest price a customised package may reach. minPriceAmount (e.g. ₹1200–₹1500) wins
    // when set; otherwise minPricePercent of fullPrice; otherwise the platform default (40%).
    minPriceAmount: { type: Number, default: null, min: 0 },
    minPricePercent: { type: Number, default: null, min: 0, max: 100 },

    items: { type: [packageItemSchema], default: [] },

    isActive: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true, collection: 'custom_packages' }
);

customPackageSchema.index({ slug: 1 }, { unique: true, partialFilterExpression: { deletedAt: null } });
customPackageSchema.index({ isActive: 1, marketplaceTab: 1, sortOrder: 1 });

module.exports = mongoose.models.CustomPackage || mongoose.model('CustomPackage', customPackageSchema);
