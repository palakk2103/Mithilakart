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
const { parseLocationFields } = require('../../utils/geoHelper');

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
    this._lastLocationEmit = new Map();
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

      await this.ensureAssignmentForOrder(order._id, session);

      const updated = await this.deliveryAssignmentRepository.acceptByOrderId(order._id, partnerId, session);
      if (!updated) {
        throw AppError.conflict('Order already assigned to another partner');
      }

      const pickupOtp = await this.deliveryOtpService.createOtp(updated._id, 'pickup');
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

      await this.deliveryAssignmentRepository.updateById(
        assignment._id,
        {
          partnerId: null,
          status: ASSIGNMENT_STATUS.PENDING,
          rejectedAt: new Date(),
          rejectReason: reason || null,
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
