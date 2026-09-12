const { BaseService } = require('../../core/BaseService');
const { eventBus } = require('../../events/EventBus');
const { FULFILLMENT_EVENTS } = require('../../events/eventTypes');
const { logger } = require('../../utils/logger');
const { randomUuid } = require('../../utils/cryptoHelper');
const { toFiniteNumber } = require('../../utils/numeric');
const { isQuickCommerceTab } = require('../../utils/marketplaceTab');
const {
  FULFILLMENT_STATE: STATE,
  FULFILLMENT_TYPE,
  DELIVERY_MODE,
  FALLBACK_LEVEL,
  ATTEMPT_KIND,
  ATTEMPT_STATUS,
  FULFILLMENT_FAILURE_CODE: FAIL,
} = require('../../constants/fulfillment');

/**
 * CR-002 — the fulfillment orchestrator.
 *
 * ONE CHECKOUT = ONE FULFILLMENT SOURCE. The engine picks exactly one seller,
 * warehouse, or courier for the complete cart. It never splits an order and
 * never leaves part of a cart reserved.
 *
 * Runs asynchronously AFTER payment authorisation, so the configured discovery
 * window (default 30s) is a backend budget, never customer-facing latency.
 *
 * Holds no in-memory state: every decision is persisted before it is emitted,
 * and every deadline is an absolute timestamp the sweeper can act on. That is
 * deliberate — QueueManager has no adapter, so a setTimeout-based design would
 * lose every pending fulfillment on restart or on a second app instance.
 */
class FulfillmentEngineService extends BaseService {
  constructor({
    orderRepository,
    orderItemRepository,
    orderFulfillmentRepository,
    fulfillmentAttemptRepository,
    sellerEligibilityService,
    sellerRankingService,
    fulfillmentReservationService,
    fulfillmentConfigService,
    routingService = null,
    sellerRepository = null,
    productRepository = null,
    marketplaceConfigRepository = null,
    courierShipmentService = null,
  }) {
    super();
    this.orderRepository = orderRepository;
    this.orderItemRepository = orderItemRepository;
    this.orderFulfillmentRepository = orderFulfillmentRepository;
    this.fulfillmentAttemptRepository = fulfillmentAttemptRepository;
    this.sellerEligibilityService = sellerEligibilityService;
    this.sellerRankingService = sellerRankingService;
    this.reservationService = fulfillmentReservationService;
    this.configService = fulfillmentConfigService;
    this.routingService = routingService;
    this.sellerRepository = sellerRepository;
    this.productRepository = productRepository;
    this.marketplaceConfigRepository = marketplaceConfigRepository;
    this.courierShipmentService = courierShipmentService;
  }

  setCourierShipmentService(courierShipmentService) {
    this.courierShipmentService = courierShipmentService;
  }

  /** Only quick-commerce tabs use the engine; standard tabs keep the existing courier path. */
  async isEnabledForTab(marketplaceTab) {
    if (!isQuickCommerceTab(marketplaceTab)) return false;

    try {
      const config = await this.configService.resolve(marketplaceTab);
      return config.quickCommerceEnabled !== false;
    } catch (error) {
      logger.error({ err: error, marketplaceTab }, 'CR-002 config resolve failed — engine disabled for this order');
      return false;
    }
  }

  _emit(event, fulfillment, payload = {}) {
    eventBus.publish(event, {
      orderId: fulfillment.orderId,
      fulfillmentId: fulfillment._id,
      traceId: fulfillment.traceId,
      state: fulfillment.state,
      ...payload,
    });
  }

  /**
   * Builds the immutable snapshot of what must be fulfilled.
   *
   * Read exclusively from persisted order items — never from a request body.
   * The client can request an order; it cannot influence who fulfils it or at
   * what price.
   */
  async _buildRequiredItems(order) {
    const items = await this.orderItemRepository.listByOrderId(order._id);
    if (!items.length) return [];

    const productIds = [...new Set(items.map((it) => String(it.productId)))];
    const products = this.productRepository
      ? await this.productRepository.find({ _id: { $in: productIds } })
      : [];
    const catalogKeyById = new Map(products.map((p) => [String(p._id), p.catalogKey || null]));

    return items.map((it) => ({
      catalogKey: catalogKeyById.get(String(it.productId)) || null,
      productId: it.productId,
      originSellerId: it.sellerId,
      variantId: it.variantId || null,
      quantity: it.quantity,
      unitPrice: it.unitPrice,
    }));
  }

  /**
   * Entry point, called after the order is confirmed.
   * Idempotent: a duplicate call returns the existing fulfillment untouched.
   */
  async start(orderId) {
    const order = await this.orderRepository.findById(orderId);
    if (!order) {
      logger.warn({ orderId: String(orderId) }, 'CR-002 start called for a missing order');
      return null;
    }

    const traceId = randomUuid();
    const config = await this.configService.resolve(order.marketplaceTab);
    const requiredItems = await this._buildRequiredItems(order);

    if (!requiredItems.length) {
      logger.error({ traceId, orderId: String(orderId) }, 'CR-002 order has no items — cannot fulfil');
      return null;
    }

    const address = order.addressSnapshot || {};
    const { fulfillment, created } = await this.orderFulfillmentRepository.createIfAbsent({
      orderId: order._id,
      marketplaceTab: order.marketplaceTab,
      state: STATE.SEARCHING,
      requiredItems,
      customerLocation: {
        lat: toFiniteNumber(address.lat ?? address.latitude, null),
        lng: toFiniteNumber(address.lng ?? address.longitude, null),
        pincode: address.pincode || null,
      },
      searchDeadlineAt: new Date(Date.now() + (config.searchTimeoutSeconds * 1000)),
      traceId,
      configSnapshot: this.configService.buildSnapshot(config),
    });

    if (!created) {
      logger.info({ orderId: String(orderId), fulfillmentId: String(fulfillment._id) },
        'CR-002 fulfillment already exists — start is a no-op');
      return fulfillment;
    }

    logger.info({ traceId, orderId: String(orderId), items: requiredItems.length },
      'CR-002 fulfillment started');

    return this.attemptNext(fulfillment._id);
  }

  async _loadTabConfig(marketplaceTab) {
    if (!this.marketplaceConfigRepository) return null;
    try {
      return await this.marketplaceConfigRepository.findByTab(marketplaceTab);
    } catch {
      return null;
    }
  }

  /**
   * Finds, reserves, and offers to the next best candidate.
   *
   * Walks the ranked list because a candidate that passed the eligibility READ
   * can still lose the reservation WRITE to a concurrent order. Losing that
   * race is ordinary control flow, not an error.
   */
  async attemptNext(fulfillmentId) {
    const fulfillment = await this.orderFulfillmentRepository.findById(fulfillmentId);
    if (!fulfillment) return null;

    if (fulfillment.state !== STATE.SEARCHING) {
      return fulfillment;
    }

    const config = await this.configService.resolve(fulfillment.marketplaceTab);
    const traceId = fulfillment.traceId;

    if (fulfillment.searchDeadlineAt && fulfillment.searchDeadlineAt < new Date()) {
      logger.warn({ traceId, fulfillmentId: String(fulfillmentId) },
        'CR-002 search window elapsed — escalating');
      return this._escalateToWarehouse(fulfillment, config, FAIL.SEARCH_TIMEOUT);
    }

    if (fulfillment.attemptCount >= config.maxSellerAttempts) {
      return this._escalateToWarehouse(fulfillment, config, FAIL.ATTEMPTS_EXHAUSTED);
    }

    const tabConfig = await this._loadTabConfig(fulfillment.marketplaceTab);

    const { eligible, rejected } = await this.sellerEligibilityService.findEligibleSellers({
      requiredItems: fulfillment.requiredItems,
      customerLocation: fulfillment.customerLocation,
      marketplaceTab: fulfillment.marketplaceTab,
      config,
      excludedSellerIds: fulfillment.excludedSellerIds,
      tabConfig,
    });

    await this._recordRejections(fulfillment, rejected, ATTEMPT_KIND.SELLER);

    if (!eligible.length) {
      logger.info({ traceId, rejectedCount: rejected.length },
        'CR-002 no eligible seller — escalating to warehouse');
      return this._escalateToWarehouse(fulfillment, config, FAIL.NO_SELLER_AVAILABLE);
    }

    const ranked = await this.sellerRankingService.rank({
      candidates: eligible,
      customerLocation: fulfillment.customerLocation,
      config,
      traceId,
    });

    for (const candidate of ranked) {
      const offered = await this._tryCandidate({
        fulfillment, candidate, config, kind: ATTEMPT_KIND.SELLER,
      });
      if (offered) return offered;
    }

    logger.info({ traceId }, 'CR-002 every ranked candidate lost its reservation — escalating');
    return this._escalateToWarehouse(fulfillment, config, FAIL.NO_SELLER_AVAILABLE);
  }

  /** Persists why each candidate was skipped, for admin traceability. */
  async _recordRejections(fulfillment, rejected, kind) {
    for (const rejection of rejected) {
      try {
        const attemptNumber = await this.fulfillmentAttemptRepository.nextAttemptNumber(fulfillment._id);
        await this.fulfillmentAttemptRepository.create({
          fulfillmentId: fulfillment._id,
          orderId: fulfillment.orderId,
          sellerId: rejection.sellerId || null,
          attemptNumber,
          kind,
          status: ATTEMPT_STATUS.RESERVATION_FAILED,
          failureCode: rejection.failureCode,
        });
      } catch (error) {
        // Traceability is valuable but must never block fulfillment.
        logger.warn({ err: error, traceId: fulfillment.traceId },
          'CR-002 could not record a rejected candidate');
      }
    }
  }

  /**
   * Reserves the complete cart for one candidate and, on success, offers it.
   * Returns the updated fulfillment when an offer was made, otherwise null.
   */
  async _tryCandidate({ fulfillment, candidate, config, kind }) {
    const traceId = fulfillment.traceId;
    const attemptNumber = await this.fulfillmentAttemptRepository.nextAttemptNumber(fulfillment._id);

    const attempt = await this.fulfillmentAttemptRepository.create({
      fulfillmentId: fulfillment._id,
      orderId: fulfillment.orderId,
      sellerId: candidate.sellerId,
      attemptNumber,
      kind,
      status: ATTEMPT_STATUS.RESERVED,
      rankScore: candidate.rankScore ?? null,
      rankBreakdown: candidate.rankBreakdown ?? null,
      distanceKm: candidate.distanceKm ?? null,
      routeEtaMinutes: candidate.routeEtaMinutes ?? null,
      preparationMinutes: candidate.preparationMinutes ?? null,
    });

    const reservation = await this.reservationService.reserveCompleteCart({
      resolvedItems: candidate.resolvedItems,
      attempt,
      traceId,
    });

    if (!reservation.ok) {
      await this.fulfillmentAttemptRepository.transitionStatus(
        attempt._id, ATTEMPT_STATUS.RESERVED, ATTEMPT_STATUS.RESERVATION_FAILED,
        { failureCode: reservation.code, respondedAt: new Date() }
      );
      await this.orderFulfillmentRepository.addExcludedSeller(fulfillment._id, candidate.sellerId);
      return null;
    }

    const expiresAt = new Date(Date.now() + (config.sellerAcceptanceTimeoutSeconds * 1000));

    const etaMinutes = await this._computeEta({ candidate, config, fulfillment });

    await this.fulfillmentAttemptRepository.transitionStatus(
      attempt._id, ATTEMPT_STATUS.RESERVED, ATTEMPT_STATUS.OFFERED,
      { offeredAt: new Date(), expiresAt, estimatedDeliveryMinutes: etaMinutes }
    );

    const updated = await this.orderFulfillmentRepository.transitionState(
      fulfillment._id, STATE.SEARCHING, STATE.SELLER_ASSIGNED,
      {
        currentAttemptId: attempt._id,
        acceptanceDeadlineAt: expiresAt,
        resolvedSellerId: candidate.sellerId,
      }
    );

    if (!updated) {
      // Something else moved this fulfillment (cancel, sweeper). Give the
      // stock straight back rather than stranding it.
      logger.warn({ traceId, attemptId: String(attempt._id) },
        'CR-002 state moved during offer — releasing reservation');
      await this.reservationService.releaseAttempt({ ...attempt.toObject?.() || attempt, reservations: reservation.reserved }, null, traceId);
      return null;
    }

    await this.orderFulfillmentRepository.incrementAttemptCount(fulfillment._id);

    this._emit(FULFILLMENT_EVENTS.SELLER_ASSIGNED, updated, {
      sellerId: candidate.sellerId,
      attemptId: attempt._id,
      expiresAt,
      estimatedDeliveryMinutes: etaMinutes,
    });

    logger.info({
      traceId, sellerId: String(candidate.sellerId), attemptNumber,
      rankScore: candidate.rankScore, etaMinutes,
    }, 'CR-002 seller offered');

    return updated;
  }

  /**
   * ETA = route + preparation + buffer. No hardcoded delivery time.
   *
   * Ranking already measures route ETA for local sellers; the warehouse path
   * skips ranking, so the route is measured here instead.
   */
  async _computeEta({ candidate, config, fulfillment }) {
    if (!this.routingService) return null;

    let routeEtaMinutes = candidate.routeEtaMinutes ?? null;

    if (routeEtaMinutes == null) {
      const customer = fulfillment?.customerLocation || {};
      const route = await this.routingService.getRouteEta({
        origin: { lat: candidate.seller?.latitude, lng: candidate.seller?.longitude },
        destination: { lat: customer.lat, lng: customer.lng },
        routingEnabled: config.routingProviderEnabled,
        fallbackSpeedKmph: config.routingFallbackSpeedKmph,
        traceId: fulfillment?.traceId,
      });
      routeEtaMinutes = route.etaMinutes;
    }

    return this.routingService.composeDeliveryEta({
      routeEtaMinutes,
      // Warehouses do not go through ranking, so preparation time is resolved
      // here from the seller record with the platform default as fallback.
      preparationMinutes: toFiniteNumber(
        candidate.preparationMinutes ?? candidate.seller?.preparationTimeMinutes,
        toFiniteNumber(config.defaultPreparationTimeMinutes, 0)
      ),
      bufferMinutes: config.deliveryBufferMinutes,
    });
  }

  /** Seller accepted. Reservations are retained and the order proceeds. */
  async handleSellerAccept({ attemptId, sellerId }) {
    const attempt = await this.fulfillmentAttemptRepository.findById(attemptId);
    if (!attempt) return { ok: false, code: FAIL.SELLER_REJECTED };

    if (String(attempt.sellerId) !== String(sellerId)) {
      return { ok: false, code: 'FORBIDDEN' };
    }

    // Compare-and-set: a second accept, or an accept racing the timeout
    // sweeper, matches nothing and loses cleanly.
    const accepted = await this.fulfillmentAttemptRepository.transitionStatus(
      attempt._id, ATTEMPT_STATUS.OFFERED, ATTEMPT_STATUS.ACCEPTED,
      { respondedAt: new Date() }
    );

    if (!accepted) {
      const current = await this.fulfillmentAttemptRepository.findById(attemptId);
      // Already accepted by this same seller — idempotent success.
      if (current?.status === ATTEMPT_STATUS.ACCEPTED) {
        return { ok: true, idempotent: true, fulfillmentId: current.fulfillmentId };
      }
      return { ok: false, code: 'EXPIRED' };
    }

    const fulfillment = await this.orderFulfillmentRepository.transitionState(
      attempt.fulfillmentId, STATE.SELLER_ASSIGNED, STATE.SELLER_ACCEPTED,
      { acceptanceDeadlineAt: null, resolvedSellerId: attempt.sellerId }
    );

    if (!fulfillment) return { ok: false, code: 'EXPIRED' };

    await this._writeOrderSnapshot(fulfillment, {
      type: FULFILLMENT_TYPE.QUICK_LOCAL,
      source: 'seller',
      sellerId: attempt.sellerId,
      deliveryMode: DELIVERY_MODE.QUICK,
      // The ETA the seller was shown at offer time — not a recomputed one, so
      // the customer's promise cannot drift between offer and acceptance.
      estimatedDeliveryMinutes: attempt.estimatedDeliveryMinutes ?? null,
      fallbackLevel: fulfillment.attemptCount > 1 ? FALLBACK_LEVEL.ALTERNATE_SELLER : FALLBACK_LEVEL.PRIMARY_SELLER,
    });

    this._emit(FULFILLMENT_EVENTS.SELLER_ACCEPTED, fulfillment, {
      sellerId: attempt.sellerId,
      attemptId: attempt._id,
    });

    try {
      const order = await this.orderRepository.findById(fulfillment.orderId);
      if (order && (order.status === 'placed' || order.status === 'pending')) {
        await this.orderRepository.updateById(order._id, {
          status: 'confirmed',
          confirmedAt: new Date(),
        });
        eventBus.publish('order.status_changed', {
          orderId: order._id,
          orderNumber: order.orderNumber,
          previousStatus: order.status,
          currentStatus: 'confirmed',
          status: 'confirmed',
          changedBy: 'seller',
          changedById: attempt.sellerId,
        });
      }
    } catch (statusErr) {
      logger.warn({ statusErr, orderId: fulfillment.orderId }, 'Auto-confirm order on seller accept failed');
    }

    logger.info({ traceId: fulfillment.traceId, sellerId: String(attempt.sellerId) },
      'CR-002 seller accepted');

    return { ok: true, fulfillmentId: fulfillment._id };
  }

  /** Seller rejected. Release everything, exclude, try the next candidate. */
  async handleSellerReject({ attemptId, sellerId, reason = null }) {
    const attempt = await this.fulfillmentAttemptRepository.findById(attemptId);
    if (!attempt) return { ok: false, code: FAIL.SELLER_REJECTED };

    if (String(attempt.sellerId) !== String(sellerId)) {
      return { ok: false, code: 'FORBIDDEN' };
    }

    const rejected = await this.fulfillmentAttemptRepository.transitionStatus(
      attempt._id, ATTEMPT_STATUS.OFFERED, ATTEMPT_STATUS.REJECTED,
      { respondedAt: new Date(), failureCode: FAIL.SELLER_REJECTED, failureDetail: reason }
    );

    if (!rejected) return { ok: false, code: 'EXPIRED' };

    await this._releaseAndRetry(attempt, FAIL.SELLER_REJECTED, reason);
    return { ok: true };
  }

  /** Sweeper path: the seller never responded in time. */
  async handleAcceptanceTimeout(fulfillment) {
    if (!fulfillment.currentAttemptId) return null;

    const attempt = await this.fulfillmentAttemptRepository.findById(fulfillment.currentAttemptId);
    if (!attempt) return null;

    const timedOut = await this.fulfillmentAttemptRepository.transitionStatus(
      attempt._id, ATTEMPT_STATUS.OFFERED, ATTEMPT_STATUS.TIMED_OUT,
      { respondedAt: new Date(), failureCode: FAIL.SELLER_TIMEOUT }
    );

    // Lost the race to a seller who accepted just in time — correct outcome.
    if (!timedOut) return null;

    return this._releaseAndRetry(attempt, FAIL.SELLER_TIMEOUT, 'timeout');
  }

  async _releaseAndRetry(attempt, failureCode, reason) {
    const fulfillment = await this.orderFulfillmentRepository.findById(attempt.fulfillmentId);
    if (!fulfillment) return null;

    await this.reservationService.releaseAttempt(attempt, null, fulfillment.traceId);
    await this.orderFulfillmentRepository.addExcludedSeller(fulfillment._id, attempt.sellerId);

    const back = await this.orderFulfillmentRepository.transitionState(
      fulfillment._id, fulfillment.state, STATE.SEARCHING,
      { currentAttemptId: null, acceptanceDeadlineAt: null, resolvedSellerId: null }
    );

    this._emit(FULFILLMENT_EVENTS.SELLER_REJECTED, back || fulfillment, {
      sellerId: attempt.sellerId,
      attemptId: attempt._id,
      reason: reason || failureCode,
    });

    logger.info({ traceId: fulfillment.traceId, sellerId: String(attempt.sellerId), failureCode },
      'CR-002 attempt released — searching again');

    return back ? this.attemptNext(fulfillment._id) : null;
  }

  /** Fallback level 2 — warehouse. */
  async _escalateToWarehouse(fulfillment, config, reason) {
    const moved = await this.orderFulfillmentRepository.transitionState(
      fulfillment._id, fulfillment.state, STATE.WAREHOUSE_PENDING,
      { failureCode: reason, fallbackLevel: FALLBACK_LEVEL.WAREHOUSE }
    );
    if (!moved) return null;

    if (!config.warehouseFallbackEnabled) {
      return this._escalateToCourier(moved, config, FAIL.WAREHOUSE_DISABLED);
    }

    const tabConfig = await this._loadTabConfig(moved.marketplaceTab);

    const { eligible, rejected } = await this.sellerEligibilityService.findEligibleWarehouses({
      requiredItems: moved.requiredItems,
      marketplaceTab: moved.marketplaceTab,
      config,
      customerLocation: moved.customerLocation,
      excludedSellerIds: moved.excludedSellerIds,
      tabConfig,
    });

    await this._recordRejections(moved, rejected, ATTEMPT_KIND.WAREHOUSE);

    for (const candidate of eligible) {
      const accepted = await this._reserveWarehouse(moved, candidate, config);
      if (accepted) return accepted;
    }

    return this._escalateToCourier(moved, config, FAIL.WAREHOUSE_UNAVAILABLE);
  }

  /**
   * The warehouse is trusted to fulfil — there is no accept/reject step, so a
   * successful reservation resolves the fulfillment immediately.
   */
  async _reserveWarehouse(fulfillment, candidate, config) {
    const attemptNumber = await this.fulfillmentAttemptRepository.nextAttemptNumber(fulfillment._id);

    const attempt = await this.fulfillmentAttemptRepository.create({
      fulfillmentId: fulfillment._id,
      orderId: fulfillment.orderId,
      sellerId: candidate.sellerId,
      attemptNumber,
      kind: ATTEMPT_KIND.WAREHOUSE,
      status: ATTEMPT_STATUS.RESERVED,
      distanceKm: candidate.distanceKm ?? null,
    });

    const reservation = await this.reservationService.reserveCompleteCart({
      resolvedItems: candidate.resolvedItems,
      attempt,
      traceId: fulfillment.traceId,
    });

    if (!reservation.ok) {
      await this.fulfillmentAttemptRepository.transitionStatus(
        attempt._id, ATTEMPT_STATUS.RESERVED, ATTEMPT_STATUS.RESERVATION_FAILED,
        { failureCode: reservation.code }
      );
      return null;
    }

    await this.fulfillmentAttemptRepository.transitionStatus(
      attempt._id, ATTEMPT_STATUS.RESERVED, ATTEMPT_STATUS.ACCEPTED,
      { respondedAt: new Date() }
    );

    const moved = await this.orderFulfillmentRepository.transitionState(
      fulfillment._id, STATE.WAREHOUSE_PENDING, STATE.WAREHOUSE_ACCEPTED,
      { currentAttemptId: attempt._id, resolvedSellerId: candidate.sellerId, failureCode: null }
    );

    if (!moved) {
      await this.reservationService.releaseAttempt(
        { ...attempt.toObject?.() || attempt, reservations: reservation.reserved }, null, fulfillment.traceId
      );
      return null;
    }

    const etaMinutes = await this._computeEta({ candidate, config, fulfillment: moved });

    await this._writeOrderSnapshot(moved, {
      type: FULFILLMENT_TYPE.WAREHOUSE,
      source: 'warehouse',
      sellerId: candidate.sellerId,
      warehouseId: candidate.sellerId,
      deliveryMode: DELIVERY_MODE.QUICK,
      fallbackLevel: FALLBACK_LEVEL.WAREHOUSE,
      fallbackReason: fulfillment.failureCode || null,
      estimatedDeliveryMinutes: etaMinutes,
    });

    this._emit(FULFILLMENT_EVENTS.SELLER_ACCEPTED, moved, {
      sellerId: candidate.sellerId,
      attemptId: attempt._id,
      warehouse: true,
    });

    logger.info({ traceId: fulfillment.traceId, warehouseId: String(candidate.sellerId) },
      'CR-002 warehouse fulfilling order');

    return moved;
  }

  /**
   * Fallback level 3 — courier.
   *
   * Delegates to the EXISTING CourierShipmentService, which goes through the
   * shipping provider adapter. No direct Shiprocket coupling.
   */
  async _escalateToCourier(fulfillment, config, reason) {
    const moved = await this.orderFulfillmentRepository.transitionState(
      fulfillment._id, fulfillment.state, STATE.COURIER_PENDING,
      { failureCode: reason, fallbackLevel: FALLBACK_LEVEL.COURIER }
    );
    if (!moved) return null;

    // Local stock must go back before the courier path takes over, otherwise
    // it stays reserved against an order no seller is fulfilling.
    await this._releaseAllOutstanding(moved);

    if (!config.courierFallbackEnabled) {
      return this._fail(moved, FAIL.COURIER_DISABLED);
    }

    const order = await this.orderRepository.findById(moved.orderId);
    if (!order) return this._fail(moved, FAIL.COURIER_UNAVAILABLE);

    /*
     * CR-002 P15 — the QUICK -> STANDARD downgrade is committed HERE, on
     * entering the courier rung, and deliberately NOT after the provider call.
     *
     * Quick delivery is already impossible at this point: every seller and the
     * warehouse have been exhausted and their stock released. That fact does
     * not depend on whether a third-party shipping API answers. Writing the
     * downgrade only on the success path (the previous behaviour) meant a
     * provider outage left the order showing a quick-commerce promise it could
     * never keep — 79 real orders died that way, all still advertising "15 min"
     * to the customer while the fulfillment was already dead.
     *
     * Tracking fields stay null until a shipment genuinely exists, so a failure
     * below downgrades the promise WITHOUT ever claiming the order shipped.
     */
    await this._writeOrderSnapshot(moved, {
      type: FULFILLMENT_TYPE.COURIER,
      source: 'courier',
      deliveryMode: DELIVERY_MODE.STANDARD,
      estimatedDeliveryMinutes: null,
      fallbackLevel: FALLBACK_LEVEL.COURIER,
      fallbackReason: reason,
    }, { fulfilmentType: 'courier', deliveryPromiseMinutes: null, estimatedDeliveryAt: null });

    // Tell the customer the mode changed as soon as it changes, not once a
    // courier confirms. The UI must stop counting down immediately.
    this._emit(FULFILLMENT_EVENTS.COURIER_FALLBACK, moved, {
      fallbackLevel: FALLBACK_LEVEL.COURIER,
      fallbackReason: reason,
      courierProvider: null,
      shipmentPending: true,
    });

    const attemptNumber = await this.fulfillmentAttemptRepository.nextAttemptNumber(moved._id);
    const attempt = await this.fulfillmentAttemptRepository.create({
      fulfillmentId: moved._id,
      orderId: moved.orderId,
      attemptNumber,
      kind: ATTEMPT_KIND.COURIER,
      status: ATTEMPT_STATUS.RESERVED,
    });

    try {
      if (!this.courierShipmentService) throw new Error('Courier service not configured');

      const shipment = await this.courierShipmentService.createForOrder(order);

      await this.fulfillmentAttemptRepository.transitionStatus(
        attempt._id, ATTEMPT_STATUS.RESERVED, ATTEMPT_STATUS.ACCEPTED, { respondedAt: new Date() }
      );

      const assigned = await this.orderFulfillmentRepository.transitionState(
        moved._id, STATE.COURIER_PENDING, STATE.COURIER_ASSIGNED, { failureCode: null }
      );

      // Mode was already downgraded on entry; this adds the real shipment —
      // provider, AWB/tracking and standard ETA — now that one exists.
      await this._writeOrderSnapshot(assigned || moved, {
        type: FULFILLMENT_TYPE.COURIER,
        source: 'courier',
        courierProvider: shipment?.provider || null,
        deliveryMode: DELIVERY_MODE.STANDARD,
        estimatedDeliveryMinutes: null,
        fallbackLevel: FALLBACK_LEVEL.COURIER,
        fallbackReason: reason,
      }, { fulfilmentType: 'courier', shipment, deliveryPromiseMinutes: null, estimatedDeliveryAt: null });

      this._emit(FULFILLMENT_EVENTS.COURIER_FALLBACK, assigned || moved, {
        fallbackLevel: FALLBACK_LEVEL.COURIER,
        fallbackReason: reason,
        courierProvider: shipment?.provider || null,
        shipmentId: shipment?.shipmentId || null,
        trackingId: shipment?.awb || shipment?.trackingId || null,
      });

      logger.warn({ traceId: moved.traceId, orderId: String(moved.orderId), reason },
        'CR-002 courier fallback engaged');

      return assigned || moved;
    } catch (error) {
      // A configuration fault is an operator action, not a retryable outage.
      // Surfacing it distinctly is what turns "COURIER_UNAVAILABLE x79" into a
      // single actionable alert.
      const misconfigured = error?.code === 'COURIER_MISCONFIGURED'
        || /pickup location/i.test(error?.message || '');
      const failureCode = misconfigured ? FAIL.COURIER_MISCONFIGURED : FAIL.COURIER_UNAVAILABLE;

      logger.error({
        err: error, traceId: moved.traceId, orderId: String(moved.orderId), failureCode,
      }, 'CR-002 courier fallback failed — order remains STANDARD, shipment pending');

      await this.fulfillmentAttemptRepository.transitionStatus(
        attempt._id, ATTEMPT_STATUS.RESERVED, ATTEMPT_STATUS.RESERVATION_FAILED,
        { failureCode, failureDetail: error.message }
      );

      // NOTE: the order keeps the STANDARD downgrade written on entry. The
      // fulfillment is marked failed so an operator picks it up, but the
      // customer sees "standard delivery, tracking to follow" rather than a
      // quick-commerce promise that can never be met. The order is NOT
      // cancelled and is NOT reported as shipped.
      return this._fail(moved, failureCode);
    }
  }

  /** Releases any stock still held by earlier attempts on this fulfillment. */
  async _releaseAllOutstanding(fulfillment) {
    const attempts = await this.fulfillmentAttemptRepository.listByFulfillment(fulfillment._id);
    for (const attempt of attempts) {
      const outstanding = (attempt.reservations || []).some((entry) => !entry.releasedAt);
      if (outstanding) {
        await this.reservationService.releaseAttempt(attempt, null, fulfillment.traceId);
      }
    }
  }

  async _fail(fulfillment, failureCode) {
    const failed = await this.orderFulfillmentRepository.transitionState(
      fulfillment._id, fulfillment.state, STATE.FAILED, { failureCode }
    );

    const target = failed || fulfillment;
    await this._releaseAllOutstanding(target);

    this._emit(FULFILLMENT_EVENTS.FAILED, target, {
      failureCode,
      fallbackLevel: target.fallbackLevel,
      attemptCount: target.attemptCount,
      /*
       * Once the courier rung is entered the order is permanently STANDARD
       * (P15). Re-assert it here: the customer projection sends deliveryMode on
       * every event, so omitting it would null the field client-side and snap
       * the UI back to a quick-delivery promise on the very order that just
       * failed to find one.
       */
      deliveryMode: Number(target.fallbackLevel) >= FALLBACK_LEVEL.COURIER
        ? DELIVERY_MODE.STANDARD
        : null,
    });

    logger.error({ traceId: target.traceId, orderId: String(target.orderId), failureCode },
      'CR-002 fulfillment failed — needs admin intervention');

    return target;
  }

  /**
   * Writes the immutable snapshot onto the order.
   *
   * Also mirrors the legacy top-level fields so every existing reader — the
   * admin panel, delivery flow, courier sync, and the e2e tests — keeps
   * working unchanged.
   */
  async _writeOrderSnapshot(fulfillment, snapshot, legacyExtra = {}) {
    const order = await this.orderRepository.findById(fulfillment.orderId);
    if (!order) return null;

    const etaMinutes = snapshot.estimatedDeliveryMinutes !== undefined
      ? snapshot.estimatedDeliveryMinutes
      : order.deliveryPromiseMinutes;

    const estimatedDeliveryAt = etaMinutes
      ? new Date(Date.now() + (etaMinutes * 60 * 1000))
      : null;

    const update = {
      fulfillment: {
        type: snapshot.type ?? null,
        source: snapshot.source ?? null,
        sellerId: snapshot.sellerId ?? null,
        warehouseId: snapshot.warehouseId ?? null,
        courierProvider: snapshot.courierProvider ?? null,
        deliveryMode: snapshot.deliveryMode ?? null,
        estimatedDeliveryMinutes: etaMinutes ?? null,
        estimatedDeliveryAt,
        fallbackLevel: snapshot.fallbackLevel ?? 0,
        fallbackReason: snapshot.fallbackReason ?? null,
        decidedAt: new Date(),
        configSnapshot: fulfillment.configSnapshot || null,
      },
      ...legacyExtra,
    };

    // Keep the legacy quick-commerce fields consistent with the decision.
    if (snapshot.deliveryMode === DELIVERY_MODE.QUICK && legacyExtra.fulfilmentType === undefined) {
      update.fulfilmentType = 'local_delivery';
      update.deliveryPromiseMinutes = etaMinutes ?? order.deliveryPromiseMinutes;
      update.estimatedDeliveryAt = estimatedDeliveryAt;
    }

    return this.orderRepository.updateById(order._id, update);
  }

  /** Admin: force a stuck fulfillment onto the courier path. */
  async forceCourier(orderId) {
    const fulfillment = await this.orderFulfillmentRepository.findByOrderId(orderId);
    if (!fulfillment) return null;

    const config = await this.configService.resolve(fulfillment.marketplaceTab);
    return this._escalateToCourier(fulfillment, config, 'ADMIN_FORCED');
  }
}

module.exports = { FulfillmentEngineService };
