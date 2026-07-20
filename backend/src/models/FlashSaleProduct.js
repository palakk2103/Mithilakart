const mongoose = require('mongoose');

const flashSaleProductSchema = new mongoose.Schema(
  {
    flashSaleId: { type: mongoose.Schema.Types.ObjectId, ref: 'FlashSale', required: true, index: true },
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true, index: true },
    salePrice: { type: Number, required: true, min: 0 },
    deletedAt: { type: Date, default: null },
  },
  {
    timestamps: true,
    collection: 'flash_sale_products',
  }
);

flashSaleProductSchema.index({ flashSaleId: 1, productId: 1 }, { unique: true });

module.exports =
  mongoose.models.FlashSaleProduct || mongoose.model('FlashSaleProduct', flashSaleProductSchema);
