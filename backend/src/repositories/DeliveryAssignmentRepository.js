const { BaseRepository } = require('../core/BaseRepository');
const DeliveryAssignment = require('../models/DeliveryAssignment');

class DeliveryAssignmentRepository extends BaseRepository {
  constructor() {
    super(DeliveryAssignment);
  }

  async findByOrderId(orderId) {
    return this.findOne({ orderId, deletedAt: null });
  }

  async findAvailable(limit = 20) {
    return this.find({ status: 'pending', partnerId: null, deletedAt: null }, { sort: { createdAt: -1 }, limit });
  }

  async findByPartner(partnerId, filter = {}, options = {}) {
    return this.find({ partnerId, deletedAt: null, ...filter }, options);
  }

  async countByPartner(partnerId, filter = {}) {
    return this.count({ partnerId, deletedAt: null, ...filter });
  }
}

module.exports = { DeliveryAssignmentRepository };
