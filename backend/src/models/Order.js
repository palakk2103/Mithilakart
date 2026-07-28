const mongoose = require('mongoose');
const { ORDER_STATUS } = require('../constants/commerce');
const { COMMERCE_FLOW_VALUES } = require('../constants/catalog');
const { MARKETPLACE_TAB_VALUES, DELIVERY_TYPE_VALUES } = require('../constants/marketplace');

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
    idempotencyKey: { type: String, default: null, index: true, sparse: true },

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

    cancelledAt: { type: Date, default: null },
    deliveredAt: { type: Date, default: null },
  },
  {
    timestamps: true,
    collection: 'orders',
  }
);

orderSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.models.Order || mongoose.model('Order', orderSchema);

