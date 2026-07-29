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

  /**
   * Atomically assign a pending order to the first partner who accepts.
   * Returns null if another partner already claimed the order.
   */
  async acceptByOrderId(orderId, partnerId, session = null) {
    const query = this.model.findOneAndUpdate(
      {
        orderId,
        deletedAt: null,
        partnerId: null,
        status: { $in: ['pending', 'assigned'] },
      },
      {
        $set: {
          partnerId,
          status: 'accepted',
          acceptedAt: new Date(),
          assignedAt: new Date(),
        },
      },
      { new: true, runValidators: true }
    );

    return this._applySession(query, session).exec();
  }
}

module.exports = { DeliveryAssignmentRepository };
