const { BaseRepository } = require('../core/BaseRepository');
const TaxConfig = require('../models/TaxConfig');

class TaxConfigRepository extends BaseRepository {
  constructor() { super(TaxConfig); }

  async findActive() {
    return this.find({ isActive: true, deletedAt: null });
  }
}

module.exports = { TaxConfigRepository };
