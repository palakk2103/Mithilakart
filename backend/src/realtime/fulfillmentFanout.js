const { eventBus } = require('../events/EventBus');
const { FULFILLMENT_EVENTS, DELIVERY_EVENTS } = require('../events/eventTypes');
const { logger } = require('../utils/logger');

/**
 * CR-002 P10 — realtime fanout for the fulfillment lifecycle.
 *
 * This is NOT a second realtime architecture. It subscribes to the existing
 * `eventBus` and emits on the existing Socket.IO `io` instance and its existing
 * rooms. It is a separate file only to keep SocketGateway readable; it is
 * called from there and shares its state entirely.
 *
 * Authorisation model — each audience gets its own projection of the same
 * event, never a shared payload:
 *
 *   customer  -> order:<id>      safe, coarse status. Never learns which seller
 *                                was tried, how many were tried, or why one failed.
 *   seller    -> seller:<id>     only offers addressed to that seller.
 *   delivery  -> delivery:<id>   only its own assignment.
 *   admin     -> admin room      full diagnostic detail including traceId.
 *
 * Socket events are notifications. MongoDB remains the source of truth; a
 * dropped event degrades to "the UI updates on next poll or reconnect".
 */
const ROOM_ADMIN = 'admin:fulfillment';

/** Customer-visible phrasing per internal state (docs/cr-002/06 §6). */
const CUSTOMER_MESSAGE = {
  searching: 'Finding the fastest store near you',
  seller_assigned: 'Preparing your order',
  seller_accepted: 'Preparing your order',
  warehouse_pending: 'Preparing your order',
  warehouse_accepted: 'Preparing your order',
  courier_pending: 'Switching to standard delivery',
  courier_assigned: 'Standard delivery',
  failed: "We couldn't complete this order right now. Our team has been notified.",
};

function customerView(payload) {
  return {
    type: 'fulfillment_update',
    orderId: String(payload.orderId),
    state: payload.state || null,
    message: CUSTOMER_MESSAGE[payload.state] || 'Preparing your order',
    deliveryMode: payload.deliveryMode || null,
    estimatedDeliveryMinutes: payload.estimatedDeliveryMinutes ?? null,
    updatedAt: payload.timestamp || new Date().toISOString(),
  };
}

function adminView(name, payload) {
  return {
    type: 'fulfillment_monitor',
    event: name,
    orderId: String(payload.orderId),
    fulfillmentId: payload.fulfillmentId ? String(payload.fulfillmentId) : null,
    traceId: payload.traceId || null,
    state: payload.state || null,
    sellerId: payload.sellerId ? String(payload.sellerId) : null,
    attemptId: payload.attemptId ? String(payload.attemptId) : null,
    failureCode: payload.failureCode || null,
    fallbackLevel: payload.fallbackLevel ?? null,
    fallbackReason: payload.fallbackReason || null,
    reason: payload.reason || null,
    timestamp: payload.timestamp || new Date().toISOString(),
  };
}

/**
 * @param io          the existing Socket.IO server
 * @param rooms       { roomOrder, roomSeller, roomDelivery } from SocketGateway
 * @param unsubscribes array collecting teardown functions
 */
function registerFulfillmentFanout(io, rooms, unsubscribes = []) {
  const { roomOrder, roomSeller, roomDelivery } = rooms;

  const on = (name, handler) => {
    unsubscribes.push(eventBus.subscribe(name, (event) => {
      try {
        handler(event.payload || {}, name);
      } catch (err) {
        // A fanout fault must never propagate into the engine that published it.
        logger.warn({ err, event: name }, 'CR-002 fulfillment fanout failed');
      }
    }));
  };

  // Admin sees every fulfillment event, in full.
  const toAdmin = (payload, name) => io.to(ROOM_ADMIN).emit('fulfillment_monitor', adminView(name, payload));

  const emitOrder = (payload, eventName, data) => {
    if (payload.orderId) io.to(roomOrder(String(payload.orderId))).emit(eventName, data);
    if (payload.orderNumber) io.to(roomOrder(String(payload.orderNumber))).emit(eventName, data);
    if (payload.userId && rooms.roomCustomer) io.to(rooms.roomCustomer(String(payload.userId))).emit(eventName, data);
  };

  on(FULFILLMENT_EVENTS.SELLER_ASSIGNED, (payload, name) => {
    // Customer: coarse progress only. Deliberately NOT told which seller.
    emitOrder(payload, 'fulfillment_update', customerView(payload));

    // Seller: the offer, addressed only to them.
    if (payload.sellerId) {
      io.to(roomSeller(String(payload.sellerId))).emit('fulfillment_offer', {
        type: 'fulfillment_offer',
        orderId: String(payload.orderId),
        attemptId: payload.attemptId ? String(payload.attemptId) : null,
        expiresAt: payload.expiresAt || null,
        estimatedDeliveryMinutes: payload.estimatedDeliveryMinutes ?? null,
      });
    }

    toAdmin(payload, name);
  });

  on(FULFILLMENT_EVENTS.SELLER_ACCEPTED, (payload, name) => {
    emitOrder(payload, 'fulfillment_update', customerView(payload));

    if (payload.sellerId) {
      io.to(roomSeller(String(payload.sellerId))).emit('offer_closed', {
        type: 'offer_closed',
        orderId: String(payload.orderId),
        attemptId: payload.attemptId ? String(payload.attemptId) : null,
        outcome: 'accepted',
      });
    }

    toAdmin(payload, name);
  });

  on(FULFILLMENT_EVENTS.SELLER_REJECTED, (payload, name) => {
    // NO customer emit. Which sellers declined is internal — telling the
    // customer would leak seller behaviour and cause needless alarm while the
    // engine is still working through candidates.
    if (payload.sellerId) {
      io.to(roomSeller(String(payload.sellerId))).emit('offer_closed', {
        type: 'offer_closed',
        orderId: String(payload.orderId),
        attemptId: payload.attemptId ? String(payload.attemptId) : null,
        outcome: payload.reason === 'timeout' ? 'expired' : 'rejected',
      });
    }

    toAdmin(payload, name);
  });

  on(FULFILLMENT_EVENTS.COURIER_FALLBACK, (payload, name) => {
    // The customer must see the REAL mode change, not a stale quick promise.
    emitOrder(payload, 'fulfillment_update', {
      ...customerView(payload),
      deliveryMode: 'standard',
      estimatedDeliveryMinutes: null,
    });
    toAdmin(payload, name);
  });

  on(FULFILLMENT_EVENTS.FAILED, (payload, name) => {
    const view = customerView(payload);

    // A failure AFTER the courier downgrade is not "we couldn't complete this
    // order" from the customer's side — the order stands and ships standard;
    // only the shipment booking needs an operator. Saying otherwise would
    // alarm a customer whose order is fine.
    const afterDowngrade = payload.deliveryMode === 'standard';

    emitOrder(payload, 'fulfillment_update', {
      ...view,
      message: afterDowngrade
        ? 'Standard delivery — we are confirming your shipment'
        : view.message,
      // Internal failure codes never reach the customer.
      failureCode: undefined,
    });
    toAdmin(payload, name);
  });

  on(DELIVERY_EVENTS.ASSIGNMENT_ACCEPTED, (payload, name) => {
    emitOrder(payload, 'status_update', {
      type: 'status_update',
      orderId: String(payload.orderId),
      status: 'delivery_assigned',
      orderNumber: payload.orderNumber || null,
    });

    if (payload.partnerId) {
      io.to(roomDelivery(String(payload.partnerId))).emit('assignment_confirmed', {
        type: 'assignment_confirmed',
        orderId: String(payload.orderId),
        assignmentId: payload.assignmentId ? String(payload.assignmentId) : null,
      });
    }

    io.to('portal:delivery').emit('assignment_withdrawn', {
      type: 'assignment_withdrawn',
      orderId: String(payload.orderId),
      acceptedBy: payload.partnerId ? String(payload.partnerId) : null,
    });

    toAdmin(payload, name);
  });

  return unsubscribes;
}

module.exports = { registerFulfillmentFanout, ROOM_ADMIN, CUSTOMER_MESSAGE, customerView, adminView };
