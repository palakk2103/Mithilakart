const { BaseRepository } = require('../core/BaseRepository');
const SellerNotification = require('../models/SellerNotification');

class SellerNotificationRepository extends BaseRepository {
  constructor() {
    super(SellerNotification);
  }

  async findBySeller(sellerId, options = {}) {
    return this.find({ sellerId }, { sort: { createdAt: -1 }, ...options });
  }

  async markAllRead(sellerId) {
    return this.model.updateMany({ sellerId, isRead: false }, { isRead: true });
  }
}

module.exports = { SellerNotificationRepository };
