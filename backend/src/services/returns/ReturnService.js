const { BaseService } = require('../../core/BaseService');
const { AppError } = require('../../utils/AppError');
const { withTransaction } = require('../../database');
const { ORDER_STATUS } = require('../../constants/commerce');
const { RETURN_STATUS } = require('../../constants/pricing');

/** Matches the published Return Policy (section 2.1). */
const RETURN_WINDOW_DAYS = 10;
const DAY_MS = 24 * 60 * 60 * 1000;

class ReturnService extends BaseService {
  constructor({
    returnRepository,
    orderRepository,
    orderItemRepository,
  }) {
    super();
    this.returnRepository = returnRepository;
    this.orderRepository = orderRepository;
    this.orderItemRepository = orderItemRepository;
  }

  async initiateReturn(userId, orderId, payload) {
    return withTransaction(async (session) => {
      // The app may address the order by its number (MK-...) as well as its id.
      const order = await this.orderRepository.findActiveById(orderId, userId);
      if (!order) throw AppError.notFound('Order not found');
      if (order.status !== ORDER_STATUS.DELIVERED) {
        throw AppError.conflict('Returns are only allowed for delivered orders');
      }
      const deliveredAt = order.deliveredAt || order.updatedAt;
      if (deliveredAt && Date.now() - new Date(deliveredAt).getTime() > RETURN_WINDOW_DAYS * DAY_MS) {
        throw AppError.conflict(`Returns can be requested within ${RETURN_WINDOW_DAYS} days of delivery`);
      }
      orderId = order._id;

      const orderItem = await this.orderItemRepository.findOne({
        _id: payload.orderItemId,
        orderId,
        userId,
        deletedAt: null,
      }, { session });

      if (!orderItem) throw AppError.notFound('Order item not found');

      if (payload.quantity > orderItem.quantity) {
        throw AppError.validation('Return quantity exceeds ordered quantity');
      }

      const existing = await this.returnRepository.findOne({
        orderItemId: orderItem._id,
        userId,
        status: { $nin: [RETURN_STATUS.SELLER_REJECTED, RETURN_STATUS.ADMIN_REJECTED, RETURN_STATUS.CANCELLED] },
        deletedAt: null,
      }, { session });

      if (existing) throw AppError.conflict('Return already initiated for this item');

      return this.returnRepository.create({
        orderId,
        userId,
        sellerId: orderItem.sellerId,
        orderItemId: orderItem._id,
        productId: orderItem.productId,
        quantity: payload.quantity,
        reason: payload.reason || null,
        images: payload.images || [],
        status: RETURN_STATUS.REQUESTED,
      }, session);
    });
  }

  async listByUser(userId, query = {}) {
    const page = Number(query.page) || 1;
    const limit = Math.min(Number(query.limit) || 20, 100);
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      this.returnRepository.findByUser(userId, {}, { sort: '-createdAt', skip, limit }),
      this.returnRepository.countByUser(userId),
    ]);

    return { items, total, page, limit };
  }
}

module.exports = { ReturnService };
