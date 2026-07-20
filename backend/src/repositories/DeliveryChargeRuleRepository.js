const { BaseRepository } = require('../core/BaseRepository');
const DeliveryChargeRule = require('../models/DeliveryChargeRule');

class DeliveryChargeRuleRepository extends BaseRepository {
  constructor() { super(DeliveryChargeRule); }

  async findActive() {
    return this.find({ isActive: true, deletedAt: null });
  }
}

module.exports = { DeliveryChargeRuleRepository };
