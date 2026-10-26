/**
 * "Catch Your Delivery" engagement game — shown on order tracking.
 *
 * Reward value is granted as a Wallet credit (WALLET_TX_REFERENCE.PROMOTION),
 * reusing the existing, already-transactional, already-idempotent wallet
 * infrastructure rather than inventing a parallel coin ledger. See
 * docs/client-requirements gap matrix for why: no coin/loyalty-point model
 * exists in this codebase, and the Wallet system is the only proven
 * grant-money-to-a-user path with anti-replay already built in.
 *
 * "Discount Coupon" and "Free Delivery" rewards are represented as a wallet
 * credit sized to their cash value (coupon-equivalent), not an actual
 * generated Coupon code — the Coupon model has no per-user assignment field
 * today, so a real single-use coupon-code reward is a follow-up, not this.
 */
const GAME_REWARD_TYPE = {
  COINS: 'coins',
  DISCOUNT_COUPON: 'discount_coupon',
  FREE_DELIVERY: 'free_delivery',
  LOYALTY_POINTS: 'loyalty_points',
  SURPRISE: 'surprise',
  NONE: 'none',
};

const GAME_REWARD_TYPE_VALUES = Object.values(GAME_REWARD_TYPE);

const GAME_SESSION_STATUS = {
  STARTED: 'started',
  CLAIMED: 'claimed',
  EXPIRED: 'expired',
};

const GAME_SESSION_STATUS_VALUES = Object.values(GAME_SESSION_STATUS);

/** Human-readable label + wallet transaction description per reward type. */
const GAME_REWARD_LABELS = {
  [GAME_REWARD_TYPE.COINS]: 'Mithilakart Coins',
  [GAME_REWARD_TYPE.DISCOUNT_COUPON]: 'Discount Coupon',
  [GAME_REWARD_TYPE.FREE_DELIVERY]: 'Free Delivery',
  [GAME_REWARD_TYPE.LOYALTY_POINTS]: 'Loyalty Points',
  [GAME_REWARD_TYPE.SURPRISE]: 'Surprise Reward',
};

/** A session older than this can no longer be claimed — prevents a stale tab replaying a win. */
const GAME_SESSION_TTL_SECONDS = 180;

/** Server-side cap on how long one play attempt can run, independent of the client's own timer. */
const GAME_MAX_DURATION_SECONDS = 90;

module.exports = {
  GAME_REWARD_TYPE,
  GAME_REWARD_TYPE_VALUES,
  GAME_SESSION_STATUS,
  GAME_SESSION_STATUS_VALUES,
  GAME_REWARD_LABELS,
  GAME_SESSION_TTL_SECONDS,
  GAME_MAX_DURATION_SECONDS,
};
