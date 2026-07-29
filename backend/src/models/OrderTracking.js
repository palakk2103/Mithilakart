const mongoose = require('mongoose');
const { ORDER_STATUS } = require('../constants/commerce');

const orderTrackingSchema = new mongoose.Schema(
  {
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true, index: true },
    status: { type: String, enum: Object.values(ORDER_STATUS), required: true, index: true },
    note: { type: String, default: null },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  {
    timestamps: true,
    collection: 'order_tracking',
  }
);

orderTrackingSchema.index({ orderId: 1, createdAt: -1 });

module.exports =
  mongoose.models.OrderTracking ||
  mongoose.model('OrderTracking', orderTrackingSchema);

