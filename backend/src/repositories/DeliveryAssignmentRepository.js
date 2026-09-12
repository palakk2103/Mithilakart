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
    return this.find({ status: { $in: ['pending', 'assigned'] }, partnerId: null, deletedAt: null }, { sort: { createdAt: -1 }, limit });
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

  // ── CR-002 — ranked offer layer ───────────────────────────────────────────
  // Sits above the broadcast flow above, which is unchanged and remains the
  // default. Every mutation below is a single-document conditional update, so
  // two concurrent partners can never both win.

  /**
   * Offers an unclaimed assignment to exactly one partner.
   *
   * Guarded on `partnerId: null` so an assignment already accepted by someone
   * (including via the broadcast path) can never be re-offered.
   */
  async offerToPartner(orderId, partnerId, expiresAt, session = null) {
    const query = this.model.findOneAndUpdate(
      {
        orderId,
        deletedAt: null,
        partnerId: null,
        status: { $in: ['pending', 'assigned'] },
      },
      {
        $set: {
          status: 'assigned',
          offerExpiresAt: expiresAt,
          assignedAt: new Date(),
        },
        $addToSet: { offeredTo: partnerId },
        $inc: { offerRound: 1 },
      },
      { new: true, runValidators: true }
    );

    return this._applySession(query, session).exec();
  }

  /**
   * Accept restricted to the partner actually holding a live offer.
   *
   * Returns null when the offer expired, was withdrawn, belongs to someone
   * else, or the order was already claimed — the caller turns that into a
   * 409 rather than assigning a second partner.
   */
  async acceptOfferByPartner(orderId, partnerId, now = new Date(), session = null) {
    const query = this.model.findOneAndUpdate(
      {
        orderId,
        deletedAt: null,
        partnerId: null,
        status: 'assigned',
        offeredTo: partnerId,
        offerExpiresAt: { $gt: now },
      },
      {
        $set: {
          partnerId,
          status: 'accepted',
          acceptedAt: new Date(),
          offerExpiresAt: null,
        },
      },
      { new: true, runValidators: true }
    );

    return this._applySession(query, session).exec();
  }

  /**
   * Withdraws a live offer and records the refusal.
   *
   * Guarded on `partnerId: null` so a rejection arriving after someone else
   * accepted cannot undo that acceptance.
   */
  async withdrawOffer(orderId, partnerId, { reason = null } = {}, session = null) {
    const query = this.model.findOneAndUpdate(
      {
        orderId,
        deletedAt: null,
        partnerId: null,
        status: 'assigned',
        offeredTo: partnerId,
      },
      {
        $set: {
          status: 'pending',
          offerExpiresAt: null,
          rejectedAt: new Date(),
          rejectReason: reason,
        },
        $addToSet: { rejectedBy: partnerId },
      },
      { new: true, runValidators: true }
    );

    return this._applySession(query, session).exec();
  }

  /** Sweeper: offers whose window elapsed with no response. */
  async findExpiredOffers(now = new Date(), limit = 50) {
    return this.find(
      {
        deletedAt: null,
        partnerId: null,
        status: 'assigned',
        offerExpiresAt: { $ne: null, $lt: now },
      },
      { sort: { offerExpiresAt: 1 }, limit }
    );
  }

  /**
   * Expires a stale offer. Compare-and-set on the same deadline the sweeper
   * read, so a partner accepting in the same instant still wins.
   */
  async expireOffer(assignmentId, expiresAt, session = null) {
    const query = this.model.findOneAndUpdate(
      {
        _id: assignmentId,
        partnerId: null,
        status: 'assigned',
        offerExpiresAt: expiresAt,
      },
      {
        $set: { status: 'pending', offerExpiresAt: null },
      },
      { new: true }
    );

    return this._applySession(query, session).exec();
  }
}

module.exports = { DeliveryAssignmentRepository };
