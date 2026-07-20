const { BaseService } = require('../../core/BaseService');
const { AppError } = require('../../utils/AppError');
const { withTransaction } = require('../../database');
const { parsePagination, buildPaginationMeta } = require('../../utils/pagination');
const { CART, ORDER_STATUS, PAYMENT_STATUS } = require('../../constants/commerce');
const { randomUuid } = require('../../utils/cryptoHelper');
const { eventBus } = require('../../events/EventBus');

class OrderService extends BaseService {
  constructor({
    cartService,
    productRepository,
    orderRepository,
    orderItemRepository,
    orderTrackingRepository,
    orderStatusHistoryRepository,
    paymentService,
    pricingService,
    couponService,
    cartRepository,
    cartItemRepository,
    userAddressRepository = null,
    geocodingService = null,
  }) {
    super();
    this.cartService = cartService;
    this.productRepository = productRepository;
    this.orderRepository = orderRepository;
    this.orderItemRepository = orderItemRepository;
    this.orderTrackingRepository = orderTrackingRepository;
    this.orderStatusHistoryRepository = orderStatusHistoryRepository;
    this.paymentService = paymentService;
    this.pricingService = pricingService;
    this.couponService = couponService;
    this.cartRepository = cartRepository;
    this.cartItemRepository = cartItemRepository;
    this.userAddressRepository = userAddressRepository;
    this.geocodingService = geocodingService;
    this.deliveryOrderService = null;
  }

  setDeliveryOrderService(deliveryOrderService) {
    this.deliveryOrderService = deliveryOrderService;
  }

  _generateOrderNumber() {
    return `MK-${Date.now()}-${randomUuid().slice(0, 8)}`.toUpperCase();
  }

  async placeOrder({
    userId,
    addressId,
    paymentMethod,
    couponCode = null,
    commerceFlow = 'standard',
    items = null,
    idempotencyKey = null,
    sessionMeta = {},
  }) {
    if (!userId) throw AppError.unauthorized('User required');

    return withTransaction(async (session) => {
      const cart = items
        ? await this._buildCartFromItems({ items, commerceFlow, couponCode, userId })
        : await this.cartService.getCart({ userId, sessionId: null, commerceFlow, couponCode });

      if (!cart.items || cart.items.length === 0) {
        throw AppError.validation('Cart is empty');
      }

      const orderNumber = this._generateOrderNumber();
      const sellerSubOrders = this.pricingService.buildSellerSubOrders(cart.items, ORDER_STATUS.PENDING);
      const addressSnapshot = await this._buildAddressSnapshot(userId, addressId);

      const order = await this.orderRepository.create(
        {
          userId,
          orderNumber,
          status: ORDER_STATUS.PENDING,
          commerceFlow,
          subtotal: cart.subtotal,
          discount: cart.discount || cart.couponDiscount || 0,
          couponDiscount: cart.couponDiscount || 0,
          tax: cart.tax || 0,
          deliveryCharge: cart.deliveryCharge ?? cart.shippingFee ?? 0,
          total: cart.total,
          paymentMethod,
          paymentStatus: PAYMENT_STATUS.PENDING,
          addressSnapshot,
          couponCode,
          sellerSubOrders,
          inventoryDeducted: false,
          cancelledAt: null,
          deliveredAt: null,
        },
        session
      );

      const orderItems = cart.items.map((it) => ({
        orderId: order._id,
        userId,
        sellerId: it.sellerId,
        productId: it.productId,
        variantId: it.variantId || null,
        quantity: it.quantity,
        unitPrice: it.unitPrice,
        lineTotal: it.unitPrice * it.quantity,
      }));

      await this.orderItemRepository.createMany(orderItems, session);

      await this.orderTrackingRepository.createInitial(order._id, ORDER_STATUS.PENDING, 'Order placed', {}, session);
      await this.orderStatusHistoryRepository.addTransition(
        {
          orderId: order._id,
          fromStatus: null,
          toStatus: ORDER_STATUS.PENDING,
          changedBy: 'customer',
          changedById: userId,
          note: null,
        },
        session
      );

      await this.cartService.persistCartSnapshot({
        userId,
        sessionId: null,
        cartRepository: this.cartRepository,
        cartItemRepository: this.cartItemRepository,
        session,
      });

      const paymentResult = await this.paymentService.initiatePayment({
        userId,
        orderId: order._id,
        orderNumber,
        paymentMethod,
        amount: cart.total,
        currency: CART.DEFAULT_CURRENCY,
        idempotencyKey,
        sessionMeta,
        session,
      });

      if (paymentResult?.paymentStatus === PAYMENT_STATUS.PAID) {
        await this.confirmOrder(order._id, userId, session);
      }

      if (couponCode && cart.couponDiscount > 0 && this.couponService) {
        const { coupon } = await this.couponService.validateForCheckout({
          code: couponCode,
          subtotal: cart.subtotal,
          userId,
        });
        if (coupon) {
          await this.couponService.incrementUsage(coupon._id, session);
        }
      }

      await this.cartService.clearCart({ userId, sessionId: null });

      const updatedOrder = await this.orderRepository.findById(order._id, { session });

      return {
        orderId: order._id,
        orderNumber: order.orderNumber,
        status: updatedOrder?.status || order.status,
        paymentStatus: paymentResult?.paymentStatus || order.paymentStatus,
        payment: paymentResult || null,
      };
    });
  }

  async confirmOrder(orderId, changedById, session = null) {
    const order = await this.orderRepository.findById(orderId, { session });
    if (!order) throw AppError.notFound('Order not found');

    if (order.status === ORDER_STATUS.CONFIRMED || order.inventoryDeducted) {
      return order;
    }

    const orderItems = await this.orderItemRepository.listByOrderId(order._id);
    for (const it of orderItems) {
      await this.productRepository.decrementStock(it.productId, it.quantity, session);
    }

    await this.orderRepository.updateById(
      orderId,
      {
        status: ORDER_STATUS.CONFIRMED,
        inventoryDeducted: true,
        sellerSubOrders: (order.sellerSubOrders || []).map((sub) => ({
          sellerId: sub.sellerId,
          items: sub.items,
          subtotal: sub.subtotal,
          status: ORDER_STATUS.CONFIRMED,
        })),
      },
      session
    );

    await this.orderTrackingRepository.createInitial(orderId, ORDER_STATUS.CONFIRMED, 'Order confirmed', {}, session);
    await this.orderStatusHistoryRepository.addTransition(
      {
        orderId,
        fromStatus: order.status,
        toStatus: ORDER_STATUS.CONFIRMED,
        changedBy: 'system',
        changedById: changedById,
        note: 'Payment completed',
      },
      session
    );

    const updated = await this.orderRepository.findById(orderId, { session });
    if (updated) {
      this._emitStatusChange(updated, ORDER_STATUS.CONFIRMED);
      await this._afterOrderConfirmed(updated, session);
    }

    return updated;
  }

  async _buildAddressSnapshot(userId, addressId) {
    if (!addressId || !this.userAddressRepository) {
      return { addressId: addressId || null };
    }

    const address = await this.userAddressRepository.findOne({
      _id: addressId,
      userId,
      deletedAt: null,
    });

    if (!address) {
      return { addressId };
    }

    let latitude = address.latitude;
    let longitude = address.longitude;
    let placeId = address.placeId;

    if ((latitude == null || longitude == null) && this.geocodingService?.isEnabled()) {
      const geo = await this.geocodingService.geocodeAddress({
        addressLine: address.addressLine,
        city: address.city,
        state: address.state,
        pincode: address.pincode,
      });

      if (geo) {
        latitude = geo.latitude;
        longitude = geo.longitude;
        placeId = geo.placeId;
        await this.userAddressRepository.updateById(address._id, {
          latitude,
          longitude,
          placeId,
        });
      }
    }

    return {
      addressId: address._id,
      name: address.name,
      phone: address.phone,
      line1: address.addressLine,
      city: address.city,
      state: address.state,
      pincode: address.pincode,
      lat: latitude,
      lng: longitude,
      placeId,
    };
  }

  async _afterOrderConfirmed(order, session = null) {
    if (this.deliveryOrderService) {
      await this.deliveryOrderService.ensureAssignmentForOrder(order._id, session);
      eventBus.publish('delivery.order_available', {
        orderId: order._id,
        orderNumber: order.orderNumber,
      });
    }

    const sellerIds = [...new Set((order.sellerSubOrders || []).map((sub) => String(sub.sellerId)))];
    for (const sellerId of sellerIds) {
      eventBus.publish('order.placed', {
        sellerId,
        orderId: order._id,
        orderNumber: order.orderNumber,
      });
    }
  }

  async _buildCartFromItems({ items, commerceFlow, couponCode, userId }) {
    if (!Array.isArray(items) || items.length === 0) {
      return { items: [], subtotal: 0, shippingFee: 0, total: 0 };
    }

    const lineItems = [];

    for (const line of items) {
      const product = await this.productRepository.findPublicById(line.productId);
      if (!product) throw AppError.notFound('Product not found');

      if (product.stock < line.quantity) {
        throw AppError.conflict('Requested quantity exceeds available stock', [
          { field: 'quantity', message: 'Insufficient stock', availableQuantity: product.stock },
        ]);
      }

      lineItems.push({
        productId: line.productId,
        variantId: line.variantId || null,
        sellerId: product.sellerId,
        quantity: line.quantity,
        unitPrice: product.price,
      });
    }

    const pricing = await this.pricingService.calculateTotals({
      items: lineItems,
      couponCode,
      userId,
    });

    return { items: lineItems, commerceFlow, couponCode, ...pricing };
  }

  _emitStatusChange(order, toStatus) {
    eventBus.publish('order.status_changed', {
      orderId: order._id,
      userId: order.userId,
      orderNumber: order.orderNumber,
      status: toStatus,
    });
  }

  async listOrdersForAdmin(query = {}) {
    const pagination = parsePagination(query);
    const filter = {};
    if (query.status) filter.status = query.status;
    if (query.userId) filter.userId = query.userId;

    const [items, total] = await Promise.all([
      this.orderRepository.find(filter, { sort: '-createdAt', skip: pagination.skip, limit: pagination.limit }),
      this.orderRepository.count(filter),
    ]);

    return {
      items: items.map((o) => this._serializeOrder(o)),
      meta: buildPaginationMeta(pagination.page, pagination.limit, total),
    };
  }

  async getOrderDetailForAdmin(orderId) {
    const order = await this.orderRepository.findActiveById(orderId);
    if (!order) throw AppError.notFound('Order not found');
    return this._buildOrderDetail(order);
  }

  async listOrders(userId, query = {}) {
    const pagination = parsePagination(query);
    const statusFilter = query.status ? String(query.status) : null;
    const sort = query.sort ? String(query.sort) : '-createdAt';

    const filters = { userId, ...(statusFilter ? { status: statusFilter } : {}) };
    const [items, total] = await Promise.all([
      this.orderRepository.find(filters, { sort, skip: pagination.skip, limit: pagination.limit }),
      this.orderRepository.count(filters),
    ]);

    return {
      items: items.map((o) => this._serializeOrder(o)),
      meta: buildPaginationMeta(pagination.page, pagination.limit, total),
    };
  }

  async listOrdersForSeller(sellerId, query = {}) {
    const pagination = parsePagination(query);
    const [orderIds, total] = await Promise.all([
      this.orderItemRepository.listDistinctOrderIdsBySeller(sellerId, {
        skip: pagination.skip,
        limit: pagination.limit,
      }),
      this.orderItemRepository.countDistinctOrdersBySeller(sellerId),
    ]);

    const orders = orderIds.length
      ? await this.orderRepository.find({ _id: { $in: orderIds } }, { sort: '-createdAt' })
      : [];

    return {
      items: orders.map((o) => this._serializeOrder(o)),
      meta: buildPaginationMeta(pagination.page, pagination.limit, total),
    };
  }

  async getOrderDetail(orderId, userId) {
    const order = await this.orderRepository.findOne({ _id: orderId, userId });
    if (!order) throw AppError.notFound('Order not found');
    return this._buildOrderDetail(order);
  }

  async getOrderDetailForSeller(orderId, sellerId) {
    const order = await this.orderRepository.findActiveById(orderId);
    if (!order) throw AppError.notFound('Order not found');

    const items = await this.orderItemRepository.listByOrderId(order._id);
    const hasSellerItem = items.some((it) => String(it.sellerId) === String(sellerId));
    if (!hasSellerItem) throw AppError.forbidden('Seller cannot access this order');

    return this._buildOrderDetail(order, sellerId);
  }

  async _buildOrderDetail(order, sellerId = null) {
    let orderItems = await this.orderItemRepository.listByOrderId(order._id);
    if (sellerId) {
      orderItems = orderItems.filter((it) => String(it.sellerId) === String(sellerId));
    }

    const tracking = await this.orderTrackingRepository.find({ orderId: order._id }, { sort: { createdAt: 1 } });

    return {
      order: this._serializeOrder(order),
      items: orderItems.map((it) => ({
        id: it._id,
        productId: it.productId,
        sellerId: it.sellerId,
        quantity: it.quantity,
        unitPrice: it.unitPrice,
        lineTotal: it.lineTotal,
      })),
      tracking: tracking.map((t) => ({ id: t._id, status: t.status, note: t.note, createdAt: t.createdAt })),
    };
  }

  async getTracking(orderId, userId) {
    const order = await this.orderRepository.findActiveById(orderId, userId);
    if (!order) throw AppError.notFound('Order not found');

    const tracking = await this.orderTrackingRepository.listByOrderId(order._id);
    const history = await this.orderStatusHistoryRepository.listByOrderId(order._id);

    return {
      orderId: order._id,
      status: order.status,
      tracking: tracking.map((t) => ({
        id: t._id,
        status: t.status,
        note: t.note,
        createdAt: t.createdAt,
      })),
      history: history.map((h) => ({
        id: h._id,
        fromStatus: h.fromStatus,
        toStatus: h.toStatus,
        changedBy: h.changedBy,
        note: h.note,
        createdAt: h.createdAt,
      })),
    };
  }

  async cancelOrder(orderId, userId) {
    return withTransaction(async (session) => {
      const order = await this.orderRepository.findActiveById(orderId, userId);
      if (!order) throw AppError.notFound('Order not found');

      const previousStatus = order.status;
      if (order.status === ORDER_STATUS.CANCELLED) {
        return { orderId: order._id, status: order.status };
      }

      if ([ORDER_STATUS.SHIPPED, ORDER_STATUS.OUT_FOR_DELIVERY, ORDER_STATUS.DELIVERED].includes(order.status)) {
        throw AppError.conflict('Cannot cancel this order at the current status');
      }

      if (order.inventoryDeducted) {
        const orderItems = await this.orderItemRepository.listByOrderId(order._id);
        for (const it of orderItems) {
          await this.productRepository.incrementStock(it.productId, it.quantity, session);
        }
      }

      await this.orderRepository.updateById(
        order._id,
        { status: ORDER_STATUS.CANCELLED, cancelledAt: new Date(), inventoryDeducted: false },
        session
      );

      await this.orderTrackingRepository.createInitial(order._id, ORDER_STATUS.CANCELLED, 'Order cancelled', { source: 'customer' }, session);
      await this.orderStatusHistoryRepository.addTransition(
        {
          orderId: order._id,
          fromStatus: previousStatus,
          toStatus: ORDER_STATUS.CANCELLED,
          changedBy: 'customer',
          changedById: userId,
          note: 'Cancellation request',
        },
        session
      );

      this._emitStatusChange(order, ORDER_STATUS.CANCELLED);

      return { orderId: order._id, status: ORDER_STATUS.CANCELLED };
    });
  }

  _isValidStatusTransition(fromStatus, toStatus) {
    if (toStatus === ORDER_STATUS.CANCELLED) return fromStatus !== ORDER_STATUS.DELIVERED;
    const chain = [
      ORDER_STATUS.PENDING,
      ORDER_STATUS.CONFIRMED,
      ORDER_STATUS.PACKED,
      ORDER_STATUS.SHIPPED,
      ORDER_STATUS.OUT_FOR_DELIVERY,
      ORDER_STATUS.DELIVERED,
    ];
    const fromIdx = chain.indexOf(fromStatus);
    const toIdx = chain.indexOf(toStatus);
    if (fromIdx < 0 || toIdx < 0) return false;
    return toIdx === fromIdx + 1;
  }

  async updateStatusAsSeller({ orderId, sellerId, toStatus, note = null }) {
    return withTransaction(async (session) => {
      const order = await this.orderRepository.findActiveById(orderId);
      if (!order) throw AppError.notFound('Order not found');

      const items = await this.orderItemRepository.listByOrderId(order._id);
      const hasSellerItem = items.some((it) => String(it.sellerId) === String(sellerId));
      if (!hasSellerItem) throw AppError.forbidden('Seller cannot update this order');

      if (!this._isValidStatusTransition(order.status, toStatus)) {
        throw AppError.validation('Invalid status transition');
      }

      const previousStatus = order.status;
      await this.orderRepository.updateStatus(order._id, toStatus, session);

      await this.orderTrackingRepository.createInitial(order._id, toStatus, note, { source: 'seller', sellerId }, session);
      await this.orderStatusHistoryRepository.addTransition(
        {
          orderId: order._id,
          fromStatus: previousStatus,
          toStatus,
          changedBy: 'seller',
          changedById: sellerId,
          note,
        },
        session
      );

      this._emitStatusChange(order, toStatus);

      return { orderId: order._id, status: toStatus };
    });
  }

  async updateStatusAsAdmin({ orderId, adminId, toStatus, note = null }) {
    return withTransaction(async (session) => {
      const order = await this.orderRepository.findActiveById(orderId);
      if (!order) throw AppError.notFound('Order not found');

      if (!this._isValidStatusTransition(order.status, toStatus)) {
        throw AppError.validation('Invalid status transition');
      }

      const previousStatus = order.status;
      await this.orderRepository.updateStatus(order._id, toStatus, session);

      await this.orderTrackingRepository.createInitial(order._id, toStatus, note, { source: 'admin', adminId }, session);
      await this.orderStatusHistoryRepository.addTransition(
        {
          orderId: order._id,
          fromStatus: previousStatus,
          toStatus,
          changedBy: 'admin',
          changedById: adminId,
          note,
        },
        session
      );

      this._emitStatusChange(order, toStatus);

      return { orderId: order._id, status: toStatus };
    });
  }

  _serializeOrder(order) {
    return {
      id: order._id,
      orderNumber: order.orderNumber,
      status: order.status,
      paymentMethod: order.paymentMethod,
      paymentStatus: order.paymentStatus,
      commerceFlow: order.commerceFlow,
      subtotal: order.subtotal,
      couponDiscount: order.couponDiscount,
      discount: order.discount,
      tax: order.tax,
      deliveryCharge: order.deliveryCharge,
      total: order.total,
      sellerSubOrders: order.sellerSubOrders,
      createdAt: order.createdAt,
      cancelledAt: order.cancelledAt,
      deliveredAt: order.deliveredAt,
    };
  }
}

module.exports = {
  OrderService,
};
