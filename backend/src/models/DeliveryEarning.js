const mongoose = require('mongoose');
const { DELIVERY_EARNING_STATUS_VALUES } = require('../constants/delivery');

const deliveryEarningSchema = new mongoose.Schema(
  {
    partnerId: { type: mongoose.Schema.Types.ObjectId, ref: 'DeliveryPartner', required: true, index: true },
    assignmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'DeliveryAssignment', required: true, index: true },
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true, index: true },
    amount: { type: Number, required: true, min: 0 },
    status: { type: String, enum: DELIVERY_EARNING_STATUS_VALUES, default: 'pending', index: true },
    creditedAt: { type: Date, default: null },
    deletedAt: { type: Date, default: null },
  },
  {
    timestamps: true,
    collection: 'delivery_earnings',
  }
);

deliveryEarningSchema.index({ partnerId: 1, createdAt: -1 });

module.exports =
  mongoose.models.DeliveryEarning || mongoose.model('DeliveryEarning', deliveryEarningSchema);
