const crypto = require('crypto');
const { BaseService } = require('../../core/BaseService');
const { AppError } = require('../../utils/AppError');
const { withTransaction } = require('../../database');
const { ORDER_STATUS } = require('../../constants/commerce');
const { WALLET_TX_REFERENCE } = require('../../constants/wallet');
const {
  PLATFORM_SETTING_KEYS: K,
} = require('../../constants/platformSettings');
const {
  GAME_REWARD_TYPE,
  GAME_REWARD_LABELS,
  GAME_SESSION_TTL_SECONDS,
} = require('../../constants/game');

const NOT_TRACKABLE_STATUSES = [ORDER_STATUS.DELIVERED, ORDER_STATUS.CANCELLED];

/**
 * "Catch Your Delivery" — a 30–60s mini-game shown on order tracking.
 *
 * The outcome is decided ENTIRELY server-side at start() and stored on the
 * GameSession before the client ever sees it. claim() only checks that a
 * session the server already decided is a win, is still valid, and has not
 * already been claimed — it does not accept a client-reported result. This
 * is the actual backend-authoritative guarantee the client requirements
 * describe ("frontend cannot grant rewards directly").
 *
 * Reward money moves through WalletService.credit(), which is already
 * transactional and idempotency-key gated. GameSession itself carries a
 * genuinely UNIQUE (orderId, attemptNumber) index — see GameSession.js for
 * why that matters (WalletTransaction/Refund/Order's own idempotencyKey
 * index is NOT unique, a pre-existing gap this service does not rely on).
 */
class GameService extends BaseService {
  constructor({
    gameSessionRepository,
    orderRepository,
    walletService,
    platformConfigService,
  }) {
    super();
    this.gameSessionRepository = gameSessionRepository;
    this.orderRepository = orderRepository;
    this.walletService = walletService;
    this.platformConfigService = platformConfigService;
  }

  async _resolveSettings() {
    const config = await this.platformConfigService.getConfig();
    return {
      enabled: config[K.GAME_ENABLED] !== false,
      startsAt: config[K.GAME_STARTS_AT] ? new Date(config[K.GAME_STARTS_AT]) : null,
      expiresAt: config[K.GAME_EXPIRES_AT] ? new Date(config[K.GAME_EXPIRES_AT]) : null,
      durationSeconds: Number(config[K.GAME_DURATION_SECONDS]) || 45,
      maxPlaysPerOrder: Number(config[K.GAME_MAX_PLAYS_PER_ORDER]) || 1,
      winProbability: Math.min(Math.max(Number(config[K.GAME_WIN_PROBABILITY]) ?? 0.6, 0), 1),
      coinMin: Number(config[K.GAME_COIN_REWARD_MIN]) || 5,
      coinMax: Number(config[K.GAME_COIN_REWARD_MAX]) || 25,
    };
  }

  _isCampaignLive(settings, now = new Date()) {
    if (!settings.enabled) return false;
    if (settings.startsAt && now < settings.startsAt) return false;
    if (settings.expiresAt && now > settings.expiresAt) return false;
    return true;
  }

  /**
   * Resolves by ObjectId or orderNumber, and filters by userId in the same
   * query — mirrors OrderService.getTracking's own resolution so a request
   * for someone else's order looks identical to a request for a
   * non-existent one (no existence leak via a different error path).
   */
  async _loadOwnedOrder(orderId, userId) {
    const order = await this.orderRepository.findActiveById(orderId, userId);
    if (!order) throw AppError.notFound('Order not found');
    return order;
  }

  /** Cryptographically secure, not Math.random — a reward outcome is money. */
  _secureRandom() {
    return crypto.randomInt(0, 1_000_000) / 1_000_000;
  }

  _decideOutcome(settings) {
    const won = this._secureRandom() < settings.winProbability;
    if (!won) {
      return { won: false, rewardType: GAME_REWARD_TYPE.NONE, rewardValue: 0, rewardLabel: null };
    }

    // Reward-type distribution among wins — coins most common, surprise rarest.
    const roll = this._secureRandom();
    let rewardType;
    if (roll < 0.55) rewardType = GAME_REWARD_TYPE.COINS;
    else if (roll < 0.75) rewardType = GAME_REWARD_TYPE.DISCOUNT_COUPON;
    else if (roll < 0.90) rewardType = GAME_REWARD_TYPE.FREE_DELIVERY;
    else if (roll < 0.97) rewardType = GAME_REWARD_TYPE.LOYALTY_POINTS;
    else rewardType = GAME_REWARD_TYPE.SURPRISE;

    const coinRange = Math.max(1, settings.coinMax - settings.coinMin);
    const coinValue = settings.coinMin + Math.floor(this._secureRandom() * coinRange);

    const rewardValueByType = {
      [GAME_REWARD_TYPE.COINS]: coinValue,
      [GAME_REWARD_TYPE.DISCOUNT_COUPON]: Math.max(20, Math.round(coinValue * 2)),
      [GAME_REWARD_TYPE.FREE_DELIVERY]: 39, // matches DEFAULT_DELIVERY_CHARGE; real fee resolved at claim time
      [GAME_REWARD_TYPE.LOYALTY_POINTS]: coinValue,
      [GAME_REWARD_TYPE.SURPRISE]: Math.round(coinValue * 3),
    };

    return {
      won: true,
      rewardType,
      rewardValue: rewardValueByType[rewardType],
      rewardLabel: GAME_REWARD_LABELS[rewardType],
    };
  }

  /**
   * Starts one play attempt for an order and returns ONLY what the client
   * needs to run the game (duration, session id) — never the outcome.
   */
  async startSession({ orderId: orderIdOrNumber, userId }) {
    const order = await this._loadOwnedOrder(orderIdOrNumber, userId);
    const orderId = order._id;

    if (NOT_TRACKABLE_STATUSES.includes(order.status)) {
      throw AppError.conflict('This order can no longer be played for');
    }

    const settings = await this._resolveSettings();
    if (!this._isCampaignLive(settings)) {
      throw AppError.forbidden('The game is not currently available');
    }

    const existingCount = await this.gameSessionRepository.countByOrder(orderId);
    if (existingCount >= settings.maxPlaysPerOrder) {
      throw AppError.conflict('You have already used your play for this order');
    }

    const outcome = this._decideOutcome(settings);
    const expiresAt = new Date(Date.now() + GAME_SESSION_TTL_SECONDS * 1000);

    const session = await this.gameSessionRepository.create({
      userId,
      orderId,
      attemptNumber: existingCount + 1,
      status: 'started',
      won: outcome.won,
      rewardType: outcome.rewardType,
      rewardValue: outcome.rewardValue,
      rewardLabel: outcome.rewardLabel,
      expiresAt,
    });

    return {
      sessionId: session._id,
      durationSeconds: settings.durationSeconds,
      expiresAt,
    };
  }

  /**
   * Reveals + grants the reward for a session that was already decided at
   * start(). Does not accept a win/lose result from the client — the only
   * client input is which session to claim.
   */
  async claimSession({ sessionId, userId }) {
    const session = await this.gameSessionRepository.findById(sessionId);
    if (!session) throw AppError.notFound('Game session not found');
    if (String(session.userId) !== String(userId)) {
      throw AppError.forbidden('This session does not belong to you');
    }

    // Already claimed: return the same result idempotently rather than
    // erroring — a duplicate claim request (double-click, refresh, replay)
    // must be a safe no-op, not a confusing failure.
    if (session.status === 'claimed') {
      return this._serialize(session);
    }

    if (session.status !== 'started') {
      throw AppError.conflict('This session cannot be claimed');
    }

    if (!session.won) {
      // Nothing to grant — mark claimed via the same atomic gate (which also
      // enforces not-expired) so a second "claim" on a loss is a safe no-op.
      const updated = await this.gameSessionRepository.markClaimed(session._id, { walletTransactionId: null });
      if (updated) return this._serialize(updated);
      // Gate missed: either already claimed (race) or expired between the
      // read above and here — re-read to report the true current state.
      const latest = await this.gameSessionRepository.findById(session._id);
      if (latest?.status === 'claimed') return this._serialize(latest);
      throw AppError.gone('This game session has expired');
    }

    const idempotencyKey = `game:${session._id}`;

    return withTransaction(async (txSession) => {
      const claimed = await this.gameSessionRepository.markClaimed(
        session._id,
        { walletTransactionId: null },
        txSession
      );

      if (!claimed) {
        // Gate missed: either a concurrent claim already won the race, or
        // the session expired since it was read — distinguish the two so a
        // genuinely expired win is reported honestly, not silently emptied.
        const latest = await this.gameSessionRepository.findById(session._id, { session: txSession });
        if (latest?.status === 'claimed') return this._serialize(latest);
        throw AppError.gone('This game session has expired');
      }

      const walletTx = await this.walletService.credit({
        userId,
        amount: session.rewardValue,
        referenceType: WALLET_TX_REFERENCE.PROMOTION,
        referenceId: session._id,
        description: `Catch Your Delivery — ${session.rewardLabel}`,
        idempotencyKey,
        session: txSession,
      });

      const withWalletTx = await this.gameSessionRepository.updateById(
        session._id,
        { walletTransactionId: walletTx._id },
        txSession
      );

      return this._serialize(withWalletTx || claimed);
    });
  }

  async getPlayEligibility({ orderId: orderIdOrNumber, userId }) {
    const order = await this._loadOwnedOrder(orderIdOrNumber, userId);
    const settings = await this._resolveSettings();
    const live = this._isCampaignLive(settings);
    const trackable = !NOT_TRACKABLE_STATUSES.includes(order.status);
    const playsUsed = await this.gameSessionRepository.countByOrder(order._id);

    return {
      eligible: live && trackable && playsUsed < settings.maxPlaysPerOrder,
      campaignLive: live,
      orderTrackable: trackable,
      playsUsed,
      maxPlays: settings.maxPlaysPerOrder,
      durationSeconds: settings.durationSeconds,
    };
  }

  _serialize(session) {
    return {
      sessionId: session._id,
      status: session.status,
      won: session.won,
      rewardType: session.rewardType,
      rewardValue: session.rewardValue,
      rewardLabel: session.rewardLabel,
      claimedAt: session.claimedAt,
    };
  }
}

module.exports = { GameService };
