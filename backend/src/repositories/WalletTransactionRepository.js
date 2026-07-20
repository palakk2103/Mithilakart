const { BaseRepository } = require('../core/BaseRepository');
const WalletTransaction = require('../models/WalletTransaction');

class WalletTransactionRepository extends BaseRepository {
  constructor() {
    super(WalletTransaction);
  }

  async findByUserId(userId, options = {}) {
    return this.find({ userId, deletedAt: null }, options);
  }

  async findByIdempotencyKey(key) {
    if (!key) return null;
    return this.findOne({ idempotencyKey: key, deletedAt: null });
  }

  async countByUserId(userId) {
    return this.count({ userId, deletedAt: null });
  }
}

module.exports = { WalletTransactionRepository };
