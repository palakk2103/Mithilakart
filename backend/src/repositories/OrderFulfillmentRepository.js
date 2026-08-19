const { BaseRepository } = require('../core/BaseRepository');
const OrderFulfillment = require('../models/OrderFulfillment');
const {
  FULFILLMENT_STATE,
  isValidFulfillmentTransition,
} = require('../constants/fulfillment');

class OrderFulfillmentRepository extends BaseRepository {
  constructor() {
    super(OrderFulfillment);
  }

  async findByOrderId(orderId, options = {}) {
    return this.findOne({ orderId }, options);
  }

  /**
   * Idempotent creation. `orderId` is unique, so a duplicate start() — from a
   * retried webhook, a double-confirm, or two app instances — returns the
   * existing document instead of creating a second fulfillment.
   */
  async createIfAbsent(data, session = null) {
    const existing = await this.findByOrderId(data.orderId, { session });
    if (existing) return { fulfillment: existing, created: false };

    try {
      const created = await this.create(data, session);
      return { fulfillment: created, created: true };
    } catch (error) {
      // Lost the race against a concurrent start() — the unique index held.
      if (error?.code === 11000) {
        const raced = await this.findByOrderId(data.orderId, { session });
        if (raced) return { fulfillment: raced, created: false };
      }
      throw error;
    }
  }

  /**
   * Compare-and-set state transition. Mirrors the existing
   * OrderRepository.updateStatusOptimistic pattern.
   *
   * Returns null when the expected state no longer holds, which is how two
   * concurrent actors — a seller accepting while the sweeper times the same
   * attempt out — are prevented from both winning.
   */
  async transitionState(fulfillmentId, expectedState, toState, extra = {}, session = null) {
    if (!isValidFulfillmentTransition(expectedState, toState)) {
      return null;
    }

    const query = this.model.findOneAndUpdate(
      { _id: fulfillmentId, state: expectedState },
      { ...extra, state: toState },
      { new: true, runValidators: true }
    );

    return this._applySession(query, session).exec();
  }

  async addExcludedSeller(fulfillmentId, sellerId, session = null) {
    const query = this.model.findByIdAndUpdate(
      fulfillmentId,
      { $addToSet: { excludedSellerIds: sellerId } },
      { new: true }
    );
    return this._applySession(query, session).exec();
  }

  async incrementAttemptCount(fulfillmentId, session = null) {
    const query = this.model.findByIdAndUpdate(
      fulfillmentId,
      { $inc: { attemptCount: 1 } },
      { new: true }
    );
    return this._applySession(query, session).exec();
  }

  /** Sweeper: sellers who were offered an order and never responded in time. */
  async findExpiredAcceptances(now = new Date(), limit = 50) {
    return this.find(
      {
        state: FULFILLMENT_STATE.SELLER_ASSIGNED,
        acceptanceDeadlineAt: { $ne: null, $lt: now },
      },
      { sort: { acceptanceDeadlineAt: 1 }, limit }
    );
  }

  /** Sweeper: searches that ran past the configured discovery window. */
  async findExpiredSearches(now = new Date(), limit = 50) {
    return this.find(
      {
        state: FULFILLMENT_STATE.SEARCHING,
        searchDeadlineAt: { $ne: null, $lt: now },
      },
      { sort: { searchDeadlineAt: 1 }, limit }
    );
  }

  async listForAdmin(filter = {}, options = {}) {
    return this.find(filter, { sort: { createdAt: -1 }, ...options });
  }
}

module.exports = { OrderFulfillmentRepository };
