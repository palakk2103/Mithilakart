const mongoose = require('mongoose');

const flashSaleSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: null },
    startsAt: { type: Date, required: true, index: true },
    endsAt: { type: Date, required: true, index: true },
    isActive: { type: Boolean, default: true, index: true },
    deletedAt: { type: Date, default: null },
  },
  {
    timestamps: true,
    collection: 'flash_sales',
  }
);

module.exports = mongoose.models.FlashSale || mongoose.model('FlashSale', flashSaleSchema);
