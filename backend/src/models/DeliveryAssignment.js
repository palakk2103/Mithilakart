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
    deliveryOtp: { type: String, default: null },
    cancelledAt: { type: Date, default: null },
    cancelReason: { type: String, default: null },

    // ── CR-002 — ranked offer layer ──────────────────────────────────────────
    // Sits ABOVE the existing accept flow. The unique { orderId } index and the
    // race-to-claim guard in acceptByOrderId remain the final arbiter of who
    // gets the order, so the current broadcast behaviour is unaffected when
    // deliveryAssignmentMode = 'broadcast' (the ship default).
    offeredTo: [{ type: mongoose.Schema.Types.ObjectId, ref: 'DeliveryPartner' }],
    offerExpiresAt: { type: Date, default: null },
    rejectedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'DeliveryPartner' }],
    offerRound: { type: Number, default: 0 },

    // These four are already written by DeliveryOrderService.rejectOrder() and
    // markDeliveryFailed() but were absent from the schema, so Mongoose strict
    // mode was silently discarding them. Declared here because CR-002's partner
    // reject/timeout flow depends on the rejection actually being recorded.
    rejectedAt: { type: Date, default: null },
    rejectReason: { type: String, default: null },
    failedAt: { type: Date, default: null },
    failReason: { type: String, default: null },

    deletedAt: { type: Date, default: null },
  },
  {
    timestamps: true,
    collection: 'delivery_assignments',
  }
);

deliveryAssignmentSchema.index({ partnerId: 1, status: 1, createdAt: -1 });
deliveryAssignmentSchema.index({ orderId: 1 }, { unique: true });
// CR-002 — sweeper: expired partner offers.
deliveryAssignmentSchema.index({ status: 1, offerExpiresAt: 1 });

module.exports =
  mongoose.models.DeliveryAssignment || mongoose.model('DeliveryAssignment', deliveryAssignmentSchema);
