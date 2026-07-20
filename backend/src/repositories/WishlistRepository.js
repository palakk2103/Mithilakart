const { BaseRepository } = require('../core/BaseRepository');
const Wishlist = require('../models/Wishlist');

class WishlistRepository extends BaseRepository {
  constructor() {
    super(Wishlist);
  }

  async findByUser(userId, options = {}) {
    return this.find({ userId, deletedAt: null }, options);
  }

  async findEntry(userId, productId) {
    return this.findOne({ userId, productId, deletedAt: null });
  }

  async countByUser(userId) {
    return this.count({ userId, deletedAt: null });
  }

  async softDelete(userId, productId) {
    return this.model.findOneAndUpdate(
      { userId, productId, deletedAt: null },
      { deletedAt: new Date() },
      { new: true }
    );
  }
}

module.exports = { WishlistRepository };
