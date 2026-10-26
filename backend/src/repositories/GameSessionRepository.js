const { BaseRepository } = require('../core/BaseRepository');
const GameSession = require('../models/GameSession');

class GameSessionRepository extends BaseRepository {
  constructor() {
    super(GameSession);
  }

  async findByOrderAndAttempt(orderId, attemptNumber, options = {}) {
    return this.findOne({ orderId, attemptNumber, deletedAt: null }, options);
  }

  async countByOrder(orderId) {
    return this.model.countDocuments({ orderId, deletedAt: null });
  }

  /**
   * Atomically transitions a started, not-yet-expired session to claimed —
   * the actual anti-replay + anti-expiry gate. A concurrent second call for
   * the same session (double-click, replay, multi-tab) matches the filter
   * at most once; every other call returns null and must not grant anything.
   */
  async markClaimed(id, { walletTransactionId }, session = null) {
    const query = this.model.findOneAndUpdate(
      { _id: id, status: 'started', expiresAt: { $gt: new Date() } },
      { status: 'claimed', claimedAt: new Date(), walletTransactionId },
      { new: true }
    );
    return this._applySession(query, session).exec();
  }
}

module.exports = { GameSessionRepository };
