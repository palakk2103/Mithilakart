const { Server } = require('socket.io');
const { eventBus } = require('../events/EventBus');
const { PORTALS } = require('../constants/portals');
const { logger } = require('../utils/logger');
const { registerFulfillmentFanout, ROOM_ADMIN } = require('./fulfillmentFanout');

let ioInstance = null;
let fanoutUnsubscribes = [];

const roomOrder = (orderId) => `order:${orderId}`;
const roomSeller = (sellerId) => `seller:${sellerId}`;
const roomDelivery = (partnerId) => `delivery:${partnerId}`;
const roomCustomer = (userId) => `customer:${userId}`;

function initSocketGateway(httpServer, container) {
  const { tokenService } = container.services;
  const {
    orderRepository, orderItemRepository, deliveryAssignmentRepository,
    orderFulfillmentRepository = null,
  } = container.repositories;

  const io = new Server(httpServer, {
    cors: { origin: true, credentials: true },
    path: '/socket.io',
  });

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      const portal = socket.handshake.auth?.portal;
      if (!token || !portal) {
        next(new Error('Unauthorized'));
        return;
      }
      const decoded = await tokenService.verifyAccessToken(token, portal);
      socket.data.portal = portal;
      socket.data.userId = decoded.sub;
      socket.data.sellerId = decoded.sellerId || decoded.sub;
      next();
    } catch {
      next(new Error('Unauthorized'));
    }
  });

  io.on('connection', (socket) => {
    const { portal, userId, sellerId } = socket.data;

    if (portal === PORTALS.CUSTOMER && userId) socket.join(roomCustomer(userId));
    if (portal === PORTALS.SELLER && sellerId) socket.join(roomSeller(sellerId));
    if (portal === PORTALS.DELIVERY && userId) {
      socket.join(roomDelivery(userId));
      socket.join('portal:delivery');
    }
    // CR-002 — admin monitoring room. Admin tokens only; no order-level join
    // is required because admins observe the platform, not one order.
    if (portal === PORTALS.ADMIN) socket.join(ROOM_ADMIN);

    socket.on('join:order', async ({ orderId } = {}) => {
      if (!orderId) return;
      try {
        if (portal === PORTALS.CUSTOMER) {
          const order = await orderRepository.findActiveById(orderId, userId);
          if (!order) return;
          socket.join(roomOrder(orderId));
          socket.join(roomOrder(String(order._id)));
          if (order.orderNumber) {
            socket.join(roomOrder(String(order.orderNumber)));
          }

          // CR-002 — resync on (re)connect. The DB is the source of truth, so
          // a client that missed events while disconnected recovers here
          // rather than relying on replayed notifications.
          let fulfillment = null;
          if (orderFulfillmentRepository) {
            try {
              const record = await orderFulfillmentRepository.findByOrderId(order._id);
              if (record) {
                fulfillment = {
                  state: record.state,
                  deliveryMode: order.fulfillment?.deliveryMode ?? null,
                  estimatedDeliveryMinutes: order.fulfillment?.estimatedDeliveryMinutes ?? null,
                };
              }
            } catch (err) {
              logger.warn({ err, orderId }, 'CR-002 sync_state fulfillment lookup failed');
            }
          }

          socket.emit('sync_state', {
            type: 'sync_state',
            orderId: String(order._id),
            orderNumber: order.orderNumber,
            status: order.status,
            fulfillment,
          });
        } else if (portal === PORTALS.SELLER) {
          const order = await orderRepository.findById(orderId);
          const realId = order ? order._id : orderId;
          const canAccess = await orderItemRepository.exists({ orderId: realId, sellerId, deletedAt: null });
          if (!canAccess) return;
          socket.join(roomOrder(orderId));
          if (order) {
            socket.join(roomOrder(String(order._id)));
            if (order.orderNumber) socket.join(roomOrder(String(order.orderNumber)));
          }
        } else if (portal === PORTALS.DELIVERY) {
          const order = await orderRepository.findById(orderId);
          const realId = order ? order._id : orderId;
          const assignment = await deliveryAssignmentRepository.findByOrderId(realId);
          if (!assignment || String(assignment.partnerId) !== String(userId)) return;
          socket.join(roomOrder(orderId));
          if (order) {
            socket.join(roomOrder(String(order._id)));
            if (order.orderNumber) socket.join(roomOrder(String(order.orderNumber)));
          }
        }
      } catch (err) {
        logger.warn({ err, orderId, portal }, 'socket join:order failed');
      }
    });
  });

  eventBus.subscribe('order.placed', (event) => {
    const { sellerId, orderId, orderNumber } = event.payload || {};
    if (!sellerId) return;
    io.to(roomSeller(sellerId)).emit('new_order', {
      type: 'new_order',
      orderId: String(orderId),
      orderNumber,
    });
  });

  eventBus.subscribe('order.status_changed', async (event) => {
    const { orderId, status, orderNumber, userId } = event.payload || {};
    if (!orderId) return;
    const strOrderId = String(orderId);
    const payload = {
      type: 'status_update',
      orderId: strOrderId,
      status,
      orderNumber,
      updatedAt: new Date().toISOString(),
    };

    io.to(roomOrder(strOrderId)).emit('status_update', payload);
    if (orderNumber) {
      io.to(roomOrder(String(orderNumber))).emit('status_update', payload);
    }

    let targetUserId = userId;
    let targetOrderNumber = orderNumber;
    try {
      const order = await orderRepository.findById(orderId);
      if (order) {
        if (!targetUserId && order.userId) targetUserId = order.userId;
        if (!targetOrderNumber && order.orderNumber) {
          targetOrderNumber = order.orderNumber;
          payload.orderNumber = targetOrderNumber;
          io.to(roomOrder(String(targetOrderNumber))).emit('status_update', payload);
        }
      }
    } catch (err) {
      // ignore
    }

    if (targetUserId) {
      io.to(roomCustomer(String(targetUserId))).emit('status_update', payload);
    }

    try {
      const items = await orderItemRepository.find({ orderId, deletedAt: null });
      const sellerIds = [...new Set(items.map((item) => String(item.sellerId)))];
      for (const sid of sellerIds) io.to(roomSeller(sid)).emit('status_update', payload);
    } catch (err) {
      logger.warn({ err, orderId }, 'socket status_update seller fanout failed');
    }
  });

  eventBus.subscribe('delivery.order_available', async (event) => {
    const { orderId, orderNumber, partnerIds, sellerIds = [] } = event.payload || {};
    let orderDetails = null;
    try {
      const order = await orderRepository.findById(orderId);
      if (order) {
        const addr = order.addressSnapshot || {};
        orderDetails = {
          id: String(order._id),
          orderNumber: order.orderNumber,
          customerName: addr.name || 'Customer',
          customerAddress: [addr.line1 || addr.addressLine, addr.city].filter(Boolean).join(', '),
          pickupAddress: order.pickupAddress || 'Artisan Seller Hub',
          earningAmount: 50,
        };
      }
    } catch {
      // fallback to basic
    }

    const payload = {
      type: 'new_assignment',
      orderId: String(orderId),
      orderNumber,
      order: orderDetails,
    };

    if (Array.isArray(partnerIds) && partnerIds.length) {
      for (const partnerId of partnerIds) io.to(roomDelivery(partnerId)).emit('new_assignment', payload);
    }
    // Always emit to portal:delivery room and broadcast
    io.to('portal:delivery').emit('new_assignment', payload);
    io.emit('new_assignment', payload);

    logger.info({ orderId, orderNumber }, 'Broadcast delivery order available to all online delivery partners');
    if (Array.isArray(sellerIds) && sellerIds.length) {
      for (const sid of sellerIds) {
        io.to(roomSeller(sid)).emit('status_update', {
          type: 'status_update',
          orderId: String(orderId),
          orderNumber,
          status: 'awaiting_delivery_partner',
        });
      }
      return;
    }
    try {
      const items = await orderItemRepository.find({ orderId, deletedAt: null });
      const fallbackSellerIds = [...new Set(items.map((item) => String(item.sellerId)))];
      for (const sid of fallbackSellerIds) {
        io.to(roomSeller(sid)).emit('status_update', {
          type: 'status_update',
          orderId: String(orderId),
          orderNumber,
          status: 'awaiting_delivery_partner',
        });
      }
    } catch (err) {
      logger.warn({ err, orderId }, 'delivery.order_available seller fanout failed');
    }
  });

  eventBus.subscribe('delivery.location_updated', async (event) => {
    const { orderId, latitude, longitude, partnerId, updatedAt, orderNumber } = event.payload || {};
    if (!orderId) return;
    const strOrderId = String(orderId);
    const payload = {
      type: 'location_update',
      orderId: strOrderId,
      orderNumber,
      lat: latitude,
      lng: longitude,
      partnerId: partnerId ? String(partnerId) : null,
      updatedAt: updatedAt || new Date().toISOString(),
    };
    io.to(roomOrder(strOrderId)).emit('location_update', payload);
    if (orderNumber) {
      io.to(roomOrder(String(orderNumber))).emit('location_update', payload);
    }
  });

  eventBus.subscribe('delivery.otp_created', async (event) => {
    const { orderId, otp, otpType, userId, orderNumber } = event.payload || {};
    if (otpType === 'delivery' && otp && orderId) {
      const strOrderId = String(orderId);
      const payload = {
        type: 'delivery_otp',
        orderId: strOrderId,
        orderNumber,
        otp,
      };
      io.to(roomOrder(strOrderId)).emit('delivery_otp', payload);
      if (orderNumber) {
        io.to(roomOrder(String(orderNumber))).emit('delivery_otp', payload);
      }
      let targetUserId = userId;
      if (!targetUserId) {
        try {
          const o = await orderRepository.findById(orderId);
          if (o?.userId) targetUserId = o.userId;
        } catch {}
      }
      if (targetUserId) {
        io.to(roomCustomer(String(targetUserId))).emit('delivery_otp', payload);
      }
    }
  });

  // CR-002 P10 — fulfillment fanout on the SAME io instance and event bus.
  fanoutUnsubscribes = registerFulfillmentFanout(
    io, { roomOrder, roomSeller, roomDelivery, roomCustomer }, []
  );

  ioInstance = io;
  logger.info('Socket.IO gateway initialized');
  return io;
}

function getIo() {
  return ioInstance;
}

async function closeSocketGateway() {
  // Detach fulfillment subscriptions first, so a restarted gateway does not
  // accumulate duplicate listeners on the process-wide event bus.
  for (const off of fanoutUnsubscribes) {
    try { off(); } catch { /* already detached */ }
  }
  fanoutUnsubscribes = [];

  if (!ioInstance) return;
  await new Promise((resolve) => {
    ioInstance.close(() => resolve());
  });
  ioInstance = null;
}

module.exports = {
  initSocketGateway,
  getIo,
  closeSocketGateway,
  roomOrder,
  roomSeller,
  roomDelivery,
  roomCustomer,
  ROOM_ADMIN,
};
