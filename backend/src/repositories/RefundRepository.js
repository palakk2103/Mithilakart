const { BaseRepository } = require('../core/BaseRepository');
const Refund = require('../models/Refund');

class RefundRepository extends BaseRepository {
  constructor() {
    super(Refund);
  }

  async findByReturnId(returnId) {
    return this.findOne({ returnId, deletedAt: null });
  }

  async findByIdempotencyKey(key) {
    if (!key) return null;
    return this.findOne({ idempotencyKey: key, deletedAt: null });
  }

  async count(filter = {}) {
    return this.model.countDocuments({ deletedAt: null, ...filter });
  }
}

module.exports = { RefundRepository };
