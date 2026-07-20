const { BaseRepository } = require('../core/BaseRepository');
const Return = require('../models/Return');

class ReturnRepository extends BaseRepository {
  constructor() {
    super(Return);
  }

  async findBySeller(sellerId, filter = {}, options = {}) {
    return this.find({ sellerId, deletedAt: null, ...filter }, options);
  }

  async countBySeller(sellerId, filter = {}) {
    return this.count({ sellerId, deletedAt: null, ...filter });
  }

  async findByUser(userId, filter = {}, options = {}) {
    return this.find({ userId, deletedAt: null, ...filter }, options);
  }

  async countByUser(userId, filter = {}) {
    return this.count({ userId, deletedAt: null, ...filter });
  }
}

module.exports = { ReturnRepository };
