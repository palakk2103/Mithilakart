const mongoose = require('mongoose');
const { MARKETPLACE_TAB_VALUES } = require('../constants/marketplace');
const { FULFILLMENT_STATE, FULFILLMENT_STATE_VALUES } = require('../constants/fulfillment');

/**
 * CR-002 — one document per order, the system of record for the fulfillment
 * lifecycle.
 *
 * This exists as a separate collection precisely so that ORDER_STATUS and its
 * strictly-linear transition rule stay untouched: fulfillment runs as a
 * parallel lifecycle, and every existing seller/admin/delivery/courier code
 * path keeps working unchanged.
 *
 * Deadlines are stored as absolute timestamps rather than held in setTimeout
 * handles because QueueManager has no adapter wired — an in-memory timer would
 * silently drop every pending fulfillment on restart or on a second instance.
 * The sweeper reads these fields; a late sweep is still correct, just slower.
 */
const requiredItemSchema = new mongoose.Schema(
  {
    /** null -> not substitutable; only the origin seller can fulfil this line. */
    catalogKey: { type: String, default: null },
    /** The originally-carted product, and therefore the origin seller. */
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    originSellerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Seller', required: true },
    variantId: { type: mongoose.Schema.Types.ObjectId, ref: 'ProductVariant', default: null },
    quantity: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const orderFulfillmentSchema = new mongoose.Schema(
  {
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      required: true,
      unique: true,
    },
    marketplaceTab: { type: String, enum: MARKETPLACE_TAB_VALUES, required: true },

    state: {
      type: String,
      enum: FULFILLMENT_STATE_VALUES,
      default: FULFILLMENT_STATE.SEARCHING,
      index: true,
    },

    /** Immutable snapshot of what must be fulfilled, captured at start(). */
    requiredItems: { type: [requiredItemSchema], default: [] },

    customerLocation: {
      lat: { type: Number, default: null },
      lng: { type: Number, default: null },
      pincode: { type: String, default: null },
    },

    currentAttemptId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'FulfillmentAttempt',
      default: null,
    },
    attemptCount: { type: Number, default: 0 },
    fallbackLevel: { type: Number, default: 0 },

    searchDeadlineAt: { type: Date, default: null },
    acceptanceDeadlineAt: { type: Date, default: null },

    /** Sellers already tried and failed. Never re-offered. */
    excludedSellerIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Seller' }],

    resolvedSellerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Seller', default: null },
    failureCode: { type: String, default: null },
    traceId: { type: String, default: null },

    configSnapshot: { type: mongoose.Schema.Types.Mixed, default: null },
  },
  {
    timestamps: true,
    collection: 'order_fulfillments',
  }
);

// Sweeper indexes — these are what make timeouts survive a process restart.
orderFulfillmentSchema.index({ state: 1, acceptanceDeadlineAt: 1 });
orderFulfillmentSchema.index({ state: 1, searchDeadlineAt: 1 });
orderFulfillmentSchema.index({ traceId: 1 });

module.exports =
  mongoose.models.OrderFulfillment
  || mongoose.model('OrderFulfillment', orderFulfillmentSchema);
