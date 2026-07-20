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

class DeliveryOrderService extends BaseService {
  constructor({
    deliveryAssignmentRepository,
    deliveryPartnerRepository,
    deliveryEarningRepository,
    deliveryOtpService,
    orderRepository,
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
    this.orderTrackingRepository = orderTrackingRepository;
    this.orderStatusHistoryRepository = orderStatusHistoryRepository;
    this.userDeviceRepository = userDeviceRepository;
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

    const [available, assigned] = await Promise.all([
      this.deliveryAssignmentRepository.findAvailable(20),
      this.deliveryAssignmentRepository.findByPartner(partnerId, {
        status: { $in: [ASSIGNMENT_STATUS.ASSIGNED, ASSIGNMENT_STATUS.ACCEPTED, ASSIGNMENT_STATUS.PICKED_UP] },
      }, { sort: { createdAt: -1 } }),
    ]);

    return { available, assigned };
  }

  async acceptOrder(partnerId, orderId) {
    return withTransaction(async (session) => {
      const partner = await this.deliveryPartnerRepository.findById(partnerId);
      if (!partner?.isOnline) throw AppError.conflict('Go online to accept orders');

      let assignment = await this.deliveryAssignmentRepository.findByOrderId(orderId);
      if (!assignment) {
        assignment = await this.deliveryAssignmentRepository.create({
          orderId,
          status: ASSIGNMENT_STATUS.PENDING,
          earningAmount: DEFAULT_DELIVERY_EARNING_AMOUNT,
        }, session);
      }

      if (assignment.partnerId && String(assignment.partnerId) !== String(partnerId)) {
        throw AppError.conflict('Order already assigned to another partner');
      }

      if ([ASSIGNMENT_STATUS.DELIVERED, ASSIGNMENT_STATUS.CANCELLED].includes(assignment.status)) {
        throw AppError.conflict('Order is no longer available');
      }

      const order = await this.orderRepository.findById(orderId, { session });
      if (!order) throw AppError.notFound('Order not found');
      if (![ORDER_STATUS.CONFIRMED, ORDER_STATUS.PACKED, ORDER_STATUS.SHIPPED].includes(order.status)) {
        throw AppError.conflict('Order is not ready for delivery assignment');
      }

      const updated = await this.deliveryAssignmentRepository.updateById(
        assignment._id,
        {
          partnerId,
          status: ASSIGNMENT_STATUS.ACCEPTED,
          assignedAt: assignment.assignedAt || new Date(),
          acceptedAt: new Date(),
        },
        session
      );

      const pickupOtp = await this.deliveryOtpService.createOtp(assignment._id, 'pickup');
      return { assignment: updated, pickupOtp };
    });
  }

  async confirmPickup(partnerId, orderId, otp) {
    return withTransaction(async (session) => {
      const assignment = await this._getPartnerAssignment(partnerId, orderId);
      if (assignment.status !== ASSIGNMENT_STATUS.ACCEPTED) {
        throw AppError.conflict('Pickup not allowed in current status');
      }

      await this.deliveryOtpService.verifyOtp(assignment._id, 'pickup', otp);

      await this.deliveryAssignmentRepository.updateById(
        assignment._id,
        { status: ASSIGNMENT_STATUS.PICKED_UP, pickedUpAt: new Date() },
        session
      );

      const order = await this.orderRepository.findById(orderId, { session });
      if (order && order.status === ORDER_STATUS.CONFIRMED) {
        await this.orderRepository.updateStatus(orderId, ORDER_STATUS.SHIPPED, session);
        await this.orderTrackingRepository.createInitial(orderId, ORDER_STATUS.SHIPPED, 'Picked up for delivery', { partnerId }, session);
        this._emitStatusChange(order, ORDER_STATUS.SHIPPED);
      }

      const deliveryOtp = await this.deliveryOtpService.createOtp(assignment._id, 'delivery');
      return { status: ASSIGNMENT_STATUS.PICKED_UP, deliveryOtp };
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

      await this.orderRepository.updateById(
        orderId,
        { status: ORDER_STATUS.DELIVERED, deliveredAt: new Date() },
        session
      );
      await this.orderTrackingRepository.createInitial(orderId, ORDER_STATUS.DELIVERED, 'Delivered', { partnerId }, session);
      await this.orderStatusHistoryRepository.addTransition({
        orderId,
        fromStatus: ORDER_STATUS.OUT_FOR_DELIVERY,
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

      const order = await this.orderRepository.findById(orderId, { session });
      if (order) this._emitStatusChange(order, ORDER_STATUS.DELIVERED);

      return { status: ASSIGNMENT_STATUS.DELIVERED, earning };
    });
  }

  async _getPartnerAssignment(partnerId, orderId) {
    const assignment = await this.deliveryAssignmentRepository.findByOrderId(orderId);
    if (!assignment || String(assignment.partnerId) !== String(partnerId)) {
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
  async updateProfile(partnerId, data) {
    const allowed = {};
    if (data.name) allowed.name = data.name;
    if (data.vehicleType) allowed.vehicleType = data.vehicleType;
    return this.deliveryPartnerRepository.updateById(partnerId, allowed);
  }

  async updateLocation(partnerId, { latitude, longitude }) {
    return this.deliveryPartnerRepository.updateById(partnerId, {
      latitude,
      longitude,
      lastLocationAt: new Date(),
    });
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
