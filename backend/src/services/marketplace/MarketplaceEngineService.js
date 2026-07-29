const { BaseService } = require('../../core/BaseService');
const { AppError } = require('../../utils/AppError');
const {
  MARKETPLACE_TABS,
  DELIVERY_TYPE,
  QUICK_COMMERCE_TABS,
} = require('../../constants/marketplace');
const {
  normalizeMarketplaceTab,
  deliveryTypeForTab,
} = require('../../utils/marketplaceTab');

class MarketplaceEngineService extends BaseService {
  constructor({ marketplaceConfigRepository }) {
    super();
    this.marketplaceConfigRepository = marketplaceConfigRepository;
  }

  async getActiveTabs() {
    const configs = await this.marketplaceConfigRepository.findActiveTabs();
    if (configs.length) return configs;

    return [
      { tab: MARKETPLACE_TABS.MITHILAKART, displayName: 'Mithilakart', deliveryModel: DELIVERY_TYPE.STANDARD, isActive: true },
      { tab: MARKETPLACE_TABS.MITHILAK, displayName: 'Mithilak', deliveryModel: DELIVERY_TYPE.STANDARD, isActive: true },
      { tab: MARKETPLACE_TABS.QUICK_SHOP, displayName: 'Quick Shop', deliveryModel: DELIVERY_TYPE.FIXED_PROMISE, isActive: true },
      { tab: MARKETPLACE_TABS.GROCERIES_FRESH, displayName: 'Groceries & Fresh', deliveryModel: DELIVERY_TYPE.FIXED_PROMISE, isActive: true },
    ];
  }

  async assertTabActive(tab) {
    const normalized = normalizeMarketplaceTab(tab);
    if (!normalized) throw AppError.validation('Invalid marketplace tab');

    const config = await this.marketplaceConfigRepository.findByTab(normalized);
    if (config && !config.isActive) {
      throw AppError.conflict('This marketplace tab is currently inactive');
    }

    return normalized;
  }

  assertSellerEligibleForTab(seller, tab) {
    const normalized = normalizeMarketplaceTab(tab);
    if (!seller || seller.status !== 'active' || seller.kycStatus !== 'approved') {
      throw AppError.forbidden('Seller is not eligible for marketplace listings');
    }

    if (normalized === MARKETPLACE_TABS.MITHILAK && !seller.mithilakEligible) {
      throw AppError.forbidden('Seller is not eligible for Mithilak tab', [{ code: 'TAB_NOT_ALLOWED' }]);
    }
    if (normalized === MARKETPLACE_TABS.QUICK_SHOP && !seller.quickCommerceEligible) {
      throw AppError.forbidden('Seller is not eligible for Quick Shop', [{ code: 'TAB_NOT_ALLOWED' }]);
    }
    if (normalized === MARKETPLACE_TABS.GROCERIES_FRESH && !seller.groceryEligible) {
      throw AppError.forbidden('Seller is not eligible for Groceries & Fresh', [{ code: 'TAB_NOT_ALLOWED' }]);
    }

  }

  validateListingCommercialFields(tab, { price, mrp, deliveryPromiseMinutes }) {
    const normalized = normalizeMarketplaceTab(tab);
    const deliveryType = deliveryTypeForTab(normalized);

    if (price == null || mrp == null || Number(price) < 0 || Number(mrp) < 0) {
      throw AppError.validation('price and mrp are required');
    }
    if (Number(price) > Number(mrp)) {
      throw AppError.validation('price cannot exceed mrp');
    }

    if (QUICK_COMMERCE_TABS.has(normalized)) {
      if (![15, 20, 25, 30].includes(Number(deliveryPromiseMinutes))) {
        throw AppError.validation('deliveryPromiseMinutes must be 15, 20, 25, or 30 for quick commerce tabs', [
          { code: 'DELIVERY_PROMISE_REQUIRED', field: 'deliveryPromiseMinutes' },
        ]);
      }
      return { deliveryType: DELIVERY_TYPE.FIXED_PROMISE, deliveryPromiseMinutes: Number(deliveryPromiseMinutes) };
    }

    if (deliveryPromiseMinutes != null) {
      throw AppError.validation('deliveryPromiseMinutes is not allowed for standard delivery tabs');
    }

    return { deliveryType: DELIVERY_TYPE.STANDARD, deliveryPromiseMinutes: null };
  }
}

module.exports = { MarketplaceEngineService };
