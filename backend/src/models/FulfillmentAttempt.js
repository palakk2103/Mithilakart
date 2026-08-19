const mongoose = require('mongoose');
const {
  ATTEMPT_KIND_VALUES,
  ATTEMPT_STATUS_VALUES,
} = require('../constants/fulfillment');

/**
 * CR-002 — one document per seller/warehouse/courier tried.
 *
 * Two jobs:
 *  1. Traceability. One query answers "why did this order end up on courier?"
 *     with the ordered candidate list, each rank breakdown, and each failure
 *     code. Admin-only — none of this is ever exposed to a customer.
 *  2. Crash recovery. `reservations[]` is the authoritative record of exactly
 *     what stock this attempt took, so the sweeper can release exactly that
 *     much — no more, no less — if the process dies mid-fulfillment.
 */
const reservationSchema = new mongoose.Schema(
  {
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    quantity: { type: Number, required: true, min: 1 },
    /** Set once released. Guards against a double release by a re-run sweeper. */
    releasedAt: { type: Date, default: null },
  },
  { _id: false }
);

const fulfillmentAttemptSchema = new mongoose.Schema(
  {
    fulfillmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'OrderFulfillment',
      required: true,
      index: true,
    },
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true, index: true },
    sellerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Seller', default: null },

    attemptNumber: { type: Number, required: true },
    kind: { type: String, enum: ATTEMPT_KIND_VALUES, required: true },

    status: { type: String, enum: ATTEMPT_STATUS_VALUES, required: true, index: true },

    // Ranking evidence — admin-visible only.
    rankScore: { type: Number, default: null },
    rankBreakdown: { type: mongoose.Schema.Types.Mixed, default: null },
    distanceKm: { type: Number, default: null },
    routeEtaMinutes: { type: Number, default: null },
    preparationMinutes: { type: Number, default: null },
    /** Composed at offer time (route + prep + buffer) so acceptance writes the
     *  same ETA the seller was shown, not a recomputed one. */
    estimatedDeliveryMinutes: { type: Number, default: null },

    reservations: { type: [reservationSchema], default: [] },

    offeredAt: { type: Date, default: null },
    respondedAt: { type: Date, default: null },
    expiresAt: { type: Date, default: null },

    failureCode: { type: String, default: null },
    failureDetail: { type: String, default: null },
  },
  {
    timestamps: true,
    collection: 'fulfillment_attempts',
  }
);

// One attempt number per fulfillment — this is what makes a retry find the
// existing attempt (and its reservations) instead of reserving a second time.
fulfillmentAttemptSchema.index({ fulfillmentId: 1, attemptNumber: 1 }, { unique: true });
fulfillmentAttemptSchema.index({ orderId: 1, createdAt: -1 });
// Seller-facing "my pending offers" query.
fulfillmentAttemptSchema.index({ sellerId: 1, status: 1, createdAt: -1 });

module.exports =
  mongoose.models.FulfillmentAttempt
  || mongoose.model('FulfillmentAttempt', fulfillmentAttemptSchema);
