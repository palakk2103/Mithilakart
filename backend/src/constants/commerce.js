const { COMMERCE_FLOW_VALUES } = require('./catalog');

const CART = {
  SHIPPING_FEE: 39,
  FREE_SHIPPING_THRESHOLD: 500,
  DEFAULT_CURRENCY: 'INR',
  SESSION_COOKIE_NAME: 'sessionId',
  CART_KEY_TTL_SECONDS: 60 * 60 * 24 * 30, // 30 days
  SESSION_COOKIE_MAX_AGE_MS: 30 * 24 * 60 * 60 * 1000, // 30 days
};

const ORDER_STATUS = {
  PENDING: 'pending',
  PLACED: 'placed',
  CONFIRMED: 'confirmed',
  PACKED: 'packed',
  SHIPPED: 'shipped',
  OUT_FOR_DELIVERY: 'out_for_delivery',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled',
};

const ORDER_STATUS_VALUES = Object.values(ORDER_STATUS);

const PAYMENT_METHOD = {
  UPI: 'upi',
  CARD: 'card',
  COD: 'cod',
  WALLET: 'wallet',
};

const PAYMENT_METHOD_VALUES = Object.values(PAYMENT_METHOD);

const PAYMENT_STATUS = {
  PENDING: 'pending',
  PAID: 'paid',
  FAILED: 'failed',
  REFUNDED: 'refunded',
};

const PAYMENT_STATUS_VALUES = Object.values(PAYMENT_STATUS);

const COMMERCE_FLOW_VALUES_SET = new Set(COMMERCE_FLOW_VALUES);

module.exports = {
  CART,
  ORDER_STATUS,
  ORDER_STATUS_VALUES,
  PAYMENT_METHOD,
  PAYMENT_METHOD_VALUES,
  PAYMENT_STATUS,
  PAYMENT_STATUS_VALUES,
  COMMERCE_FLOW_VALUES_SET,
};

