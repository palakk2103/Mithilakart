const mongoose = require('mongoose');
const { INVENTORY_CHANGE_REASON } = require('../constants/pricing');

const inventoryHistorySchema = new mongoose.Schema(
  {
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true, index: true },
    sellerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Seller', required: true, index: true },
    previousStock: { type: Number, required: true, min: 0 },
    newStock: { type: Number, required: true, min: 0 },
    change: { type: Number, required: true },
    reason: {
      type: String,
      enum: Object.values(INVENTORY_CHANGE_REASON),
      default: INVENTORY_CHANGE_REASON.MANUAL,
    },
    referenceId: { type: mongoose.Schema.Types.ObjectId, default: null },
    note: { type: String, default: null },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    collection: 'inventory_history',
  }
);

inventoryHistorySchema.index({ productId: 1, createdAt: -1 });

module.exports =
  mongoose.models.InventoryHistory ||
  mongoose.model('InventoryHistory', inventoryHistorySchema);
