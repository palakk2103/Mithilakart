const { BaseService } = require('../../core/BaseService');
const { AppError } = require('../../utils/AppError');
const { withTransaction } = require('../../database');
const { parsePagination, buildPaginationMeta } = require('../../utils/pagination');
const { CART, ORDER_STATUS, PAYMENT_STATUS } = require('../../constants/commerce');
const { randomUuid } = require('../../utils/cryptoHelper');
const { eventBus } = require('../../events/EventBus');
const { getProvider } = require('../../core/providers.registry');
const { logger } = require('../../utils/logger');

const { resolveTabFromQuery, toLegacyCommerceFlow, deliveryTypeForTab, isQuickCommerceTab } = require('../../utils/marketplaceTab');
const LOCAL_DELIVERY_FLOWS = new Set(['quick_shop', 'fresh_grocery']);
/** An unpaid online order releases its stock after this long. */
const ABANDONED_PAYMENT_MINUTES = 30;

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
    courierShipmentService = null,
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
    this.courierShipmentService = courierShipmentService;
    this.deliveryOrderService = null;
    this.fulfillmentEngineService = null;
    this.quickServiceAreaService = null;
  }

  /** Optional: when set, quick-tab checkout verifies the address is in range. */
  setQuickServiceAreaService(quickServiceAreaService) {
    this.quickServiceAreaService = quickServiceAreaService;
  }

  setCourierShipmentService(courierShipmentService) {
    this.courierShipmentService = courierShipmentService;
  }

  setDeliveryOrderService(deliveryOrderService) {
    this.deliveryOrderService = deliveryOrderService;
  }

  /** CR-002. Optional: when unset, order placement behaves exactly as before. */
  setFulfillmentEngineService(fulfillmentEngineService) {
    this.fulfillmentEngineService = fulfillmentEngineService;
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

    if (idempotencyKey) {
      const existing = await this.orderRepository.findByIdempotencyKey(idempotencyKey, userId);
      if (existing) {
        return {
          orderId: existing._id,
          orderNumber: existing.orderNumber,
          status: existing.status,
          paymentStatus: existing.paymentStatus,
          idempotent: true,
        };
      }
    }

    const result = await withTransaction(async (session) => {
      await this._releaseStalePendingOrders(userId, session);

      const cart = items
        ? await this._buildCartFromItems({ items, commerceFlow, couponCode, userId })
        : await this.cartService.getCart({ userId, sessionId: null, commerceFlow, couponCode });

      if (!cart.items || cart.items.length === 0) {
        throw AppError.validation('Cart is empty');
      }

      // The tab the customer shopped in decides the delivery mode. A product
      // listed in several tabs (Quick Shop AND Mithilakart) used to turn every
      // Mithilakart order for it into a quick one; product flows are no longer
      // consulted here.
      const marketplaceTab = cart.marketplaceTab || resolveTabFromQuery({ commerceFlow }) || 'mithilakart';
      if (cart.items.some((it) => it.marketplaceTab && it.marketplaceTab !== marketplaceTab)) {
        throw AppError.conflict(
          'Your cart has items from different sections. Please check out one section at a time.',
          [{ code: 'CART_TAB_MISMATCH' }]
        );
      }

      const addressSnapshot = await this._buildAddressSnapshot(userId, addressId);
      if (isQuickCommerceTab(marketplaceTab) && this.quickServiceAreaService) {
        await this.quickServiceAreaService.assertDeliverable({
          items: cart.items,
          location: { lat: addressSnapshot.lat, lng: addressSnapshot.lng },
          marketplaceTab,
        });
      }

      for (const it of cart.items) {
        await this.productRepository.reserveStock(it.productId, it.quantity, session);
      }

      const orderNumber = this._generateOrderNumber();
      const sellerSubOrders = this.pricingService.buildSellerSubOrders(cart.items, ORDER_STATUS.PENDING);
      const legacyFlow = marketplaceTab ? toLegacyCommerceFlow(marketplaceTab) : commerceFlow;
      const deliveryType = marketplaceTab ? deliveryTypeForTab(marketplaceTab) : null;
      const promiseMinutes = cart.items.reduce(
        (max, it) => Math.max(max, Number(it.deliveryPromiseMinutes) || 0),
        0
      ) || null;
      const estimatedDeliveryAt = promiseMinutes
        ? new Date(Date.now() + promiseMinutes * 60 * 1000)
        : null;

      const order = await this.orderRepository.create(
        {
          userId,
          orderNumber,
          status: ORDER_STATUS.PENDING,
          commerceFlow: legacyFlow || commerceFlow,
          marketplaceTab,
          deliveryType,
          deliveryPromiseMinutes: promiseMinutes || null,
          estimatedDeliveryAt,
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
          idempotencyKey: idempotencyKey || null,
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
        listingId: it.listingId || null,
        variantId: it.variantId || null,
        quantity: it.quantity,
        unitPrice: it.unitPrice,
        lineTotal: it.unitPrice * it.quantity,
        listingSnapshot: it.listingId ? {
          listingId: it.listingId,
          marketplaceTab: it.marketplaceTab || marketplaceTab,
          deliveryPromiseMinutes: it.deliveryPromiseMinutes || null,
          unitPrice: it.unitPrice,
        } : null,
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

      const updatedOrder = await this.orderRepository.findById(order._id, { session });

      return {
        orderId: order._id,
        orderNumber: order.orderNumber,
        status: updatedOrder?.status || order.status,
        paymentStatus: paymentResult?.paymentStatus || order.paymentStatus,
        payment: paymentResult || null,
      };
    });

    // Cart clearing happens AFTER the transaction commits, never inside it.
    //
    // Placement is the trigger, not payment success: a COD or pending-Razorpay
    // order is a real order, and the cart has been consumed by it. If the
    // transaction threw (payment declined, order creation failed, rollback),
    // the await above rejects and we never reach here — so a failed order
    // correctly leaves the cart intact.
    //
    // `items` means a direct "Buy Now" that bypassed the cart; wiping the
    // whole cart there would delete unrelated items the customer still wants.
    const placedFromCart = !items;

    // An online payment still pending (Razorpay sheet open) keeps the cart:
    // if the customer closes the sheet they can retry without re-adding
    // everything. The app clears the cart once the payment is verified.
    if (placedFromCart && result?.orderId && result.paymentStatus === PAYMENT_STATUS.PAID) {
      try {
        await this.cartService.clearCart({ userId, sessionId: null });
      } catch (err) {
        // The order is already committed — a cart-clearing failure must never
        // fail the request. Logged via the module logger; `this.logger` does
        // not exist on BaseService and silently swallowed this before.
        logger.error({ err, userId, orderId: result.orderId },
          'Failed to clear cart after order placement');
      }
    }

    return result;
  }

  /**
   * CR-002 — customer-safe fulfillment state.
   *
   * Poll target for clients whose socket dropped. Returns only the coarse
   * projection: never the candidate seller list, rank scores, attempt history,
   * or internal failure codes.
   */
  async getFulfillmentStatus(orderId, userId) {
    const order = await this.orderRepository.findActiveById(orderId, userId);
    if (!order) throw AppError.notFound('Order not found');

    const fulfillment = order.fulfillment || {};
    let state = null;

    if (this.orderFulfillmentRepository) {
      try {
        const record = await this.orderFulfillmentRepository.findByOrderId(order._id);
        state = record?.state || null;
      } catch (err) {
        logger.warn({ err, orderId: String(order._id) }, 'CR-002 fulfillment status lookup failed');
      }
    }

    return {
      orderId: String(order._id),
      status: order.status,
      state,
      deliveryMode: fulfillment.deliveryMode ?? null,
      estimatedDeliveryMinutes: fulfillment.estimatedDeliveryMinutes ?? null,
      estimatedDeliveryAt: fulfillment.estimatedDeliveryAt ?? order.estimatedDeliveryAt ?? null,
      fulfillmentType: fulfillment.type ?? order.fulfilmentType ?? null,
      fallbackLevel: fulfillment.fallbackLevel ?? 0,
      updatedAt: order.updatedAt,
    };
  }

  async releaseOrderReservations(orderId, session = null) {
    const order = await this.orderRepository.findById(orderId, { session });
    if (!order || order.inventoryDeducted) return;

    const orderItems = await this.orderItemRepository.listByOrderId(orderId, { session });
    for (const it of orderItems) {
      await this.productRepository.releaseReservedStock(it.productId, it.quantity, session);
    }
  }

  /**
   * Online orders whose payment was never completed (sheet closed, app
   * killed) hold reserved stock. Without this they held it until the same
   * customer happened to order again. Run by the fulfillment sweeper.
   */
  async expireAbandonedPayments({ olderThanMinutes = ABANDONED_PAYMENT_MINUTES, limit = 100 } = {}) {
    const cutoff = new Date(Date.now() - olderThanMinutes * 60 * 1000);
    const stale = await this.orderRepository.find({
      status: ORDER_STATUS.PENDING,
      paymentStatus: PAYMENT_STATUS.PENDING,
      inventoryDeducted: false,
      deletedAt: null,
      createdAt: { $lt: cutoff },
    }, { limit });

    let expired = 0;
    for (const order of stale) {
      try {
        await withTransaction(async (session) => {
          const moved = await this.orderRepository.updateStatusOptimistic(
            order._id, ORDER_STATUS.PENDING, ORDER_STATUS.CANCELLED, session
          );
          if (!moved) return; // paid or cancelled meanwhile
          await this.releaseOrderReservations(order._id, session);
          await this.orderRepository.updateById(order._id, {
            paymentStatus: PAYMENT_STATUS.FAILED,
            cancelledAt: new Date(),
          }, session);
          await this.orderTrackingRepository.createInitial(order._id, ORDER_STATUS.CANCELLED,
            'Payment was not completed — order cancelled', { source: 'system' }, session);
          await this.orderStatusHistoryRepository.addTransition({
            orderId: order._id,
            fromStatus: ORDER_STATUS.PENDING,
            toStatus: ORDER_STATUS.CANCELLED,
            changedBy: 'system',
            changedById: null,
            note: 'Payment not completed',
          }, session);
          expired += 1;
        });
      } catch (err) {
        logger.error({ err, orderId: String(order._id) }, 'Expiring abandoned payment failed');
      }
    }
    return { expired };
  }

  async _releaseStalePendingOrders(userId, session = null) {
    const staleOrders = await this.orderRepository.findUnpaidPendingByUser(userId, { session });

    for (const order of staleOrders) {
      await this.releaseOrderReservations(order._id, session);
      await this.orderRepository.updateById(
        order._id,
        {
          status: ORDER_STATUS.CANCELLED,
          paymentStatus: PAYMENT_STATUS.FAILED,
          cancelledAt: new Date(),
        },
        session
      );
    }
  }

  async confirmOrder(orderId, changedById, session = null) {
    const order = await this.orderRepository.findById(orderId, { session });
    if (!order) throw AppError.notFound('Order not found');

    if (order.status === ORDER_STATUS.PLACED || order.status === ORDER_STATUS.CONFIRMED || order.inventoryDeducted) {
      return order;
    }

    // Read inside the session: for COD this runs in the checkout transaction,
    // and an unsessioned read saw no items, so stock was never deducted while
    // the order was still flagged inventoryDeducted.
    const orderItems = await this.orderItemRepository.listByOrderId(order._id, { session });
    for (const it of orderItems) {
      await this.productRepository.decrementStock(it.productId, it.quantity, session);
    }

    await this.orderRepository.updateById(
      orderId,
      {
        status: ORDER_STATUS.PLACED,
        inventoryDeducted: true,
        sellerSubOrders: (order.sellerSubOrders || []).map((sub) => ({
          sellerId: sub.sellerId,
          items: sub.items,
          subtotal: sub.subtotal,
          status: ORDER_STATUS.PLACED,
        })),
      },
      session
    );

    await this.orderTrackingRepository.createInitial(orderId, ORDER_STATUS.PLACED, 'Order placed — awaiting seller acceptance', {}, session);
    await this.orderStatusHistoryRepository.addTransition(
      {
        orderId,
        fromStatus: order.status,
        toStatus: ORDER_STATUS.PLACED,
        changedBy: 'system',
        changedById: changedById,
        note: 'Payment completed',
      },
      session
    );

    const updated = await this.orderRepository.findById(orderId, { session });
    if (updated) {
      this._emitStatusChange(updated, ORDER_STATUS.PLACED);
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

    let latitude = address.location?.coordinates?.[1] ?? address.latitude;
    let longitude = address.location?.coordinates?.[0] ?? address.longitude;
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
    let tab = order.marketplaceTab || null;
    let flow = tab ? toLegacyCommerceFlow(tab) : (order.commerceFlow || 'standard');

    // Only legacy orders without a tab are inferred from product flows; a
    // Mithilakart order for a product also sold in Quick Shop stays courier.
    if (!tab) {
      try {
        const orderItems = await this.orderItemRepository.listByOrderId(order._id, { session });
        for (const it of orderItems) {
          const prod = await this.productRepository.findById(it.productId);
          if (prod?.commerceFlows?.includes('quick_shop')) {
            tab = 'quick_shop';
            flow = 'quick_shop';
            break;
          } else if (prod?.commerceFlows?.includes('fresh_grocery')) {
            tab = 'groceries_fresh';
            flow = 'fresh_grocery';
            break;
          }
        }
      } catch (err) {
        // Continue safely
      }
    }

    const useLocalDelivery = tab
      ? isQuickCommerceTab(tab)
      : LOCAL_DELIVERY_FLOWS.has(flow);

    if (useLocalDelivery && this.deliveryOrderService) {
      await this.orderRepository.updateById(
        order._id,
        { fulfilmentType: 'local_delivery' },
        session
      );

      // CR-002 — intelligent fulfillment for quick-commerce tabs.
      //
      // Started AFTER THE TRANSACTION COMMITS, never inside it. The engine
      // reads the order on its own connection, so starting it here while the
      // checkout transaction was still open meant it could not see the order
      // at all — it logged "start called for a missing order" and the order was
      // silently never fulfilled. That race is why fulfillment "sometimes"
      // failed to progress in the browser while every unit test passed.
      //
      // Still fire-and-forget once committed: the engine runs after payment
      // authorisation so the discovery window is a backend budget, never
      // customer-facing latency, and an engine fault can never roll back a paid
      // order. If the transaction aborts, the hook never runs — a rolled-back
      // order must not trigger fulfillment.
      //
      // Both guards matter: without the service injected, or with the tab
      // disabled, behaviour is byte-identical to before CR-002.
      if (this.fulfillmentEngineService) {
        const startEngine = async () => {
          try {
            if (await this.fulfillmentEngineService.isEnabledForTab(tab)) {
              await this.fulfillmentEngineService.start(order._id);
            }
          } catch (err) {
            logger.error({ err, orderId: order._id }, 'CR-002 fulfillment engine start failed');
          }
        };

        if (session && typeof session.afterCommit === 'function') {
          session.afterCommit(startEngine);
        } else {
          // No transaction in play (direct call, tests): safe to start at once.
          Promise.resolve(startEngine()).catch(() => {});
        }
      }
    } else {
      let shipment = null;
      try {
        shipment = this.courierShipmentService
          ? await this.courierShipmentService.createForOrder(order, session)
          : await getProvider('shipping').createShipment({
              orderId: order._id,
              orderNumber: order.orderNumber,
              address: order.addressSnapshot || {},
            });
      } catch (error) {
        logger.error({ err: error, orderId: order._id }, 'Courier shipment failed, generating fallback courier shipment');
        const { MockCourierShippingProvider } = require('../../core/providers/MockCourierShippingProvider');
        const fallback = new MockCourierShippingProvider();
        shipment = await fallback.createShipment({
          orderId: order._id,
          orderNumber: order.orderNumber,
          address: order.addressSnapshot || {},
        });
        shipment.warning = error.message;
      }

      await this.orderRepository.updateById(
        order._id,
        { fulfilmentType: 'courier', shipment },
        session
      );
      logger.info({ orderId: order._id, awb: shipment?.awb }, 'Courier shipment configured for e-commerce order');
      eventBus.publish('order.shipment_created', {
        orderId: order._id,
        orderNumber: order.orderNumber,
        userId: order.userId,
        shipment,
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
    const requestedTab = resolveTabFromQuery({ commerceFlow });
    const listingService = this.cartService?.marketplaceListingService || null;

    for (const line of items) {
      // Buy Now carries the listing the customer was looking at: it fixes the
      // tab, price and delivery promise exactly as the cart would.
      const resolved = line.listingId && listingService
        ? await listingService.resolveListingForCart(line.listingId, requestedTab)
        : null;
      const listing = resolved?.listing || null;
      const product = resolved?.product || await this.productRepository.findPublicById(line.productId);
      if (!product) throw AppError.notFound('Product not found');
      if (listing && line.productId && String(product._id) !== String(line.productId)) {
        throw AppError.validation('Listing does not match product');
      }

      const availableStock = this.productRepository.getAvailableStock(product);

      if (availableStock < line.quantity) {
        throw AppError.conflict('Requested quantity exceeds available stock', [
          { field: 'quantity', message: 'Insufficient stock', availableQuantity: availableStock },
        ]);
      }

      const flows = product.commerceFlows || [];
      const requestedFlow = requestedTab ? toLegacyCommerceFlow(requestedTab) : null;
      const itemTab = listing?.marketplaceTab
        || (requestedFlow && flows.includes(requestedFlow) ? requestedTab : null)
        || (flows.includes('quick_shop') ? 'quick_shop'
          : flows.includes('fresh_grocery') ? 'groceries_fresh'
            : flows.includes('mithilak') ? 'mithilak' : 'mithilakart');

      lineItems.push({
        productId: String(product._id),
        listingId: listing ? String(listing._id) : null,
        variantId: line.variantId || null,
        sellerId: product.sellerId,
        title: product.title,
        quantity: line.quantity,
        unitPrice: listing ? listing.price : product.price,
        deliveryPromiseMinutes: listing?.deliveryPromiseMinutes || null,
        commerceFlow: toLegacyCommerceFlow(itemTab),
        commerceFlows: flows,
        marketplaceTab: itemTab,
      });
    }

    const resolvedTab = lineItems[0].marketplaceTab;
    if (lineItems.some((it) => it.marketplaceTab !== resolvedTab)) {
      throw AppError.conflict('Buy Now items must come from one section', [{ code: 'CART_TAB_MISMATCH' }]);
    }

    const pricing = await this.pricingService.calculateTotals({
      items: lineItems,
      couponCode,
      userId,
    });

    return {
      items: lineItems,
      commerceFlow: toLegacyCommerceFlow(resolvedTab) || commerceFlow,
      marketplaceTab: resolvedTab,
      couponCode,
      ...pricing,
    };
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
      items: await this._withLineDetails(items.map((o) => this._serializeOrder(o))),
      meta: buildPaginationMeta(pagination.page, pagination.limit, total),
    };
  }

  /**
   * Sub-order lines store only ids and prices; the order list needs the
   * product name and picture, or every card reads "Product".
   */
  async _withLineDetails(orders) {
    const productIds = [...new Set(orders.flatMap((o) => (o.sellerSubOrders || [])
      .flatMap((sub) => (sub.items || []).map((it) => String(it.productId)))))];
    if (!productIds.length) return orders;

    const products = await this.productRepository.find({ _id: { $in: productIds } });
    const productById = new Map(products.map((p) => [String(p._id), p]));

    return orders.map((order) => ({
      ...order,
      sellerSubOrders: (order.sellerSubOrders || []).map((sub) => {
        const plain = sub.toObject ? sub.toObject() : sub;
        return {
          ...plain,
          items: (plain.items || []).map((it) => {
            const product = productById.get(String(it.productId));
            return {
              ...it,
              name: it.name || product?.title || 'Product',
              image: it.image || product?.images?.[0]?.url || null,
            };
          }),
        };
      }),
    }));
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

    const items = await Promise.all(
      orders.map(async (order) => {
        const sellerItems = (await this.orderItemRepository.listByOrderId(order._id)).filter(
          (it) => String(it.sellerId) === String(sellerId)
        );
        const productIds = sellerItems.map((it) => it.productId);
        const products = productIds.length
          ? await this.productRepository.find({ _id: { $in: productIds } })
          : [];
        const productMap = new Map(products.map((product) => [String(product._id), product]));
        return this._serializeSellerOrder(order, sellerItems, productMap);
      })
    );

    return {
      items,
      meta: buildPaginationMeta(pagination.page, pagination.limit, total),
    };
  }

  async getOrderDetail(orderId, userId) {
    const order = await this.orderRepository.findActiveById(orderId, userId);
    if (!order) throw AppError.notFound('Order not found');
    return this._buildOrderDetail(order);
  }

  async getOrderDetailForSeller(orderId, sellerId) {
    const order = await this.orderRepository.findActiveById(orderId);
    if (!order) throw AppError.notFound('Order not found');

    const items = await this.orderItemRepository.listByOrderId(order._id);
    const sellerItems = items.filter((it) => String(it.sellerId) === String(sellerId));
    if (!sellerItems.length) throw AppError.forbidden('Seller cannot access this order');

    const productIds = sellerItems.map((it) => it.productId);
    const products = productIds.length
      ? await this.productRepository.find({ _id: { $in: productIds } })
      : [];
    const productMap = new Map(products.map((product) => [String(product._id), product]));

    const tracking = await this.orderTrackingRepository.find(
      { orderId: order._id },
      { sort: { createdAt: 1 } }
    );

    const pickup = this.deliveryOrderService && order.fulfilmentType === 'local_delivery'
      ? await this.deliveryOrderService.getPickupInfo(order._id)
      : null;

    return {
      ...this._serializeSellerOrder(order, sellerItems, productMap),
      pickup,
      tracking: tracking.map((entry) => ({
        id: entry._id,
        status: entry.status,
        note: entry.note,
        createdAt: entry.createdAt,
      })),
    };
  }

  async _buildOrderDetail(order, sellerId = null) {
    let orderItems = await this.orderItemRepository.listByOrderId(order._id);
    if (sellerId) {
      orderItems = orderItems.filter((it) => String(it.sellerId) === String(sellerId));
    }

    const productIds = [...new Set(orderItems.map((it) => it.productId).filter(Boolean))];
    const products = productIds.length
      ? await this.productRepository.find({ _id: { $in: productIds } })
      : [];
    const productMap = new Map(products.map((p) => [String(p._id), p]));

    const tracking = await this.orderTrackingRepository.find({ orderId: order._id }, { sort: { createdAt: 1 } });

    return {
      order: this._serializeOrder(order),
      items: orderItems.map((it) => {
        const product = productMap.get(String(it.productId));
        return {
          id: it._id,
          productId: it.productId,
          sellerId: it.sellerId,
          quantity: it.quantity,
          unitPrice: it.unitPrice,
          lineTotal: it.lineTotal,
          name: product?.name || product?.title || it.name || 'Product',
          image: product?.images?.[0]?.url || product?.imageUrl || product?.image || null,
        };
      }),
      tracking: tracking.map((t) => ({ id: t._id, status: t.status, note: t.note, createdAt: t.createdAt })),
    };
  }

  async getTracking(orderId, userId) {
    let order = await this.orderRepository.findActiveById(orderId, userId);
    if (!order) throw AppError.notFound('Order not found');

    if (order.fulfilmentType === 'courier' && order.shipment && this.courierShipmentService) {
      try {
        const synced = await this.courierShipmentService.syncTrackingForOrder(order);
        order = synced.order || order;
      } catch (error) {
        logger.warn({ err: error, orderId }, 'Courier tracking sync failed');
      }
    }

    const tracking = await this.orderTrackingRepository.listByOrderId(order._id);
    const history = await this.orderStatusHistoryRepository.listByOrderId(order._id);

    let assignment = null;
    let partnerLocation = null;
    let deliveryOtp = null;
    if (this.deliveryOrderService) {
      const trackingMeta = await this.deliveryOrderService.getTrackingMeta(order._id);
      assignment = trackingMeta.assignment;
      partnerLocation = trackingMeta.partnerLocation;
      deliveryOtp = trackingMeta.deliveryOtp || assignment?.deliveryOtp || null;
    }

    const addr = order.addressSnapshot || {};

    const deliveryMode = order.fulfillment?.deliveryMode
      || (order.fulfilmentType === 'courier' ? 'standard' : (order.deliveryType === 'quick' ? 'quick' : 'standard'));

    return {
      orderId: order._id,
      status: order.status,
      orderNumber: order.orderNumber,
      commerceFlow: order.commerceFlow,
      marketplaceTab: order.marketplaceTab || null,
      fulfilmentType: order.fulfilmentType,
      fulfillmentType: order.fulfillment?.type || order.fulfilmentType,
      fulfillment: order.fulfillment || null,
      deliveryMode,
      deliveryPromiseMinutes: deliveryMode === 'standard' ? null : (order.deliveryPromiseMinutes || null),
      estimatedDeliveryAt: deliveryMode === 'standard' ? null : (order.estimatedDeliveryAt || order.fulfillment?.estimatedDeliveryAt || null),
      fallbackReason: order.fulfillment?.fallbackReason || null,
      shipment: order.shipment || null,
      destination: {
        lat: addr.lat ?? addr.latitude ?? null,
        lng: addr.lng ?? addr.longitude ?? null,
        line1: addr.line1 || addr.addressLine || '',
        city: addr.city || '',
        pincode: addr.pincode || '',
      },
      assignment,
      partnerLocation,
      deliveryOtp,
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

  /**
   * Gives back the stock an order holds. Confirmed orders were deducted (and a
   * line a substitute seller fulfilled was deducted from that seller's shelf);
   * unconfirmed ones only hold a reservation.
   */
  async _restoreInventory(order, session = null) {
    const orderItems = await this.orderItemRepository.listByOrderId(order._id, { session });
    if (!order.inventoryDeducted) {
      for (const it of orderItems) {
        await this.productRepository.releaseReservedStock(it.productId, it.quantity, session);
      }
      return;
    }

    const substitutions = this.fulfillmentEngineService
      ? await this.fulfillmentEngineService.listSettledSubstitutions(order._id)
      : [];
    for (const it of orderItems) {
      const substitute = substitutions.find((s) => String(s.originProductId) === String(it.productId));
      await this.productRepository.incrementStock(substitute ? substitute.productId : it.productId, it.quantity, session);
    }
  }

  /**
   * Everything a cancellation must undo besides the status: stock, the
   * courier booking, a quick-delivery search/offer, and the rider assignment.
   * Whoever cancels (customer, seller, admin) goes through here.
   */
  async _applyCancellation({ order, session, source, actorId, note }) {
    await this._restoreInventory(order, session);

    if (order.fulfilmentType === 'courier' && order.shipment && this.courierShipmentService) {
      try {
        await this.courierShipmentService.cancelCourierShipment(order);
      } catch (error) {
        logger.warn({ err: error, orderId: order._id }, 'Courier shipment cancellation failed');
      }
    }

    if (order.fulfilmentType === 'local_delivery' && this.deliveryOrderService) {
      await this.deliveryOrderService.cancelAssignmentForOrder(order._id, session);
    }

    await this.orderRepository.updateById(
      order._id,
      { status: ORDER_STATUS.CANCELLED, cancelledAt: new Date(), inventoryDeducted: false },
      session
    );

    await this.orderTrackingRepository.createInitial(order._id, ORDER_STATUS.CANCELLED, note || 'Order cancelled', { source }, session);
    await this.orderStatusHistoryRepository.addTransition(
      {
        orderId: order._id,
        fromStatus: order.status,
        toStatus: ORDER_STATUS.CANCELLED,
        changedBy: source,
        changedById: actorId,
        note: note || null,
      },
      session
    );

    // A prepaid order gets its money back to the original payment method once
    // the cancellation has committed. COD orders have nothing to refund.
    if (order.paymentStatus === PAYMENT_STATUS.PAID && order.paymentMethod !== 'cod' && this.paymentService?.refundOrderPayment) {
      const refund = () => this.paymentService.refundOrderPayment(order._id, { reason: `cancelled_by_${source}` })
        .catch(async (err) => {
          logger.error({ err, orderId: order._id }, 'Refund on cancellation failed — needs manual refund');
          await this.orderTrackingRepository.createInitial(order._id, ORDER_STATUS.CANCELLED,
            'Refund could not be sent automatically — our team will process it', { source: 'system' }).catch(() => {});
        });
      if (session && typeof session.afterCommit === 'function') session.afterCommit(refund);
      else await refund();
    }

    // The engine works on its own connection, so it is told only once the
    // cancellation has committed.
    if (this.fulfillmentEngineService && order.fulfilmentType === 'local_delivery') {
      const cancelFulfillment = () => this.fulfillmentEngineService.cancelForOrder(order._id).catch((err) => {
        logger.error({ err, orderId: order._id }, 'Cancelling quick fulfillment failed');
      });
      if (session && typeof session.afterCommit === 'function') session.afterCommit(cancelFulfillment);
      else await cancelFulfillment();
    }

    this._emitStatusChange(order, ORDER_STATUS.CANCELLED);
  }

  async cancelOrder(orderId, userId) {
    return withTransaction(async (session) => {
      const order = await this.orderRepository.findActiveById(orderId, userId);
      if (!order) throw AppError.notFound('Order not found');

      if (order.status === ORDER_STATUS.CANCELLED) {
        return { orderId: order._id, status: order.status };
      }

      if ([ORDER_STATUS.SHIPPED, ORDER_STATUS.OUT_FOR_DELIVERY, ORDER_STATUS.DELIVERED].includes(order.status)) {
        throw AppError.conflict('Cannot cancel this order at the current status');
      }

      await this._applyCancellation({
        order, session, source: 'customer', actorId: userId, note: 'Cancellation request',
      });

      return { orderId: order._id, status: ORDER_STATUS.CANCELLED };
    });
  }

  _isValidStatusTransition(fromStatus, toStatus) {
    if (toStatus === ORDER_STATUS.CANCELLED) return fromStatus !== ORDER_STATUS.DELIVERED;
    if (fromStatus === ORDER_STATUS.SHIPPED && toStatus === ORDER_STATUS.DELIVERED) return true;
    const chain = [
      ORDER_STATUS.PENDING,
      ORDER_STATUS.PLACED,
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

  /**
   * A quick-commerce order is accepted or declined through the fulfillment
   * offer. The seller panel's generic "new order" popup sends status
   * confirmed/cancelled instead; without this, Accept left the engine's offer
   * dangling (it later timed out and re-routed an order already being packed)
   * and Reject cancelled the customer's order outright.
   *
   * Returns null when the request is not an offer response.
   */
  async _respondToQuickOffer({ orderId, sellerId, toStatus, note }) {
    if (!this.fulfillmentEngineService
      || ![ORDER_STATUS.CONFIRMED, ORDER_STATUS.CANCELLED].includes(toStatus)) {
      return null;
    }

    const view = await this.fulfillmentEngineService.sellerView(orderId, sellerId);
    if (!view?.fulfillment) return null;

    if (!view.offer) {
      const searching = ['searching', 'seller_assigned', 'warehouse_pending'].includes(view.fulfillment.state);
      if (toStatus === ORDER_STATUS.CONFIRMED && searching) {
        throw AppError.conflict('This quick order is being offered to another store');
      }
      return null;
    }

    if (toStatus === ORDER_STATUS.CONFIRMED) {
      const accepted = await this.fulfillmentEngineService.handleSellerAccept({ attemptId: view.offer._id, sellerId });
      if (!accepted.ok) throw AppError.offerExpired('This order is no longer available');
      return { orderId: view.fulfillment.orderId, status: ORDER_STATUS.CONFIRMED };
    }

    const rejected = await this.fulfillmentEngineService.handleSellerReject({
      attemptId: view.offer._id, sellerId, reason: note || 'seller_declined',
    });
    if (!rejected.ok) throw AppError.offerExpired('This order is no longer available');
    return { orderId: view.fulfillment.orderId, status: 'declined', offerDeclined: true };
  }

  async updateStatusAsSeller({ orderId, sellerId, toStatus, note = null }) {
    const offerResponse = await this._respondToQuickOffer({ orderId, sellerId, toStatus, note });
    if (offerResponse) return offerResponse;

    return withTransaction(async (session) => {
      const order = await this.orderRepository.findActiveById(orderId);
      if (!order) throw AppError.notFound('Order not found');

      const items = await this.orderItemRepository.listByOrderId(order._id);
      const hasSellerItem = items.some((it) => String(it.sellerId) === String(sellerId));
      if (!hasSellerItem) throw AppError.forbidden('Seller cannot update this order');

      if (!this._isValidStatusTransition(order.status, toStatus)) {
        throw AppError.validation('Invalid status transition');
      }

      if (toStatus === ORDER_STATUS.CANCELLED) {
        await this._applyCancellation({
          order, session, source: 'seller', actorId: sellerId, note: note || 'Cancelled by seller',
        });
        return { orderId: order._id, status: ORDER_STATUS.CANCELLED };
      }

      const previousStatus = order.status;
      const updated = await this.orderRepository.updateStatusOptimistic(order._id, previousStatus, toStatus, session);
      if (!updated) {
        throw AppError.conflict('Order status was changed by another actor — please retry');
      }

      // The return window counts from here.
      if (toStatus === ORDER_STATUS.DELIVERED) {
        await this.orderRepository.updateById(order._id, { deliveredAt: new Date() }, session);
      }

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

      if (
        toStatus === ORDER_STATUS.PACKED
        && this.deliveryOrderService
        && order.fulfilmentType === 'local_delivery'
        && order.fulfillment?.type !== 'courier'
        && order.fulfillment?.deliveryMode !== 'standard'
      ) {
        await this.deliveryOrderService.notifyNearbyPartnersForOrder(order._id, session);
      }

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

      if (toStatus === ORDER_STATUS.CANCELLED) {
        await this._applyCancellation({
          order, session, source: 'admin', actorId: adminId, note: note || 'Cancelled by admin',
        });
        return { orderId: order._id, status: ORDER_STATUS.CANCELLED };
      }

      const previousStatus = order.status;
      const updated = await this.orderRepository.updateStatusOptimistic(order._id, previousStatus, toStatus, session);
      if (!updated) {
        throw AppError.conflict('Order status was changed by another actor — please retry');
      }

      if (toStatus === ORDER_STATUS.DELIVERED) {
        await this.orderRepository.updateById(order._id, { deliveredAt: new Date() }, session);
      }

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

      if (
        toStatus === ORDER_STATUS.PACKED
        && this.deliveryOrderService
        && order.fulfilmentType === 'local_delivery'
        && order.fulfillment?.type !== 'courier'
        && order.fulfillment?.deliveryMode !== 'standard'
      ) {
        await this.deliveryOrderService.notifyNearbyPartnersForOrder(order._id, session);
      }

      return { orderId: order._id, status: toStatus };
    });
  }

  _serializeSellerOrder(order, sellerItems = [], productMap = new Map()) {
    const addr = order.addressSnapshot || {};
    const trackingDates = (status) =>
      order[`${status}At`] || null;

    return {
      id: String(order._id),
      orderNumber: order.orderNumber,
      status: order.status,
      placedAt: order.createdAt,
      confirmedAt: trackingDates('confirmed'),
      packedAt: trackingDates('packed'),
      shippedAt: trackingDates('shipped'),
      deliveredAt: order.deliveredAt,
      customer: {
        name: addr.name || 'Customer',
        email: addr.email || '',
        phone: addr.phone || '',
      },
      address: {
        line1: addr.line1 || addr.addressLine || '',
        city: addr.city || '',
        state: addr.state || '',
        pincode: addr.pincode || '',
      },
      products: sellerItems.map((item) => ({
        id: String(item._id),
        productId: item.productId,
        title: productMap.get(String(item.productId))?.title || 'Product',
        price: item.unitPrice,
        qty: item.quantity,
        quantity: item.quantity,
      })),
      payment: {
        method: order.paymentMethod,
        status: order.paymentStatus,
      },
      totalAmount: order.subtotal,
      finalAmount: order.total,
      shippingCharge: order.deliveryCharge,
      discount: order.discount || order.couponDiscount || 0,
      commerceFlow: order.commerceFlow,
      marketplaceTab: order.marketplaceTab || null,
      fulfilmentType: order.fulfilmentType,
      fulfillmentType: order.fulfillment?.type || order.fulfilmentType,
      fulfillment: order.fulfillment || null,
      deliveryMode: order.fulfillment?.deliveryMode || (order.fulfilmentType === 'courier' ? 'standard' : 'quick'),
      shipment: order.shipment || null,
    };
  }

  _serializeOrder(order) {
    const addr = order.addressSnapshot || {};
    const deliveryMode = order.fulfillment?.deliveryMode
      || (order.fulfilmentType === 'courier' ? 'standard' : (order.deliveryType === 'quick' ? 'quick' : null));
    return {
      id: order._id,
      orderNumber: order.orderNumber,
      status: order.status,
      paymentMethod: order.paymentMethod,
      paymentStatus: order.paymentStatus,
      commerceFlow: order.commerceFlow,
      marketplaceTab: order.marketplaceTab || null,
      fulfilmentType: order.fulfilmentType,
      fulfillmentType: order.fulfillment?.type || order.fulfilmentType,
      fulfillment: order.fulfillment || null,
      fulfillmentStatus: order.fulfillmentStatus || order.fulfillment?.status || null,
      deliveryMode,
      deliveryPromiseMinutes: deliveryMode === 'standard' ? null : (order.deliveryPromiseMinutes || null),
      estimatedDeliveryAt: deliveryMode === 'standard' ? null : (order.estimatedDeliveryAt || order.fulfillment?.estimatedDeliveryAt || null),
      fallbackReason: order.fulfillment?.fallbackReason || null,
      shipment: order.shipment || null,
      subtotal: order.subtotal,
      couponDiscount: order.couponDiscount,
      discount: order.discount,
      tax: order.tax,
      deliveryCharge: order.deliveryCharge,
      shippingCharge: order.deliveryCharge,
      platformFee: order.platformFee || 0,
      packagingFee: order.packagingFee || 0,
      total: order.total,
      sellerSubOrders: order.sellerSubOrders,
      addressSnapshot: order.addressSnapshot,
      address: {
        name: addr.name || '',
        phone: addr.phone || '',
        line1: addr.line1 || addr.addressLine || '',
        city: addr.city || '',
        state: addr.state || '',
        pincode: addr.pincode || '',
        lat: addr.lat ?? addr.latitude ?? null,
        lng: addr.lng ?? addr.longitude ?? null,
      },
      createdAt: order.createdAt,
      cancelledAt: order.cancelledAt,
      deliveredAt: order.deliveredAt,
    };
  }
}

module.exports = {
  OrderService,
};
