const mongoose = require('mongoose');

const productVariantSchema = new mongoose.Schema(
  {
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true, index: true },
    name: { type: String, required: true, trim: true },
    sku: { type: String, required: true, trim: true },
    price: { type: Number, required: true, min: 0 },
    mrp: { type: Number, required: true, min: 0 },
    stock: { type: Number, default: 0, min: 0 },
    attributes: { type: mongoose.Schema.Types.Mixed, default: {} },
    isActive: { type: Boolean, default: true },
    deletedAt: { type: Date, default: null },
  },
  {
    timestamps: true,
    collection: 'product_variants',
  }
);

productVariantSchema.index({ productId: 1, isActive: 1 });
productVariantSchema.index({ sku: 1 }, { unique: true, sparse: true });

module.exports = mongoose.models.ProductVariant
  || mongoose.model('ProductVariant', productVariantSchema);
