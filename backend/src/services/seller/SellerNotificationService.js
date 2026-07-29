const { BaseService } = require('../../core/BaseService');
const { AppError } = require('../../utils/AppError');

class SellerNotificationService extends BaseService {
  constructor({ sellerNotificationRepository }) {
    super();
    this.sellerNotificationRepository = sellerNotificationRepository;
  }

  async list(sellerId, query = {}) {
    const limit = Math.min(Number(query.limit) || 20, 100);
    return this.sellerNotificationRepository.findBySeller(sellerId, { limit });
  }

  async markRead(sellerId, notificationId) {
    const notification = await this.sellerNotificationRepository.findOne({
      _id: notificationId,
      sellerId,
    });
    if (!notification) throw AppError.notFound('Notification not found');
    return this.sellerNotificationRepository.updateById(notificationId, { isRead: true });
  }

  async markAllRead(sellerId) {
    await this.sellerNotificationRepository.markAllRead(sellerId);
    return { updated: true };
  }
}

module.exports = { SellerNotificationService };
