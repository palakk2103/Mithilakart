const { BaseService } = require('../../core/BaseService');
const {
  DEFAULT_PLATFORM_SETTINGS,
  PLATFORM_CONFIG_CACHE_KEY,
  PLATFORM_CONFIG_CACHE_TTL,
} = require('../../constants/platformSettings');

class PlatformConfigService extends BaseService {
  constructor({ platformSettingRepository, deliveryChargeRuleRepository, cacheService }) {
    super();
    this.platformSettingRepository = platformSettingRepository;
    this.deliveryChargeRuleRepository = deliveryChargeRuleRepository;
    this.cacheService = cacheService;
  }

  async getConfig() {
    const cached = await this.cacheService.get(PLATFORM_CONFIG_CACHE_KEY);
    if (cached) return cached;

    const rows = await this.platformSettingRepository.find({ deletedAt: null });
    const stored = {};
    rows.forEach((row) => {
      stored[row.key] = row.value;
    });

    const deliveryRules = await this.deliveryChargeRuleRepository.findActive({}, { sort: { createdAt: 1 } });

    const config = {
      ...DEFAULT_PLATFORM_SETTINGS,
      ...stored,
      deliveryRules: deliveryRules.map((rule) => ({
        id: rule._id,
        name: rule.name,
        baseCharge: rule.baseCharge,
        freeAbove: rule.freeAbove,
        pincodePrefix: rule.pincodePrefix || null,
        isActive: rule.isActive !== false,
      })),
    };

    await this.cacheService.set(PLATFORM_CONFIG_CACHE_KEY, config, PLATFORM_CONFIG_CACHE_TTL);
    return config;
  }

  async getPublicConfig() {
    const config = await this.getConfig();
    return {
      platformName: config.platformName,
      minOrderAmount: Number(config.minOrderAmount) || 0,
      maxDeliveryRadiusKm: Number(config.maxDeliveryRadiusKm) || 25,
      codEnabled: config.codEnabled !== false,
      codHandlingFee: Number(config.codHandlingFee) || 0,
      platformFee: Number(config.platformFee) || 0,
      packagingFee: Number(config.packagingFee) || 0,
      freeShippingThreshold: Number(config.freeShippingThreshold) || 500,
      defaultDeliveryCharge: Number(config.defaultDeliveryCharge) || 39,
      quickCommerceEnabled: config.quickCommerceEnabled !== false,
      ecommerceEnabled: config.ecommerceEnabled !== false,
      razorpayEnabled: config.razorpayEnabled !== false,
    };
  }

  async invalidateCache() {
    await this.cacheService.del(PLATFORM_CONFIG_CACHE_KEY);
  }

  computeDeliveryCharge(subtotal, { pincode = null } = {}) {
    return this._computeDeliveryChargeSync(subtotal, pincode);
  }

  async computeDeliveryChargeAsync(subtotal, { pincode = null } = {}) {
    const config = await this.getConfig();
    return this._computeDeliveryChargeFromConfig(config, subtotal, pincode);
  }

  _computeDeliveryChargeSync(subtotal, pincode) {
    // Fallback for sync callers — uses defaults only
    const threshold = DEFAULT_PLATFORM_SETTINGS.freeShippingThreshold;
    const base = DEFAULT_PLATFORM_SETTINGS.defaultDeliveryCharge;
    if (subtotal >= threshold) return 0;
    return base;
  }

  _computeDeliveryChargeFromConfig(config, subtotal, pincode) {
    const rules = config.deliveryRules || [];
    let rule = null;

    if (pincode && rules.length) {
      rule = rules.find(
        (entry) => entry.isActive !== false
          && entry.pincodePrefix
          && String(pincode).startsWith(String(entry.pincodePrefix))
      );
    }

    if (!rule && rules.length) {
      rule = rules.find((entry) => entry.isActive !== false && !entry.pincodePrefix) || rules[0];
    }

    const freeAbove = rule?.freeAbove ?? Number(config.freeShippingThreshold) ?? 500;
    if (subtotal >= freeAbove) return 0;

    if (rule?.baseCharge != null) return Number(rule.baseCharge);
    return Number(config.defaultDeliveryCharge) || 39;
  }
}

module.exports = { PlatformConfigService };
