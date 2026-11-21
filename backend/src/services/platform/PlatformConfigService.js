const { BaseService } = require('../../core/BaseService');
const {
  DEFAULT_PLATFORM_SETTINGS,
  PLATFORM_CONFIG_CACHE_KEY,
  PLATFORM_CONFIG_CACHE_TTL,
} = require('../../constants/platformSettings');

const { YOU_POPUP_SETTING_KEY, YOU_POPUP_ITEMS } = require('../../constants/youPopup');
const { mergeYouPopupItems } = require('./youPopupMerge');
const { HELP_CENTER_SETTING_KEY } = require('../../constants/helpCenter');
const { toPublicHelpCenter } = require('./helpCenterContent');
const { computeSurge, publicSurgeInfo } = require('../pricing/surge');
const { DEFAULT_CHECKOUT_CONTENT } = require('../../constants/checkoutContent');
const { normalizeCartDesign } = require('../../constants/cartDesign');

/** Admin values over the defaults, one level deep, so a partial save keeps the rest. */
function mergeCheckoutContent(saved) {
  const s = saved && typeof saved === 'object' ? saved : {};
  const out = { ...DEFAULT_CHECKOUT_CONTENT };
  Object.keys(DEFAULT_CHECKOUT_CONTENT).forEach((k) => {
    const d = DEFAULT_CHECKOUT_CONTENT[k];
    if (s[k] === undefined) return;
    out[k] = d && typeof d === 'object' && !Array.isArray(d) ? { ...d, ...s[k] } : s[k];
  });
  return out;
}

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
      freeShippingThreshold: Number.isFinite(Number(config.freeShippingThreshold)) ? Number(config.freeShippingThreshold) : 150,
      defaultDeliveryCharge: Number.isFinite(Number(config.defaultDeliveryCharge)) ? Number(config.defaultDeliveryCharge) : 25,
      handlingFee: Number(config.handlingFee) || 0,
      handlingFeeTiers: Array.isArray(config.handlingFeeTiers) ? config.handlingFeeTiers : [],
      maxQuantityPerItem: Number(config.maxQuantityPerItem) || 0,
      maxCartItems: Number(config.maxCartItems) || 0,
      limitedQuantityMessage: config.limitedQuantityMessage || 'Limited quantity due to high demand',
      loginRequired: config.loginRequired !== false,
      taxRate: Number(config.taxRate) || (Number(config.gst) ? Number(config.gst) / 100 : 0),
      gst: config.gst || '',
      quickCommerceEnabled: config.quickCommerceEnabled !== false,
      ecommerceEnabled: config.ecommerceEnabled !== false,
      razorpayEnabled: config.razorpayEnabled !== false,
      headerTabs: config.headerTabsConfig || null,
      // Customer-facing contact details and the admin's tab colour theme.
      supportEmail: config.supportEmail || null,
      helpline: config.helpline || null,
      tabThemes: config.tabThemes || null,
      // FEE-3: surge banner on the quick-commerce tab landings.
      surge: publicSurgeInfo(config),
      checkoutContent: mergeCheckoutContent(config.checkoutContent),
      cartDesign: normalizeCartDesign(config.cartDesign),
    };
  }

  /** Customer-safe "You" popup items: enabled only, ordered, with fixed routes. */
  async getYouPopup() {
    const config = await this.getConfig();
    const routes = new Map(YOU_POPUP_ITEMS.map((i) => [i.id, i.route]));
    return {
      items: mergeYouPopupItems(config[YOU_POPUP_SETTING_KEY])
        .filter((i) => i.enabled)
        .map((i) => ({ id: i.id, label: i.label, order: i.order, route: routes.get(i.id) })),
    };
  }

  /** Customer-safe Help & Support page content (disabled items removed). */
  async getHelpCenter() {
    const config = await this.getConfig();
    return toPublicHelpCenter(config[HELP_CENTER_SETTING_KEY]);
  }

  async getHeaderTabs() {
    const config = await this.getConfig();
    if (Array.isArray(config.headerTabsConfig) && config.headerTabsConfig.length > 0) {
      return config.headerTabsConfig;
    }
    return [
      {
        id: 'mithilakart',
        tabId: 'mithilakart',
        name: 'Mithilakart',
        label: 'Mithilakart',
        route: '/home',
        commerceFlow: 'mithilakart',
        enabled: true,
      },
      {
        id: 'quickshop',
        tabId: 'quickshop',
        name: 'Quick Shop',
        label: 'Quick Shop',
        route: '/quick-shop',
        commerceFlow: 'quick_shop',
        enabled: true,
      },
      {
        id: 'mithilak',
        tabId: 'mithilak',
        name: 'Mithilak',
        label: 'Mithilak',
        route: '/mithilak',
        commerceFlow: 'mithilak',
        enabled: true,
      },
      {
        id: 'freshgrocery',
        tabId: 'freshgrocery',
        name: 'Fresh & Groceries',
        label: 'Fresh & Groceries',
        route: '/fresh-grocery',
        commerceFlow: 'fresh_grocery',
        enabled: true,
      },
    ];
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
    return this.describeDelivery(config, subtotal, pincode).charge;
  }

  /**
   * Delivery fee breakdown: the base fee, the free-delivery threshold and what
   * the customer actually pays. The cart shows the base fee crossed out once the
   * threshold is reached, and "add ₹X more for free delivery" below it.
   */
  describeDelivery(config, subtotal, pincode = null) {
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

    const configured = Number(config.freeShippingThreshold);
    const freeAbove = rule?.freeAbove ?? (Number.isFinite(configured) ? configured : 150);
    const baseCharge = rule?.baseCharge != null
      ? Number(rule.baseCharge)
      : (Number.isFinite(Number(config.defaultDeliveryCharge)) ? Number(config.defaultDeliveryCharge) : 25);
    const isFree = freeAbove > 0 && subtotal >= freeAbove;

    return {
      baseCharge,
      freeAbove,
      charge: isFree ? 0 : baseCharge,
      amountToFree: isFree || !(freeAbove > 0) ? 0 : Math.max(0, Math.round((freeAbove - subtotal) * 100) / 100),
    };
  }

  /**
   * Handling fee: a base fee that is struck down by a percentage as the order
   * value grows (e.g. ₹11 → 30% off from ₹99 → 60% off from ₹150 → free from ₹250).
   * Tiers come from admin settings; the highest tier the order reaches applies.
   */
  computeHandlingFee(config, subtotal) {
    const base = Math.max(0, Number(config.handlingFee) || 0);
    const tiers = (Array.isArray(config.handlingFeeTiers) ? config.handlingFeeTiers : [])
      .map((t) => ({ minSubtotal: Number(t?.minSubtotal), discountPercent: Number(t?.discountPercent) }))
      .filter((t) => Number.isFinite(t.minSubtotal) && Number.isFinite(t.discountPercent))
      .sort((a, b) => a.minSubtotal - b.minSubtotal);

    let applied = null;
    for (const tier of tiers) if (subtotal >= tier.minSubtotal) applied = tier;
    const next = tiers.find((t) => t.minSubtotal > subtotal) || null;
    const percent = applied ? Math.min(100, Math.max(0, applied.discountPercent)) : 0;

    return {
      original: base,
      discountPercent: percent,
      fee: Math.round(base * (1 - percent / 100) * 100) / 100,
      appliedTier: applied ? { minSubtotal: applied.minSubtotal, discountPercent: percent } : null,
      nextTier: next && base > 0
        ? { minSubtotal: next.minSubtotal, discountPercent: Math.min(100, Math.max(0, next.discountPercent)) }
        : null,
    };
  }

  /** FEE-3 surge charge for one cart. */
  computeSurge(config, args) {
    return computeSurge(config, args);
  }

  /** Per-customer purchase limits the cart enforces (admin editable). */
  async getPurchaseLimits() {
    const config = await this.getConfig();
    const perItem = Number(config.maxQuantityPerItem);
    const cartItems = Number(config.maxCartItems);
    return {
      maxQuantityPerItem: Number.isFinite(perItem) && perItem > 0 ? Math.floor(perItem) : 0,
      maxCartItems: Number.isFinite(cartItems) && cartItems > 0 ? Math.floor(cartItems) : 0,
      message: config.limitedQuantityMessage || 'Limited quantity due to high demand',
    };
  }
}

module.exports = { PlatformConfigService };
