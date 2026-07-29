const { BaseRepository } = require('../core/BaseRepository');
const Review = require('../models/Review');

class ReviewRepository extends BaseRepository {
  constructor() {
    super(Review);
  }

  async findByProduct(productId, filter = {}, options = {}) {
    return this.find({ productId, deletedAt: null, status: 'approved', ...filter }, options);
  }

  async findByUser(userId, options = {}) {
    return this.find({ userId, deletedAt: null }, options);
  }

  async findBySeller(sellerId, filter = {}, options = {}) {
    return this.find({ sellerId, deletedAt: null, ...filter }, options);
  }

  async countByUserToday(userId) {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    return this.count({ userId, createdAt: { $gte: start }, deletedAt: null });
  }

  async countByProduct(productId) {
    return this.count({ productId, status: 'approved', deletedAt: null });
  }
}

module.exports = { ReviewRepository };
