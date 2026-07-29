const mongoose = require('mongoose');

const stockAlertSchema = new mongoose.Schema(
  {
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true, index: true },
    sellerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Seller', required: true, index: true },
    threshold: { type: Number, default: 10, min: 0 },
    currentStock: { type: Number, required: true, min: 0 },
    isResolved: { type: Boolean, default: false, index: true },
  },
  {
    timestamps: true,
    collection: 'stock_alerts',
  }
);

module.exports =
  mongoose.models.StockAlert || mongoose.model('StockAlert', stockAlertSchema);
