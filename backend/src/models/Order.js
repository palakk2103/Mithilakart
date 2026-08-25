const mongoose = require('mongoose');
const { ORDER_STATUS } = require('../constants/commerce');
const { COMMERCE_FLOW_VALUES } = require('../constants/catalog');
const { MARKETPLACE_TAB_VALUES, DELIVERY_TYPE_VALUES } = require('../constants/marketplace');
const { FULFILLMENT_TYPE_VALUES, DELIVERY_MODE_VALUES } = require('../constants/fulfillment');

const orderSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    orderNumber: { type: String, required: true, unique: true, index: true },
    status: { type: String, enum: Object.values(ORDER_STATUS), default: ORDER_STATUS.PENDING, index: true },

    commerceFlow: {
      type: String,
      enum: COMMERCE_FLOW_VALUES,
      default: 'standard',
    },

    marketplaceTab: {
      type: String,
      enum: MARKETPLACE_TAB_VALUES,
      default: null,
      index: true,
    },
    deliveryType: {
      type: String,
      enum: DELIVERY_TYPE_VALUES,
      default: null,
    },
    deliveryPromiseMinutes: { type: Number, default: null },
    estimatedDeliveryAt: { type: Date, default: null },

    subtotal: { type: Number, default: 0, min: 0 },
    discount: { type: Number, default: 0, min: 0 },
    tax: { type: Number, default: 0, min: 0 },
    deliveryCharge: { type: Number, default: 0, min: 0 },
    total: { type: Number, default: 0, min: 0 },

    paymentMethod: { type: String, default: 'cod' },
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'failed', 'refunded'],
      default: 'pending',
      index: true,
    },

    addressSnapshot: { type: mongoose.Schema.Types.Mixed, default: {} },
    couponCode: { type: String, default: null },
    couponDiscount: { type: Number, default: 0, min: 0 },
    inventoryDeducted: { type: Boolean, default: false },
    // Indexed via the PARTIAL unique index declared below (not field-level
    // `index: true`, which would register a second, conflicting plain index
    // on the same key). See that declaration for why `sparse` alone is unsafe
    // here — the schema default writes an explicit `null`, not an absent
    // field.
    idempotencyKey: { type: String, default: null },

    sellerSubOrders: [{
      sellerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Seller' },
      items: [{ type: mongoose.Schema.Types.Mixed }],
      subtotal: { type: Number, default: 0 },
      status: { type: String, default: 'pending' },
    }],

    fulfilmentType: {
      type: String,
      enum: ['local_delivery', 'courier', 'store_pickup'],
      default: 'local_delivery',
      index: true,
    },
    shipment: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },

    /**
     * CR-002 — immutable fulfillment snapshot.
     *
     * Frozen when fulfillment is finalised so that a later Admin config change
     * can never retroactively alter a historical order's ETA, fees, commission
     * or delivery charge.
     *
     * The legacy top-level fields above (fulfilmentType, deliveryType,
     * deliveryPromiseMinutes, estimatedDeliveryAt, shipment, sellerSubOrders)
     * are RETAINED and kept mirrored, so every existing reader keeps working.
     */
    fulfillment: {
      type: { type: String, enum: [...FULFILLMENT_TYPE_VALUES, null], default: null },
      source: { type: String, default: null },
      sellerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Seller', default: null },
      warehouseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Seller', default: null },
      courierProvider: { type: String, default: null },
      deliveryMode: { type: String, enum: [...DELIVERY_MODE_VALUES, null], default: null },
      estimatedDeliveryMinutes: { type: Number, default: null },
      estimatedDeliveryAt: { type: Date, default: null },
      fallbackLevel: { type: Number, default: 0 },
      fallbackReason: { type: String, default: null },
      decidedAt: { type: Date, default: null },
      configSnapshot: { type: mongoose.Schema.Types.Mixed, default: null },
    },

    platformFee: { type: Number, default: 0, min: 0 },
    packagingFee: { type: Number, default: 0, min: 0 },

    cancelledAt: { type: Date, default: null },
    deliveredAt: { type: Date, default: null },
  },
  {
    timestamps: true,
    collection: 'orders',
  }
);

orderSchema.index({ userId: 1, createdAt: -1 });
// Partial (not sparse): only real string keys are constrained, so the many
// existing `idempotencyKey: null` documents are excluded from the constraint
// rather than colliding on it.
orderSchema.index(
  { idempotencyKey: 1 },
  { unique: true, partialFilterExpression: { idempotencyKey: { $type: 'string' } } }
);
// CR-002 — seller-scoped fulfillment queries (seller order list, admin monitor).
orderSchema.index({ 'fulfillment.sellerId': 1, status: 1 });

module.exports = mongoose.models.Order || mongoose.model('Order', orderSchema);

