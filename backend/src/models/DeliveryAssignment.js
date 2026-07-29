const mongoose = require('mongoose');
const { ASSIGNMENT_STATUS_VALUES } = require('../constants/delivery');

const deliveryAssignmentSchema = new mongoose.Schema(
  {
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
    partnerId: { type: mongoose.Schema.Types.ObjectId, ref: 'DeliveryPartner', default: null, index: true },
    status: { type: String, enum: ASSIGNMENT_STATUS_VALUES, default: 'pending', index: true },
    earningAmount: { type: Number, default: 0, min: 0 },
    assignedAt: { type: Date, default: null },
    acceptedAt: { type: Date, default: null },
    pickedUpAt: { type: Date, default: null },
    deliveredAt: { type: Date, default: null },
    cancelledAt: { type: Date, default: null },
    cancelReason: { type: String, default: null },
    deletedAt: { type: Date, default: null },
  },
  {
    timestamps: true,
    collection: 'delivery_assignments',
  }
);

deliveryAssignmentSchema.index({ partnerId: 1, status: 1, createdAt: -1 });
deliveryAssignmentSchema.index({ orderId: 1 }, { unique: true });

module.exports =
  mongoose.models.DeliveryAssignment || mongoose.model('DeliveryAssignment', deliveryAssignmentSchema);
