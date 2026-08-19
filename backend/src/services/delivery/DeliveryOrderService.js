const { BaseService } = require('../../core/BaseService');
const { AppError } = require('../../utils/AppError');
const { withTransaction } = require('../../database');
const { ORDER_STATUS } = require('../../constants/commerce');
const {
  ASSIGNMENT_STATUS,
  DEFAULT_DELIVERY_EARNING_AMOUNT,
  DELIVERY_EARNING_STATUS,
} = require('../../constants/delivery');
const { eventBus } = require('../../events/EventBus');
const { DELIVERY_EVENTS } = require('../../events/eventTypes');
const { parseLocationFields } = require('../../utils/geoHelper');
const { DELIVERY_ASSIGNMENT_MODE } = require('../../constants/fulfillment');
const { toFiniteNumber } = require('../../utils/numeric');
const { logger } = require('../../utils/logger');

class DeliveryOrderService extends BaseService {
  constructor({
    deliveryAssignmentRepository,
    deliveryPartnerRepository,
    deliveryEarningRepository,
    deliveryOtpService,
    orderRepository,
    orderItemRepository = null,
    sellerRepository = null,
    orderTrackingRepository,
    orderStatusHistoryRepository,
    userDeviceRepository = null,
    // CR-002 — optional. Absent, the service behaves exactly as before.
    deliveryPartnerRankingService = null,
    fulfillmentConfigService = null,
  }) {
    super();
    this.deliveryAssignmentRepository = deliveryAssignmentRepository;
    this.deliveryPartnerRepository = deliveryPartnerRepository;
    this.deliveryEarningRepository = deliveryEarningRepository;
    this.deliveryOtpService = deliveryOtpService;
    this.orderRepository = orderRepository;
    this.orderItemRepository = orderItemRepository;
    this.sellerRepository = sellerRepository;
    this.orderTrackingRepository = orderTrackingRepository;
    this.orderStatusHistoryRepository = orderStatusHistoryRepository;
    this.userDeviceRepository = userDeviceRepository;
    this.deliveryPartnerRankingService = deliveryPartnerRankingService;
    this.fulfillmentConfigService = fulfillmentConfigService;
    this._lastLocationEmit = new Map();
  }

  setDeliveryPartnerRankingService(service) {
    this.deliveryPartnerRankingService = service;
  }

  setFulfillmentConfigService(service) {
    this.fulfillmentConfigService = service;
  }

  /**
   * CR-002 — resolves the assignment strategy.
   *
   * Defaults to 'broadcast' on every failure path, so a config outage or a
   * missing service can only ever fall back to the pre-CR-002 behaviour.
   */
  async _resolveAssignmentConfig(marketplaceTab = null) {
    if (!this.fulfillmentConfigService) {
      return { deliveryAssignmentMode: DELIVERY_ASSIGNMENT_MODE.BROADCAST };
    }

    try {
      return await this.fulfillmentConfigService.resolve(marketplaceTab);
    } catch (error) {
      logger.warn({ err: error }, 'CR-002 delivery config unavailable — using broadcast');
      return { deliveryAssignmentMode: DELIVERY_ASSIGNMENT_MODE.BROADCAST };
    }
  }

  _mapOrderForDelivery(order, assignment = null) {
    const addr = order?.addressSnapshot || {};
    return {
      id: String(order?._id || assignment?.orderId),
      orderId: order?._id || assignment?.orderId,
      orderNumber: order?.orderNumber,
      status: order?.status,
      customerName: addr.name || 'Customer',
      customerPhone: addr.phone || '',
      address: [addr.line1 || addr.addressLine, addr.city, addr.state, addr.pincode].filter(Boolean).join(', '),
      shippingAddress: addr,
      addressSnapshot: addr,
      lat: addr.lat ?? addr.latitude ?? null,
      lng: addr.lng ?? addr.longitude ?? null,
      earningAmount: assignment?.earningAmount ?? DEFAULT_DELIVERY_EARNING_AMOUNT,
      assignment,
    };
  }

  async getDashboard(partnerId) {
    const partner = await this.deliveryPartnerRepository.findById(partnerId);
    if (!partner) throw AppError.notFound('Partner not found');

    const [activeCount, completedCount, totalEarnings] = await Promise.all([
      this.deliveryAssignmentRepository.countByPartner(partnerId, {
        status: { $in: [ASSIGNMENT_STATUS.ACCEPTED, ASSIGNMENT_STATUS.PICKED_UP] },
      }),
      this.deliveryAssignmentRepository.countByPartner(partnerId, { status: ASSIGNMENT_STATUS.DELIVERED }),
      this.deliveryEarningRepository.sumByPartner(partnerId, { status: DELIVERY_EARNING_STATUS.CREDITED }),
    ]);

    return {
      isOnline: partner.isOnline,
      activeDeliveries: activeCount,
      completedDeliveries: completedCount,
      totalEarnings,
      balance: partner.balance || 0,
    };
  }

  async toggleStatus(partnerId, isOnline) {
    const partner = await this.deliveryPartnerRepository.findById(partnerId);
    if (!partner) throw AppError.notFound('Partner not found');
    return this.deliveryPartnerRepository.updateById(partnerId, { isOnline: Boolean(isOnline) });
  }

  async listOrders(partnerId) {
    const partner = await this.deliveryPartnerRepository.findById(partnerId);
    if (!partner?.isOnline) {
      return { available: [], assigned: [] };
    }

    const [availableRaw, assignedRaw] = await Promise.all([
      this.deliveryAssignmentRepository.findAvailable(20),
      this.deliveryAssignmentRepository.findByPartner(partnerId, {
        status: { $in: [ASSIGNMENT_STATUS.ASSIGNED, ASSIGNMENT_STATUS.ACCEPTED, ASSIGNMENT_STATUS.PICKED_UP] },
      }, { sort: { createdAt: -1 } }),
    ]);

    const orderIds = [...new Set([
      ...availableRaw.map((a) => String(a.orderId)),
      ...assignedRaw.map((a) => String(a.orderId)),
    ])];

    const orders = orderIds.length
      ? await this.orderRepository.find({ _id: { $in: orderIds } })
      : [];
    const orderMap = new Map(orders.map((o) => [String(o._id), o]));

    const available = availableRaw.map((assignment) => ({
      ...assignment.toObject?.() || assignment,
      order: this._mapOrderForDelivery(orderMap.get(String(assignment.orderId)), assignment),
      orderId: orderMap.get(String(assignment.orderId)) || assignment.orderId,
    }));

    const assigned = assignedRaw.map((assignment) => ({
      ...assignment.toObject?.() || assignment,
      order: this._mapOrderForDelivery(orderMap.get(String(assignment.orderId)), assignment),
      orderId: orderMap.get(String(assignment.orderId)) || assignment.orderId,
    }));

    return { available, assigned };
  }

  async getOrderDetail(partnerId, orderId) {
    const order = await this.orderRepository.findById(orderId);
    if (!order) throw AppError.notFound('Order not found');

    let assignment = await this.deliveryAssignmentRepository.findByOrderId(order._id);
    if (!assignment) {
      assignment = await this.ensureAssignmentForOrder(order._id);
    }

    if (assignment?.partnerId && String(assignment.partnerId) !== String(partnerId)) {
      throw AppError.forbidden('Assignment not found for this partner');
    }

    return {
      order: this._mapOrderForDelivery(order, assignment),
      assignment,
    };
  }

  async acceptOrder(partnerId, orderId) {
    return withTransaction(async (session) => {
      const partner = await this.deliveryPartnerRepository.findById(partnerId);
      if (!partner?.isOnline) throw AppError.deliveryNotAvailable('Go online to accept orders');

      const order = await this.orderRepository.findById(orderId, { session });
      if (!order) throw AppError.notFound('Order not found');
      if (![ORDER_STATUS.CONFIRMED, ORDER_STATUS.PACKED, ORDER_STATUS.SHIPPED, ORDER_STATUS.OUT_FOR_DELIVERY].includes(order.status)) {
        throw AppError.conflict('Order is not ready for delivery assignment');
      }

      const existing = await this.ensureAssignmentForOrder(order._id, session);

      // Idempotent: the same partner re-accepting gets the same assignment
      // back rather than a 409, so a retried request is harmless.
      if (existing?.partnerId && String(existing.partnerId) === String(partnerId)) {
        const otp = await this.deliveryOtpService.createOtp(existing._id, 'pickup');
        return { assignment: existing, pickupOtp: otp, idempotent: true };
      }

      const config = await this._resolveAssignmentConfig(order.marketplaceTab);
      const ranked = config.deliveryAssignmentMode === DELIVERY_ASSIGNMENT_MODE.RANKED
        && this.deliveryPartnerRankingService;

      // In ranked mode only the partner holding a live offer may accept; in
      // broadcast mode the original first-come-first-served guard applies.
      const updated = ranked
        ? await this.deliveryAssignmentRepository.acceptOfferByPartner(order._id, partnerId, new Date(), session)
        : await this.deliveryAssignmentRepository.acceptByOrderId(order._id, partnerId, session);

      if (!updated) {
        throw AppError.conflict(
          ranked
            ? 'This offer is no longer available'
            : 'Order already assigned to another partner'
        );
      }

      const pickupOtp = await this.deliveryOtpService.createOtp(updated._id, 'pickup');

      eventBus.publish(DELIVERY_EVENTS.ASSIGNMENT_ACCEPTED, {
        orderId: order._id,
        orderNumber: order.orderNumber,
        userId: order.userId,
        partnerId,
        assignmentId: updated._id,
      });

      return { assignment: updated, pickupOtp };
    });
  }

  async confirmPickup(partnerId, orderId, otp) {
    return withTransaction(async (session) => {
      const assignment = await this._getPartnerAssignment(partnerId, orderId);
      if (assignment.status !== ASSIGNMENT_STATUS.ACCEPTED) {
        throw AppError.conflict('Pickup not allowed in current status');
      }

      try {
        await this.deliveryOtpService.verifyOtp(assignment._id, 'pickup', otp);
      } catch {
        // Vendor pickup proceeds cleanly even if pickup OTP is missing/expired
      }

      await this.deliveryAssignmentRepository.updateById(
        assignment._id,
        { status: ASSIGNMENT_STATUS.PICKED_UP, pickedUpAt: new Date() },
        session
      );

      const order = await this.orderRepository.findById(orderId, { session });
      if (order && [ORDER_STATUS.CONFIRMED, ORDER_STATUS.PACKED].includes(order.status)) {
        await this.orderRepository.updateStatus(orderId, ORDER_STATUS.SHIPPED, session);
        await this.orderTrackingRepository.createInitial(orderId, ORDER_STATUS.SHIPPED, 'Picked up for delivery', { partnerId }, session);
        this._emitStatusChange(order, ORDER_STATUS.SHIPPED);
      }

      const deliveryOtp = await this.deliveryOtpService.createOtp(assignment._id, 'delivery');

      if (order?.userId) {
        eventBus.publish('delivery.otp_created', {
          userId: order.userId,
          orderId: order._id,
          orderNumber: order.orderNumber,
          otp: deliveryOtp,
          phone: order.addressSnapshot?.phone || null,
        });
      }

      return { status: ASSIGNMENT_STATUS.PICKED_UP, deliveryOtp };
    });
  }

  async markOutForDelivery(partnerId, orderId) {
    return withTransaction(async (session) => {
      const assignment = await this._getPartnerAssignment(partnerId, orderId);
      if (assignment.status !== ASSIGNMENT_STATUS.PICKED_UP) {
        throw AppError.conflict('Out for delivery not allowed in current status');
      }

      const order = await this.orderRepository.findById(orderId, { session });
      if (!order) throw AppError.notFound('Order not found');
      if (order.status === ORDER_STATUS.SHIPPED) {
        await this.orderRepository.updateStatus(orderId, ORDER_STATUS.OUT_FOR_DELIVERY, session);
        await this.orderTrackingRepository.createInitial(orderId, ORDER_STATUS.OUT_FOR_DELIVERY, 'Out for delivery', { partnerId }, session);
        this._emitStatusChange(order, ORDER_STATUS.OUT_FOR_DELIVERY);
      }

      return { status: ORDER_STATUS.OUT_FOR_DELIVERY };
    });
  }

  async confirmDelivery(partnerId, orderId, otp) {
    return withTransaction(async (session) => {
      const assignment = await this._getPartnerAssignment(partnerId, orderId);
      if (assignment.status !== ASSIGNMENT_STATUS.PICKED_UP) {
        throw AppError.conflict('Delivery not allowed in current status');
      }

      await this.deliveryOtpService.verifyOtp(assignment._id, 'delivery', otp);

      await this.deliveryAssignmentRepository.updateById(
        assignment._id,
        { status: ASSIGNMENT_STATUS.DELIVERED, deliveredAt: new Date() },
        session
      );

      const order = await this.orderRepository.findById(orderId, { session });
      const fromStatus = order?.status || ORDER_STATUS.OUT_FOR_DELIVERY;

      if (order && order.status !== ORDER_STATUS.OUT_FOR_DELIVERY) {
        await this.orderRepository.updateStatus(orderId, ORDER_STATUS.OUT_FOR_DELIVERY, session);
        await this.orderTrackingRepository.createInitial(orderId, ORDER_STATUS.OUT_FOR_DELIVERY, 'Out for delivery', { partnerId }, session);
        this._emitStatusChange(order, ORDER_STATUS.OUT_FOR_DELIVERY);
      }

      await this.orderRepository.updateById(
        orderId,
        { status: ORDER_STATUS.DELIVERED, deliveredAt: new Date() },
        session
      );
      await this.orderTrackingRepository.createInitial(orderId, ORDER_STATUS.DELIVERED, 'Delivered', { partnerId }, session);
      await this.orderStatusHistoryRepository.addTransition({
        orderId,
        fromStatus,
        toStatus: ORDER_STATUS.DELIVERED,
        changedBy: 'delivery',
        changedById: partnerId,
        note: 'Delivery confirmed via OTP',
      }, session);

      const earning = await this.deliveryEarningRepository.create({
        partnerId,
        assignmentId: assignment._id,
        orderId,
        amount: assignment.earningAmount || DEFAULT_DELIVERY_EARNING_AMOUNT,
        status: DELIVERY_EARNING_STATUS.CREDITED,
        creditedAt: new Date(),
      }, session);

      await this.deliveryPartnerRepository.model.findByIdAndUpdate(
        partnerId,
        { $inc: { balance: earning.amount } },
        { session }
      );

      const updatedOrder = await this.orderRepository.findById(orderId, { session });
      if (updatedOrder) this._emitStatusChange(updatedOrder, ORDER_STATUS.DELIVERED);

      return { status: ASSIGNMENT_STATUS.DELIVERED, earning };
    });
  }

  async _getPartnerAssignment(partnerId, orderId) {
    const order = await this.orderRepository.findById(orderId);
    const realOrderId = order ? order._id : orderId;
    const assignment = await this.deliveryAssignmentRepository.findByOrderId(realOrderId);
    if (!assignment || (assignment.partnerId && String(assignment.partnerId) !== String(partnerId))) {
      throw AppError.forbidden('Assignment not found for this partner');
    }
    return assignment;
  }

  _emitStatusChange(order, toStatus) {
    eventBus.publish('order.status_changed', {
      orderId: order._id,
      userId: order.userId,
      orderNumber: order.orderNumber,
      status: toStatus,
    });
  }

  async ensureAssignmentForOrder(orderId, session = null) {
    const existing = await this.deliveryAssignmentRepository.findByOrderId(orderId);
    if (existing) return existing;

    return this.deliveryAssignmentRepository.create({
      orderId,
      status: ASSIGNMENT_STATUS.PENDING,
      earningAmount: DEFAULT_DELIVERY_EARNING_AMOUNT,
    }, session);
  }

  async notifyNearbyPartnersForOrder(orderId, session = null) {
    const order = await this.orderRepository.findById(orderId, { session });
    if (!order) return null;

    await this.ensureAssignmentForOrder(orderId, session);

    // CR-002 — ranked mode offers to one partner at a time. Broadcast (the
    // shipped default) falls through to the original behaviour below.
    const config = await this._resolveAssignmentConfig(order.marketplaceTab);
    if (config.deliveryAssignmentMode === DELIVERY_ASSIGNMENT_MODE.RANKED
      && this.deliveryPartnerRankingService) {
      const result = await this.offerToNextRankedPartner(orderId, { config, session });
      if (result) return result;
      // No eligible partner: fall through to broadcast so the order is not
      // stranded just because ranking found nobody.
      logger.info({ orderId: String(orderId) },
        'CR-002 ranked assignment found no partner — falling back to broadcast');
    }

    let lat = null;
    let lng = null;

    if (this.orderItemRepository && this.sellerRepository) {
      const items = await this.orderItemRepository.listByOrderId(order._id);
      const sellerIds = [...new Set(items.map((it) => it.sellerId).filter(Boolean))];
      for (const sellerId of sellerIds) {
        const seller = await this.sellerRepository.findById(sellerId);
        if (seller?.latitude != null && seller?.longitude != null) {
          lat = seller.latitude;
          lng = seller.longitude;
          break;
        }
      }
    }

    if (lat == null || lng == null) {
      const addr = order.addressSnapshot || {};
      lat = addr.lat ?? addr.latitude;
      lng = addr.lng ?? addr.longitude;
    }

    const nearby = lat != null && lng != null
      ? await this.deliveryPartnerRepository.findNearbyOnline({
          latitude: lat,
          longitude: lng,
          maxDistanceMeters: 10000,
          limit: 20,
        })
      : [];

    const partnerIds = nearby.map((p) => String(p._id));
    const sellerIds = [...new Set((order.sellerSubOrders || []).map((s) => String(s.sellerId)))];

    eventBus.publish('delivery.order_available', {
      orderId: order._id,
      orderNumber: order.orderNumber,
      partnerIds,
      sellerIds,
      fulfilmentType: 'local_delivery',
    });

    return { partnerIds, count: partnerIds.length };
  }

  /** Pickup point for an order: the fulfilling seller, else the customer address. */
  async _resolvePickupLocation(order) {
    const sellerId = order.fulfillment?.sellerId
      || (order.sellerSubOrders || [])[0]?.sellerId;

    if (sellerId && this.sellerRepository) {
      const seller = await this.sellerRepository.findById(sellerId);
      if (seller?.latitude != null && seller?.longitude != null) {
        return { lat: seller.latitude, lng: seller.longitude, sellerId };
      }
    }

    if (this.orderItemRepository && this.sellerRepository) {
      const items = await this.orderItemRepository.listByOrderId(order._id);
      for (const id of [...new Set(items.map((it) => it.sellerId).filter(Boolean))]) {
        const seller = await this.sellerRepository.findById(id);
        if (seller?.latitude != null && seller?.longitude != null) {
          return { lat: seller.latitude, lng: seller.longitude, sellerId: id };
        }
      }
    }

    const addr = order.addressSnapshot || {};
    const lat = addr.lat ?? addr.latitude;
    const lng = addr.lng ?? addr.longitude;
    return (lat != null && lng != null) ? { lat, lng, sellerId: null } : null;
  }

  /**
   * CR-002 — offers the assignment to the single best-ranked eligible partner.
   *
   * Returns null when no candidate is available, which lets the caller decide
   * whether to fall back to broadcast rather than stranding the order.
   */
  async offerToNextRankedPartner(orderId, { config = null, session = null } = {}) {
    const order = await this.orderRepository.findById(orderId, { session });
    if (!order) return null;

    const assignment = await this.ensureAssignmentForOrder(orderId, session);

    // Someone already owns it — never offer a second time.
    if (assignment.partnerId) return null;

    const resolved = config || await this._resolveAssignmentConfig(order.marketplaceTab);
    const pickup = await this._resolvePickupLocation(order);
    if (!pickup) return null;

    const radiusKm = toFiniteNumber(resolved.sellerSearchRadiusKm, 10);
    const candidates = await this.deliveryPartnerRepository.findNearbyOnline({
      latitude: pickup.lat,
      longitude: pickup.lng,
      maxDistanceMeters: radiusKm * 1000,
      limit: 20,
    });

    if (!candidates.length) return null;

    const { ranked } = await this.deliveryPartnerRankingService.rank({
      partners: candidates,
      pickupLocation: pickup,
      customerLocation: {
        lat: order.addressSnapshot?.lat ?? order.addressSnapshot?.latitude,
        lng: order.addressSnapshot?.lng ?? order.addressSnapshot?.longitude,
      },
      config: resolved,
      rejectedBy: assignment.rejectedBy || [],
    });

    if (!ranked.length) return null;

    const best = ranked[0];
    const timeoutSeconds = toFiniteNumber(resolved.deliveryPartnerAssignmentTimeoutSeconds, 60);
    const expiresAt = new Date(Date.now() + (timeoutSeconds * 1000));

    const offered = await this.deliveryAssignmentRepository.offerToPartner(
      order._id, best.partnerId, expiresAt, session
    );

    // Lost the race — another path claimed the assignment between the read
    // and this write. Correct outcome, not an error.
    if (!offered) return null;

    eventBus.publish(DELIVERY_EVENTS.ORDER_AVAILABLE, {
      orderId: order._id,
      orderNumber: order.orderNumber,
      partnerIds: [String(best.partnerId)],
      sellerIds: pickup.sellerId ? [String(pickup.sellerId)] : [],
      fulfilmentType: 'local_delivery',
      offerExpiresAt: expiresAt,
      ranked: true,
    });

    logger.info({
      orderId: String(order._id),
      partnerId: String(best.partnerId),
      rankScore: best.rankScore,
      offerRound: offered.offerRound,
    }, 'CR-002 ranked delivery offer made');

    return { partnerIds: [String(best.partnerId)], count: 1, ranked: true, expiresAt };
  }

  /**
   * Partner declined a ranked offer. Withdraw it, record the refusal so they
   * are not re-offered, and move to the next candidate.
   */
  async rejectRankedOffer(partnerId, orderId, reason = null) {
    const withdrawn = await this.deliveryAssignmentRepository.withdrawOffer(
      orderId, partnerId, { reason }
    );

    if (!withdrawn) {
      throw AppError.conflict('This offer is no longer available');
    }

    await this.offerToNextRankedPartner(orderId);
    return { rejected: true, orderId: String(orderId) };
  }

  /** Sweeper path: the partner never responded within the offer window. */
  async handleOfferTimeout(assignment) {
    const expired = await this.deliveryAssignmentRepository.expireOffer(
      assignment._id, assignment.offerExpiresAt
    );

    // Lost the race to a partner who accepted just in time — correct outcome.
    if (!expired) return null;

    // The unresponsive partner is excluded so the next round does not loop
    // back to them.
    const lastOffered = (assignment.offeredTo || []).slice(-1)[0];
    if (lastOffered) {
      await this.deliveryAssignmentRepository.updateById(
        assignment._id, { $addToSet: { rejectedBy: lastOffered } }
      );
    }

    logger.info({ assignmentId: String(assignment._id), orderId: String(assignment.orderId) },
      'CR-002 delivery offer timed out — reassigning');

    return this.offerToNextRankedPartner(assignment.orderId);
  }

  async getTrackingMeta(orderId) {
    const assignment = await this.deliveryAssignmentRepository.findByOrderId(orderId);
    if (!assignment?.partnerId) {
      return { assignment: null, partnerLocation: null };
    }

    const partner = await this.deliveryPartnerRepository.findById(assignment.partnerId);
    return {
      assignment: {
        id: String(assignment._id),
        status: assignment.status,
        partnerId: String(assignment.partnerId),
        partnerName: partner?.name || 'Delivery Partner',
        partnerPhone: partner?.phone || '',
      },
      partnerLocation: partner?.latitude != null && partner?.longitude != null
        ? {
            lat: partner.latitude,
            lng: partner.longitude,
            updatedAt: partner.lastLocationAt || partner.updatedAt,
          }
        : null,
    };
  }

  async rejectOrder(partnerId, orderId, reason = null) {
    return withTransaction(async (session) => {
      const assignment = await this.deliveryAssignmentRepository.findByOrderId(orderId);
      if (!assignment) throw AppError.notFound('Assignment not found');

      if (assignment.partnerId && String(assignment.partnerId) !== String(partnerId)) {
        throw AppError.forbidden('Assignment not found for this partner');
      }

      if ([ASSIGNMENT_STATUS.DELIVERED, ASSIGNMENT_STATUS.CANCELLED].includes(assignment.status)) {
        throw AppError.conflict('Order is no longer available');
      }

      // CR-002 — a live ranked offer is withdrawn through the guarded path so
      // the refusal is recorded and the partner is not re-offered.
      const order = await this.orderRepository.findById(orderId, { session });
      const config = await this._resolveAssignmentConfig(order?.marketplaceTab);
      const ranked = config.deliveryAssignmentMode === DELIVERY_ASSIGNMENT_MODE.RANKED
        && this.deliveryPartnerRankingService;

      if (ranked && !assignment.partnerId && assignment.status === ASSIGNMENT_STATUS.ASSIGNED) {
        return this.rejectRankedOffer(partnerId, orderId, reason);
      }

      await this.deliveryAssignmentRepository.updateById(
        assignment._id,
        {
          partnerId: null,
          status: ASSIGNMENT_STATUS.PENDING,
          rejectedAt: new Date(),
          rejectReason: reason || null,
          $addToSet: { rejectedBy: partnerId },
        },
        session
      );

      await this.notifyNearbyPartnersForOrder(orderId, session);
      return { rejected: true, orderId };
    });
  }

  async markDeliveryFailed(partnerId, orderId, reason = null) {
    return withTransaction(async (session) => {
      const assignment = await this._getPartnerAssignment(partnerId, orderId);

      await this.deliveryAssignmentRepository.updateById(
        assignment._id,
        {
          status: ASSIGNMENT_STATUS.FAILED,
          failedAt: new Date(),
          failReason: reason || null,
          partnerId: null,
        },
        session
      );

      const order = await this.orderRepository.findById(orderId, { session });
      if (order) {
        this._emitStatusChange(order, ORDER_STATUS.CONFIRMED);
      }

      await this.notifyNearbyPartnersForOrder(orderId, session);
      return { failed: true, orderId };
    });
  }

  async getProfile(partnerId) {
    const partner = await this.deliveryPartnerRepository.findById(partnerId);
    if (!partner) throw AppError.notFound('Partner not found');
    return {
      id: partner._id,
      name: partner.name,
      phone: partner.phone,
      countryCode: partner.countryCode,
      vehicleType: partner.vehicleType,
      status: partner.status,
      isOnline: partner.isOnline,
      latitude: partner.latitude,
      longitude: partner.longitude,
    };
  }

  async updateProfile(partnerId, data) {
    const allowed = {};
    if (data.name) allowed.name = data.name;
    if (data.vehicleType) allowed.vehicleType = data.vehicleType;
    return this.deliveryPartnerRepository.updateById(partnerId, allowed);
  }

  async updateLocation(partnerId, { latitude, longitude }) {
    const geo = parseLocationFields({ latitude, longitude });
    const partner = await this.deliveryPartnerRepository.updateById(partnerId, {
      latitude: geo.latitude,
      longitude: geo.longitude,
      location: geo.location,
      lastLocationAt: new Date(),
    });

    const activeAssignments = await this.deliveryAssignmentRepository.findByPartner(partnerId, {
      status: { $in: [ASSIGNMENT_STATUS.ACCEPTED, ASSIGNMENT_STATUS.PICKED_UP] },
    });

    const now = Date.now();
    const lastEmit = this._lastLocationEmit.get(String(partnerId)) || 0;
    if (now - lastEmit < 3000) return partner;
    this._lastLocationEmit.set(String(partnerId), now);

    for (const assignment of activeAssignments) {
      eventBus.publish('delivery.location_updated', {
        orderId: assignment.orderId,
        partnerId,
        latitude: geo.latitude,
        longitude: geo.longitude,
        updatedAt: new Date().toISOString(),
      });
    }

    return partner;
  }

  async registerDeviceToken(partnerId, deviceId, fcmToken, platform = 'web') {
    if (!this.userDeviceRepository) {
      throw AppError.internal('Device repository not configured');
    }

    return this.userDeviceRepository.upsertDevice({
      userId: partnerId,
      portal: 'delivery',
      deviceId,
      fcmToken,
      platform,
    });
  }
}

module.exports = { DeliveryOrderService };
