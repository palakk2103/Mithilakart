const { BaseRepository } = require('../core/BaseRepository');
const FulfillmentAttempt = require('../models/FulfillmentAttempt');
const { ATTEMPT_STATUS } = require('../constants/fulfillment');

class FulfillmentAttemptRepository extends BaseRepository {
  constructor() {
    super(FulfillmentAttempt);
  }

  async listByFulfillment(fulfillmentId, options = {}) {
    return this.find({ fulfillmentId }, { sort: { attemptNumber: 1 }, ...options });
  }

  async listByOrderId(orderId, options = {}) {
    return this.find({ orderId }, { sort: { attemptNumber: 1 }, ...options });
  }

  async findCurrentOffer(sellerId, orderId, options = {}) {
    return this.findOne(
      { sellerId, orderId, status: ATTEMPT_STATUS.OFFERED },
      options
    );
  }

  async listPendingOffersForSeller(sellerId, options = {}) {
    return this.find(
      { sellerId, status: ATTEMPT_STATUS.OFFERED },
      { sort: { createdAt: -1 }, ...options }
    );
  }

  /**
   * Compare-and-set on attempt status.
   *
   * This is what makes seller accept idempotent and makes accept-vs-timeout a
   * race exactly one side can win: the second caller matches nothing and gets
   * null back, rather than both mutating state.
   */
  async transitionStatus(attemptId, expectedStatus, toStatus, extra = {}, session = null) {
    const query = this.model.findOneAndUpdate(
      { _id: attemptId, status: expectedStatus },
      { ...extra, status: toStatus },
      { new: true, runValidators: true }
    );

    return this._applySession(query, session).exec();
  }

  /**
   * Marks reservations released. Guarded on `releasedAt: null` so a sweeper
   * that runs twice concurrently cannot double-release the same stock.
   */
  async markReservationsReleased(attemptId, session = null) {
    const query = this.model.updateOne(
      { _id: attemptId },
      { $set: { 'reservations.$[entry].releasedAt': new Date() } },
      { arrayFilters: [{ 'entry.releasedAt': null }] }
    );

    return this._applySession(query, session).exec();
  }

  async nextAttemptNumber(fulfillmentId) {
    const last = await this.model
      .findOne({ fulfillmentId })
      .sort({ attemptNumber: -1 })
      .select({ attemptNumber: 1 })
      .lean();

    return (last?.attemptNumber || 0) + 1;
  }
}

module.exports = { FulfillmentAttemptRepository };
