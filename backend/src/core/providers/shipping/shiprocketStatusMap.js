const { ORDER_STATUS } = require('../../../constants/commerce');

/** Map Shiprocket tracking / shipment status strings to internal order status. */
const SHIPROCKET_TO_ORDER_STATUS = {
  'new': null,
  'invoiced': ORDER_STATUS.CONFIRMED,
  'ready to ship': ORDER_STATUS.PACKED,
  'ready to pickup': ORDER_STATUS.PACKED,
  'pickup scheduled': ORDER_STATUS.PACKED,
  'out for pickup': ORDER_STATUS.PACKED,
  'picked up': ORDER_STATUS.SHIPPED,
  'shipped': ORDER_STATUS.SHIPPED,
  'in transit': ORDER_STATUS.SHIPPED,
  'reached at destination hub': ORDER_STATUS.SHIPPED,
  'out for delivery': ORDER_STATUS.OUT_FOR_DELIVERY,
  'delivered': ORDER_STATUS.DELIVERED,
  'cancelled': ORDER_STATUS.CANCELLED,
  'canceled': ORDER_STATUS.CANCELLED,
  'rto initiated': ORDER_STATUS.CANCELLED,
  'rto in transit': ORDER_STATUS.CANCELLED,
  'rto delivered': ORDER_STATUS.CANCELLED,
  'rto': ORDER_STATUS.CANCELLED,
};

function normalizeShiprocketStatus(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/_/g, ' ')
    .replace(/\s+/g, ' ');
}

function mapShiprocketStatusToOrderStatus(status) {
  const key = normalizeShiprocketStatus(status);
  return SHIPROCKET_TO_ORDER_STATUS[key] ?? null;
}

function isRtoStatus(status) {
  const key = normalizeShiprocketStatus(status);
  return key.includes('rto');
}

module.exports = {
  SHIPROCKET_TO_ORDER_STATUS,
  normalizeShiprocketStatus,
  mapShiprocketStatusToOrderStatus,
  isRtoStatus,
};
