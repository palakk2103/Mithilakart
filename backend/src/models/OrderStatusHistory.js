const mongoose = require('mongoose');
const { ORDER_STATUS } = require('../constants/commerce');

const orderStatusHistorySchema = new mongoose.Schema(
  {
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true, index: true },
    fromStatus: { type: String, enum: Object.values(ORDER_STATUS), default: null },
    toStatus: { type: String, enum: Object.values(ORDER_STATUS), required: true },
    changedBy: { type: String, default: null }, // customer/seller/admin/system
    changedById: { type: mongoose.Schema.Types.ObjectId, default: null },
    note: { type: String, default: null },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    collection: 'order_status_history',
  }
);

orderStatusHistorySchema.index({ orderId: 1, createdAt: -1 });

module.exports =
  mongoose.models.OrderStatusHistory ||
  mongoose.model('OrderStatusHistory', orderStatusHistorySchema);

