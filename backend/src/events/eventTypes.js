const { EVENT_TYPES } = require('./EventBus');

/**
 * Canonical event names.
 *
 * The ORDER/DELIVERY values below are the exact string literals already
 * published across the codebase (OrderService, DeliveryOrderService,
 * CourierShipmentService, SocketGateway). Registering them here does not
 * change any behaviour — existing publishers and subscribers keep working
 * because the values are identical. New code should use the constants.
 *
 * CR-002 adds the FULFILLMENT namespace. Of the 15 events the CR lists,
 * 9 map onto existing events and are reused; only 6 are new.
 */

/** Pre-existing — reused by CR-002, NOT duplicated. */
const ORDER_EVENTS = {
  PLACED: 'order.placed',                       // CR-002: ORDER_CREATED
  STATUS_CHANGED: 'order.status_changed',       // CR-002: ORDER_PACKING / ORDER_PACKED /
                                                //         PICKED_UP / OUT_FOR_DELIVERY / DELIVERED
  SHIPMENT_CREATED: 'order.shipment_created',
  SHIPMENT_FAILED: 'order.shipment_failed',
};

/** Pre-existing — reused by CR-002. */
const DELIVERY_EVENTS = {
  ORDER_AVAILABLE: 'delivery.order_available',  // CR-002: DELIVERY_SEARCHING / DELIVERY_ASSIGNED
  LOCATION_UPDATED: 'delivery.location_updated', // CR-002: DELIVERY_NEAR_CUSTOMER (derived)
  OTP_CREATED: 'delivery.otp_created',
  // NEW (CR-002)
  ASSIGNMENT_ACCEPTED: 'delivery.assignment_accepted', // CR-002: DELIVERY_ACCEPTED
};

/** NEW — CR-002 fulfillment lifecycle. */
const FULFILLMENT_EVENTS = {
  SELLER_ASSIGNED: 'fulfillment.seller_assigned',
  SELLER_ACCEPTED: 'fulfillment.seller_accepted',
  SELLER_REJECTED: 'fulfillment.seller_rejected',
  COURIER_FALLBACK: 'fulfillment.courier_fallback',
  FAILED: 'fulfillment.failed',
};

module.exports = {
  EVENT_TYPES,
  ORDER_EVENTS,
  DELIVERY_EVENTS,
  FULFILLMENT_EVENTS,
};
