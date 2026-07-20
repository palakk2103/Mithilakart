const { BaseRepository } = require('../core/BaseRepository');
const CommissionRule = require('../models/CommissionRule');

class CommissionRuleRepository extends BaseRepository {
  constructor() { super(CommissionRule); }

  async findDefault() {
    return this.findOne({ isDefault: true, isActive: true, deletedAt: null });
  }
}

module.exports = { CommissionRuleRepository };
