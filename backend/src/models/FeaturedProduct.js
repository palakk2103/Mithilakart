const mongoose = require('mongoose');

const featuredProductSchema = new mongoose.Schema(
  {
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true, unique: true, index: true },
    sortOrder: { type: Number, default: 0, index: true },
    isActive: { type: Boolean, default: true, index: true },
    deletedAt: { type: Date, default: null },
  },
  {
    timestamps: true,
    collection: 'featured_products',
  }
);

module.exports =
  mongoose.models.FeaturedProduct || mongoose.model('FeaturedProduct', featuredProductSchema);
