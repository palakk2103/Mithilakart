const { BaseService } = require('../../core/BaseService');
const {
  PLATFORM_SETTING_KEYS: K,
  DEFAULT_PLATFORM_SETTINGS,
  DEFAULT_SELLER_RANKING_WEIGHTS,
  FULFILLMENT_SETTING_RANGES,
} = require('../../constants/platformSettings');
const { DELIVERY_ASSIGNMENT_MODE_VALUES } = require('../../constants/fulfillment');

/**
 * CR-002 — resolves operational fulfillment rules.
 *
 * Resolution order:
 *   MarketplaceConfig.fulfillmentOverrides[key]   (per-tab, nullable)
 *     -> PlatformSetting[key]                     (platform-wide, admin-editable)
 *       -> DEFAULT_PLATFORM_SETTINGS[key]         (code constant, last resort)
 *
 * Reads through the EXISTING PlatformConfigService, so it inherits that
 * service's Redis cache and its invalidateCache() on admin write. No second
 * cache, no second loader, no second settings store.
 */
class FulfillmentConfigService extends BaseService {
  constructor({ platformConfigService, marketplaceConfigRepository = null }) {
    super();
    this.platformConfigService = platformConfigService;
    this.marketplaceConfigRepository = marketplaceConfigRepository;
  }

  _num(value, key) {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) return Number(DEFAULT_PLATFORM_SETTINGS[key]);

    const range = FULFILLMENT_SETTING_RANGES[key];
    if (!range) return parsed;
    return Math.min(Math.max(parsed, range.min), range.max);
  }

  _bool(value, key) {
    if (typeof value === 'boolean') return value;
    if (value === 'true') return true;
    if (value === 'false') return false;
    return Boolean(DEFAULT_PLATFORM_SETTINGS[key]);
  }

  /**
   * Normalises ranking weights to sum to 1.
   *
   * Without this a partial admin edit — bumping `distance` to 0.9 and leaving
   * the rest — would silently rescale every other factor. Falls back to the
   * defaults if the admin zeroes out everything.
   */
  normalizeWeights(raw) {
    const source = (raw && typeof raw === 'object') ? raw : DEFAULT_SELLER_RANKING_WEIGHTS;
    const keys = Object.keys(DEFAULT_SELLER_RANKING_WEIGHTS);

    const sanitized = {};
    for (const key of keys) {
      const value = Number(source[key]);
      sanitized[key] = Number.isFinite(value) && value > 0 ? value : 0;
    }

    const total = keys.reduce((sum, key) => sum + sanitized[key], 0);
    if (total <= 0) return { ...DEFAULT_SELLER_RANKING_WEIGHTS };

    const normalized = {};
    for (const key of keys) normalized[key] = sanitized[key] / total;
    return normalized;
  }

  /**
   * Redistributes the weight of factors whose data is unavailable across the
   * remaining factors.
   *
   * Defaulting an unavailable factor's score to 0 instead would penalise every
   * candidate equally while still consuming its share of the total — turning
   * off workload tracking would quietly flatten the whole ranking.
   */
  redistributeWeights(weights, availableFactors) {
    const available = new Set(availableFactors);
    const kept = {};
    let keptTotal = 0;

    for (const [key, value] of Object.entries(weights)) {
      if (available.has(key)) {
        kept[key] = value;
        keptTotal += value;
      }
    }

    if (keptTotal <= 0) return {};

    const result = {};
    for (const [key, value] of Object.entries(kept)) result[key] = value / keptTotal;
    return result;
  }

  async resolve(marketplaceTab = null) {
    const platform = await this.platformConfigService.getConfig();

    let overrides = {};
    if (marketplaceTab && this.marketplaceConfigRepository) {
      try {
        const tabConfig = await this.marketplaceConfigRepository.findByTab(marketplaceTab);
        overrides = tabConfig?.fulfillmentOverrides || {};
      } catch {
        // A missing or malformed tab config must never block fulfillment —
        // fall through to platform-level settings.
        overrides = {};
      }
    }

    const pick = (key) => {
      const override = overrides?.[key];
      if (override !== undefined && override !== null) return override;
      if (platform?.[key] !== undefined && platform[key] !== null) return platform[key];
      return DEFAULT_PLATFORM_SETTINGS[key];
    };

    const mode = String(pick(K.DELIVERY_ASSIGNMENT_MODE));

    return {
      // Timeouts
      searchTimeoutSeconds: this._num(pick(K.QUICK_FULFILLMENT_SEARCH_TIMEOUT_SECONDS), K.QUICK_FULFILLMENT_SEARCH_TIMEOUT_SECONDS),
      sellerAcceptanceTimeoutSeconds: this._num(pick(K.SELLER_ACCEPTANCE_TIMEOUT_SECONDS), K.SELLER_ACCEPTANCE_TIMEOUT_SECONDS),
      deliveryPartnerAssignmentTimeoutSeconds: this._num(pick(K.DELIVERY_PARTNER_ASSIGNMENT_TIMEOUT_SECONDS), K.DELIVERY_PARTNER_ASSIGNMENT_TIMEOUT_SECONDS),

      // Radius
      sellerSearchRadiusKm: this._num(pick(K.SELLER_SEARCH_RADIUS_KM), K.SELLER_SEARCH_RADIUS_KM),
      maxDeliveryRadiusKm: this._num(pick(K.MAX_DELIVERY_RADIUS_KM), K.MAX_DELIVERY_RADIUS_KM),

      // ETA
      defaultPreparationTimeMinutes: this._num(pick(K.DEFAULT_PREPARATION_TIME_MINUTES), K.DEFAULT_PREPARATION_TIME_MINUTES),
      deliveryBufferMinutes: this._num(pick(K.DELIVERY_BUFFER_MINUTES), K.DELIVERY_BUFFER_MINUTES),
      routingProviderEnabled: this._bool(pick(K.ROUTING_PROVIDER_ENABLED), K.ROUTING_PROVIDER_ENABLED),
      routingFallbackSpeedKmph: this._num(pick(K.ROUTING_FALLBACK_SPEED_KMPH), K.ROUTING_FALLBACK_SPEED_KMPH),

      // Fallback ladder
      warehouseFallbackEnabled: this._bool(pick(K.WAREHOUSE_FALLBACK_ENABLED), K.WAREHOUSE_FALLBACK_ENABLED),
      courierFallbackEnabled: this._bool(pick(K.COURIER_FALLBACK_ENABLED), K.COURIER_FALLBACK_ENABLED),
      maxSellerAttempts: this._num(pick(K.MAX_SELLER_ATTEMPTS_PER_ORDER), K.MAX_SELLER_ATTEMPTS_PER_ORDER),

      // Ranking
      rankingWeights: this.normalizeWeights(pick(K.SELLER_RANKING_WEIGHTS)),

      // Operational
      sweeperIntervalSeconds: this._num(pick(K.FULFILLMENT_SWEEPER_INTERVAL_SECONDS), K.FULFILLMENT_SWEEPER_INTERVAL_SECONDS),
      deliveryAssignmentMode: DELIVERY_ASSIGNMENT_MODE_VALUES.includes(mode)
        ? mode
        : DEFAULT_PLATFORM_SETTINGS[K.DELIVERY_ASSIGNMENT_MODE],
      crossSellerSubstitutionEnabled: this._bool(pick(K.CROSS_SELLER_SUBSTITUTION_ENABLED), K.CROSS_SELLER_SUBSTITUTION_ENABLED),

      // Fees — reused from existing settings, snapshotted onto the order.
      platformFee: this._num(pick(K.PLATFORM_FEE), K.PLATFORM_FEE),
      packagingFee: this._num(pick(K.PACKAGING_FEE), K.PACKAGING_FEE),
      quickCommerceEnabled: this._bool(pick(K.QUICK_COMMERCE_ENABLED), K.QUICK_COMMERCE_ENABLED),
    };
  }

  /**
   * Freezes the rules actually applied to one order.
   *
   * Written to Order.fulfillment.configSnapshot so that a later admin change
   * to a timeout, buffer, or fee cannot retroactively alter a historical
   * order's ETA or totals.
   */
  buildSnapshot(resolved, extra = {}) {
    return {
      searchTimeoutSeconds: resolved.searchTimeoutSeconds,
      sellerAcceptanceTimeoutSeconds: resolved.sellerAcceptanceTimeoutSeconds,
      sellerSearchRadiusKm: resolved.sellerSearchRadiusKm,
      defaultPreparationTimeMinutes: resolved.defaultPreparationTimeMinutes,
      deliveryBufferMinutes: resolved.deliveryBufferMinutes,
      routingProviderEnabled: resolved.routingProviderEnabled,
      routingFallbackSpeedKmph: resolved.routingFallbackSpeedKmph,
      maxSellerAttempts: resolved.maxSellerAttempts,
      rankingWeights: resolved.rankingWeights,
      warehouseFallbackEnabled: resolved.warehouseFallbackEnabled,
      courierFallbackEnabled: resolved.courierFallbackEnabled,
      crossSellerSubstitutionEnabled: resolved.crossSellerSubstitutionEnabled,
      platformFee: resolved.platformFee,
      packagingFee: resolved.packagingFee,
      ...extra,
      resolvedAt: new Date().toISOString(),
    };
  }
}

module.exports = { FulfillmentConfigService };
