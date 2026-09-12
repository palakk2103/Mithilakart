const PLATFORM_SETTING_KEYS = {
  PLATFORM_NAME: 'platformName',
  SUPPORT_EMAIL: 'supportEmail',
  HELPLINE: 'helpline',
  GST: 'gst',
  PLATFORM_FEE: 'platformFee',
  PACKAGING_FEE: 'packagingFee',
  MIN_ORDER_AMOUNT: 'minOrderAmount',
  MAX_DELIVERY_RADIUS_KM: 'maxDeliveryRadiusKm',
  COD_ENABLED: 'codEnabled',
  COD_HANDLING_FEE: 'codHandlingFee',
  EXPRESS_SURCHARGE: 'expressSurcharge',
  RAZORPAY_ENABLED: 'razorpayEnabled',
  QUICK_COMMERCE_ENABLED: 'quickCommerceEnabled',
  ECOMMERCE_ENABLED: 'ecommerceEnabled',
  FREE_SHIPPING_THRESHOLD: 'freeShippingThreshold',
  DEFAULT_DELIVERY_CHARGE: 'defaultDeliveryCharge',

  // ── CR-002 — intelligent fulfillment ───────────────────────────────────────
  // Timeouts
  QUICK_FULFILLMENT_SEARCH_TIMEOUT_SECONDS: 'quickFulfillmentSearchTimeoutSeconds',
  SELLER_ACCEPTANCE_TIMEOUT_SECONDS: 'sellerAcceptanceTimeoutSeconds',
  DELIVERY_PARTNER_ASSIGNMENT_TIMEOUT_SECONDS: 'deliveryPartnerAssignmentTimeoutSeconds',
  // Radius
  SELLER_SEARCH_RADIUS_KM: 'sellerSearchRadiusKm',
  // ETA
  DEFAULT_PREPARATION_TIME_MINUTES: 'defaultPreparationTimeMinutes',
  DELIVERY_BUFFER_MINUTES: 'deliveryBufferMinutes',
  ROUTING_PROVIDER_ENABLED: 'routingProviderEnabled',
  ROUTING_FALLBACK_SPEED_KMPH: 'routingFallbackSpeedKmph',
  // Fallback ladder
  WAREHOUSE_FALLBACK_ENABLED: 'warehouseFallbackEnabled',
  COURIER_FALLBACK_ENABLED: 'courierFallbackEnabled',
  MAX_SELLER_ATTEMPTS_PER_ORDER: 'maxSellerAttemptsPerOrder',
  // Ranking
  SELLER_RANKING_WEIGHTS: 'sellerRankingWeights',
  PARTNER_RANKING_WEIGHTS: 'partnerRankingWeights',
  // Operational
  FULFILLMENT_SWEEPER_INTERVAL_SECONDS: 'fulfillmentSweeperIntervalSeconds',
  DELIVERY_ASSIGNMENT_MODE: 'deliveryAssignmentMode',
  CROSS_SELLER_SUBSTITUTION_ENABLED: 'crossSellerSubstitutionEnabled',

  // ── "Catch Your Delivery" engagement game ───────────────────────────────────
  GAME_ENABLED: 'gameEnabled',
  GAME_STARTS_AT: 'gameStartsAt',
  GAME_EXPIRES_AT: 'gameExpiresAt',
  GAME_DURATION_SECONDS: 'gameDurationSeconds',
  GAME_MAX_PLAYS_PER_ORDER: 'gameMaxPlaysPerOrder',
  GAME_WIN_PROBABILITY: 'gameWinProbability',
  GAME_COIN_REWARD_MIN: 'gameCoinRewardMin',
  GAME_COIN_REWARD_MAX: 'gameCoinRewardMax',

  // ── Header Tabs Dynamic Navigation Configuration ───────────────────────────
  HEADER_TABS_CONFIG: 'headerTabsConfig',
};

/**
 * CR-002 seller ranking weights. Normalised to sum to 1 at load time so a
 * partial admin edit cannot silently rescale the formula. A weight of 0
 * disables that factor entirely.
 */
const DEFAULT_SELLER_RANKING_WEIGHTS = {
  distance: 0.25,
  routeEta: 0.20,
  price: 0.15,
  preparation: 0.15,
  workload: 0.15,
  availability: 0.05,
  adminBoost: 0.05,
};

/**
 * CR-002 delivery-partner ranking weights. Same normalise-to-1 rule as
 * DEFAULT_SELLER_RANKING_WEIGHTS. Mirrors DeliveryPartnerRankingService's own
 * DEFAULT_PARTNER_WEIGHTS constant, which remains the last-resort fallback if
 * this platform setting is ever absent.
 */
const DEFAULT_PARTNER_RANKING_WEIGHTS = {
  pickupDistance: 0.45,
  routeEta: 0.20,
  workload: 0.25,
  locationFreshness: 0.10,
};

const DEFAULT_PLATFORM_SETTINGS = {
  [PLATFORM_SETTING_KEYS.PLATFORM_NAME]: 'Mithilakart',
  [PLATFORM_SETTING_KEYS.SUPPORT_EMAIL]: 'support@mithilakart.com',
  [PLATFORM_SETTING_KEYS.HELPLINE]: '+91 1800 123 4567',
  [PLATFORM_SETTING_KEYS.GST]: '',
  [PLATFORM_SETTING_KEYS.PLATFORM_FEE]: 0,
  [PLATFORM_SETTING_KEYS.PACKAGING_FEE]: 0,
  [PLATFORM_SETTING_KEYS.MIN_ORDER_AMOUNT]: 0,
  [PLATFORM_SETTING_KEYS.MAX_DELIVERY_RADIUS_KM]: 25,
  [PLATFORM_SETTING_KEYS.COD_ENABLED]: true,
  [PLATFORM_SETTING_KEYS.COD_HANDLING_FEE]: 0,
  [PLATFORM_SETTING_KEYS.EXPRESS_SURCHARGE]: 0,
  [PLATFORM_SETTING_KEYS.RAZORPAY_ENABLED]: true,
  [PLATFORM_SETTING_KEYS.QUICK_COMMERCE_ENABLED]: true,
  [PLATFORM_SETTING_KEYS.ECOMMERCE_ENABLED]: true,
  [PLATFORM_SETTING_KEYS.FREE_SHIPPING_THRESHOLD]: 500,
  [PLATFORM_SETTING_KEYS.DEFAULT_DELIVERY_CHARGE]: 39,

  // ── CR-002 ─────────────────────────────────────────────────────────────────
  // The CR's 30-second discovery window. Configurable, never hardcoded.
  [PLATFORM_SETTING_KEYS.QUICK_FULFILLMENT_SEARCH_TIMEOUT_SECONDS]: 30,
  [PLATFORM_SETTING_KEYS.SELLER_ACCEPTANCE_TIMEOUT_SECONDS]: 120,
  [PLATFORM_SETTING_KEYS.DELIVERY_PARTNER_ASSIGNMENT_TIMEOUT_SECONDS]: 60,
  [PLATFORM_SETTING_KEYS.SELLER_SEARCH_RADIUS_KM]: 10,
  [PLATFORM_SETTING_KEYS.DEFAULT_PREPARATION_TIME_MINUTES]: 5,
  [PLATFORM_SETTING_KEYS.DELIVERY_BUFFER_MINUTES]: 3,
  [PLATFORM_SETTING_KEYS.WAREHOUSE_FALLBACK_ENABLED]: true,
  [PLATFORM_SETTING_KEYS.COURIER_FALLBACK_ENABLED]: true,
  [PLATFORM_SETTING_KEYS.MAX_SELLER_ATTEMPTS_PER_ORDER]: 3,
  [PLATFORM_SETTING_KEYS.SELLER_RANKING_WEIGHTS]: DEFAULT_SELLER_RANKING_WEIGHTS,
  [PLATFORM_SETTING_KEYS.PARTNER_RANKING_WEIGHTS]: DEFAULT_PARTNER_RANKING_WEIGHTS,
  [PLATFORM_SETTING_KEYS.FULFILLMENT_SWEEPER_INTERVAL_SECONDS]: 15,

  // Conservative ship defaults — CR-002 goes live dark. Each of these three
  // preserves the pre-CR-002 behaviour exactly until an operator opts in.
  [PLATFORM_SETTING_KEYS.DELIVERY_ASSIGNMENT_MODE]: 'broadcast',
  [PLATFORM_SETTING_KEYS.CROSS_SELLER_SUBSTITUTION_ENABLED]: false,
  [PLATFORM_SETTING_KEYS.ROUTING_PROVIDER_ENABLED]: false,
  [PLATFORM_SETTING_KEYS.ROUTING_FALLBACK_SPEED_KMPH]: 18,

  // "Catch Your Delivery" — ships enabled with a conservative win rate and
  // small coin range; every value admin-tunable without a deploy.
  [PLATFORM_SETTING_KEYS.GAME_ENABLED]: true,
  [PLATFORM_SETTING_KEYS.GAME_STARTS_AT]: null,
  [PLATFORM_SETTING_KEYS.GAME_EXPIRES_AT]: null,
  [PLATFORM_SETTING_KEYS.GAME_DURATION_SECONDS]: 45,
  [PLATFORM_SETTING_KEYS.GAME_MAX_PLAYS_PER_ORDER]: 1,
  [PLATFORM_SETTING_KEYS.GAME_WIN_PROBABILITY]: 0.6,
  [PLATFORM_SETTING_KEYS.GAME_COIN_REWARD_MIN]: 5,
  [PLATFORM_SETTING_KEYS.GAME_COIN_REWARD_MAX]: 25,
  [PLATFORM_SETTING_KEYS.HEADER_TABS_CONFIG]: null,
};

/**
 * Validation ranges for CR-002 settings, enforced by the admin fulfillment
 * settings endpoint. Keys absent from this map are unconstrained.
 */
const FULFILLMENT_SETTING_RANGES = {
  [PLATFORM_SETTING_KEYS.QUICK_FULFILLMENT_SEARCH_TIMEOUT_SECONDS]: { min: 5, max: 300 },
  [PLATFORM_SETTING_KEYS.SELLER_ACCEPTANCE_TIMEOUT_SECONDS]: { min: 15, max: 900 },
  [PLATFORM_SETTING_KEYS.DELIVERY_PARTNER_ASSIGNMENT_TIMEOUT_SECONDS]: { min: 15, max: 600 },
  [PLATFORM_SETTING_KEYS.SELLER_SEARCH_RADIUS_KM]: { min: 1, max: 100 },
  [PLATFORM_SETTING_KEYS.DEFAULT_PREPARATION_TIME_MINUTES]: { min: 0, max: 120 },
  [PLATFORM_SETTING_KEYS.DELIVERY_BUFFER_MINUTES]: { min: 0, max: 60 },
  [PLATFORM_SETTING_KEYS.MAX_SELLER_ATTEMPTS_PER_ORDER]: { min: 1, max: 10 },
  [PLATFORM_SETTING_KEYS.FULFILLMENT_SWEEPER_INTERVAL_SECONDS]: { min: 5, max: 300 },
  [PLATFORM_SETTING_KEYS.ROUTING_FALLBACK_SPEED_KMPH]: { min: 5, max: 80 },
  [PLATFORM_SETTING_KEYS.GAME_DURATION_SECONDS]: { min: 15, max: 90 },
  [PLATFORM_SETTING_KEYS.GAME_MAX_PLAYS_PER_ORDER]: { min: 1, max: 5 },
  [PLATFORM_SETTING_KEYS.GAME_WIN_PROBABILITY]: { min: 0, max: 1 },
  [PLATFORM_SETTING_KEYS.GAME_COIN_REWARD_MIN]: { min: 1, max: 1000 },
  [PLATFORM_SETTING_KEYS.GAME_COIN_REWARD_MAX]: { min: 1, max: 1000 },
};

const PLATFORM_CONFIG_CACHE_KEY = 'cache:platform:config';
const PLATFORM_CONFIG_CACHE_TTL = 60;

module.exports = {
  PLATFORM_SETTING_KEYS,
  DEFAULT_PLATFORM_SETTINGS,
  DEFAULT_SELLER_RANKING_WEIGHTS,
  DEFAULT_PARTNER_RANKING_WEIGHTS,
  FULFILLMENT_SETTING_RANGES,
  PLATFORM_CONFIG_CACHE_KEY,
  PLATFORM_CONFIG_CACHE_TTL,
};
