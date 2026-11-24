const { DEFAULT_CART_RAILS, DEFAULT_CHECKOUT_CONTENT } = require('./checkoutContent');
const { DEFAULT_CART_DESIGN } = require('./cartDesign');

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

  // ── Customer app colour theme per marketplace tab (festival themes) ────────
  TAB_THEMES: 'tabThemes',

  // ── Checkout fees & purchase limits (all admin-editable) ───────────────────
  HANDLING_FEE: 'handlingFee',
  HANDLING_FEE_TIERS: 'handlingFeeTiers',
  MAX_QUANTITY_PER_ITEM: 'maxQuantityPerItem',
  MAX_CART_ITEMS: 'maxCartItems',
  LIMITED_QUANTITY_MESSAGE: 'limitedQuantityMessage',
  LOGIN_REQUIRED: 'loginRequired',
  // FEE-3 — high-demand surge charge on quick-commerce tabs.
  SURGE_CONFIG: 'surgeConfig',
  // Opening hours / force-close of the quick-commerce tabs.
  SHOP_HOURS: 'shopHours',
  // Cashback rules, wallet at checkout, and pincode blocking.
  CASHBACK_CONFIG: 'cashbackConfig',
  WALLET_CHECKOUT_ENABLED: 'walletCheckoutEnabled',
  BLOCK_UNSERVICEABLE_PINCODES: 'blockUnserviceablePincodes',
  // CART-1/2/3 — cart recommendation rails and checkout page content.
  CART_RAILS: 'cartRails',
  CHECKOUT_CONTENT: 'checkoutContent',
  // Design (colours, spacing, section order/visibility) of the cart, summary and payment pages.
  CART_DESIGN: 'cartDesign',

  // ── Customised packages (e.g. Mithila Dwirangman) ──────────────────────────
  PACKAGE_MIN_PRICE_PERCENT: 'packageMinPricePercent',
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

const DEFAULT_HANDLING_FEE_TIERS = [
  { minSubtotal: 99, discountPercent: 30 },
  { minSubtotal: 150, discountPercent: 60 },
  { minSubtotal: 250, discountPercent: 100 },
];

/**
 * FEE-3 surge charge. Applies on the listed tabs while the cart value (items at
 * selling price, before coupons) is below `threshold`. `windows` limit it to
 * days/times in IST; an empty list means "always". A window whose end is
 * before its start runs past midnight (22:00 → 02:00).
 */
const DEFAULT_SURGE_CONFIG = {
  enabled: true,
  amount: 30,
  threshold: 499,
  tabs: ['quick_shop', 'groceries_fresh'],
  windows: [],
  // 'always'  – applies whenever a window matches (no windows = all day)
  // 'demand'  – applies only while the tab really is busy: at least
  //             demandOrders orders placed in the last demandMinutes
  trigger: 'always',
  demandOrders: 20,
  demandMinutes: 15,
  bannerTitle: 'Place an order above ₹{threshold} to avoid surge charge',
  bannerText: 'Surge applicable due to high demand',
  billLabel: 'Surge charge',
  billNote: 'High demand right now. Add ₹{remaining} more to remove it.',
};

/**
 * Cashback rules. Ships off: it is a promise to customers, so it starts only
 * when the admin sets it up. mode 'instant' takes it off the bill, 'wallet'
 * credits it after delivery. Changing `campaign` restarts perCustomer counts.
 */
const DEFAULT_CASHBACK_CONFIG = {
  enabled: false,
  campaign: 'default',
  mode: 'instant',
  type: 'percent',
  value: 10,
  maxAmount: 100,
  minOrder: 199,
  methods: ['upi'],
  tabs: [],
  perCustomer: 1,
  startsAt: null,
  endsAt: null,
  title: '',
  linkText: 'Know More',
  terms: '',
};

/** Quick-commerce opening hours in IST; close '00:00' = midnight. */
const DEFAULT_SHOP_HOURS = {
  enabled: true,
  forceClosed: false,
  tabs: ['quick_shop', 'groceries_fresh'],
  open: '06:00',
  close: '00:00',
  message: 'We are closed right now. Orders open again at 6:00 AM.',
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
  // Delivery ₹25, free from ₹150 (admin can change both).
  [PLATFORM_SETTING_KEYS.FREE_SHIPPING_THRESHOLD]: 150,
  [PLATFORM_SETTING_KEYS.DEFAULT_DELIVERY_CHARGE]: 25,

  // Handling fee ₹11, struck down 30% from ₹99, 60% from ₹150, 100% (free) from ₹250.
  // The highest tier whose minSubtotal the order reaches applies.
  [PLATFORM_SETTING_KEYS.HANDLING_FEE]: 11,
  [PLATFORM_SETTING_KEYS.HANDLING_FEE_TIERS]: DEFAULT_HANDLING_FEE_TIERS,
  // Per customer, per cart line. A listing's own maxOrderQuantity can only tighten this.
  [PLATFORM_SETTING_KEYS.MAX_QUANTITY_PER_ITEM]: 10,
  // 0 = unlimited distinct lines in one cart.
  [PLATFORM_SETTING_KEYS.MAX_CART_ITEMS]: 30,
  [PLATFORM_SETTING_KEYS.LIMITED_QUANTITY_MESSAGE]: 'Limited quantity due to high demand',
  [PLATFORM_SETTING_KEYS.LOGIN_REQUIRED]: true,
  [PLATFORM_SETTING_KEYS.SURGE_CONFIG]: DEFAULT_SURGE_CONFIG,
  [PLATFORM_SETTING_KEYS.SHOP_HOURS]: DEFAULT_SHOP_HOURS,
  [PLATFORM_SETTING_KEYS.CASHBACK_CONFIG]: DEFAULT_CASHBACK_CONFIG,
  [PLATFORM_SETTING_KEYS.WALLET_CHECKOUT_ENABLED]: false,
  [PLATFORM_SETTING_KEYS.BLOCK_UNSERVICEABLE_PINCODES]: false,
  [PLATFORM_SETTING_KEYS.CART_RAILS]: DEFAULT_CART_RAILS,
  [PLATFORM_SETTING_KEYS.CHECKOUT_CONTENT]: DEFAULT_CHECKOUT_CONTENT,
  [PLATFORM_SETTING_KEYS.CART_DESIGN]: DEFAULT_CART_DESIGN,
  // A customised package may not be cut below this % of its full price.
  [PLATFORM_SETTING_KEYS.PACKAGE_MIN_PRICE_PERCENT]: 40,

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
  // null = the app's built-in colours. Shape: { preset, tabs: { <tab>: { primary, dark, accent, light } } }
  [PLATFORM_SETTING_KEYS.TAB_THEMES]: null,
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
  DEFAULT_SURGE_CONFIG,
  DEFAULT_SHOP_HOURS,
  DEFAULT_CASHBACK_CONFIG,
  FULFILLMENT_SETTING_RANGES,
  PLATFORM_CONFIG_CACHE_KEY,
  PLATFORM_CONFIG_CACHE_TTL,
};
