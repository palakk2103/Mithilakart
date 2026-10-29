const { BaseService } = require('../../core/BaseService');
const { AppError } = require('../../utils/AppError');
const { haversineKm } = require('../../utils/geoHelper');
const { logger } = require('../../utils/logger');

const FALLBACK_SEARCH_RADIUS_KM = 10;

/**
 * Decides whether a seller can serve a customer location on a quick-commerce
 * tab (Quick Shop, Groceries & Fresh).
 *
 * Browsing and fulfilment must agree. The nearby feed used to show every
 * approved seller within 25 km, while the fulfilment engine only offers orders
 * to tab-eligible sellers inside `sellerSearchRadiusKm` (10 km by default) —
 * so a customer could add a "20 min" product that was then silently shipped by
 * courier. Both now ask this service, which applies the engine's own seller
 * rules (SellerEligibilityService.checkSellerAttributes).
 */
class QuickServiceAreaService extends BaseService {
  constructor({ sellerEligibilityService, fulfillmentConfigService, sellerRepository, productRepository }) {
    super();
    this.sellerEligibilityService = sellerEligibilityService;
    this.fulfillmentConfigService = fulfillmentConfigService;
    this.sellerRepository = sellerRepository;
    this.productRepository = productRepository;
  }

  async resolveConfig(marketplaceTab) {
    try {
      return await this.fulfillmentConfigService.resolve(marketplaceTab);
    } catch (err) {
      logger.warn({ err, marketplaceTab }, 'Quick service area: config resolve failed, using defaults');
      return { sellerSearchRadiusKm: FALLBACK_SEARCH_RADIUS_KM };
    }
  }

  async searchRadiusKm(marketplaceTab) {
    const config = await this.resolveConfig(marketplaceTab);
    return Number(config.sellerSearchRadiusKm) || FALLBACK_SEARCH_RADIUS_KM;
  }

  /**
   * Same verdict the engine reaches for this seller. Warehouses are the
   * engine's radius-free fallback, so only their own radius (if set) applies.
   */
  servesLocation(seller, marketplaceTab, distanceKm, config) {
    if (!seller) return false;
    if (seller.isWarehouse) {
      const own = Number(seller.fulfillmentRadiusKm);
      if (Number.isFinite(own) && own > 0 && distanceKm > own) return false;
      return this.sellerEligibilityService
        .checkSellerAttributes({ seller, marketplaceTab, distanceKm: null, config }).ok;
    }
    return this.sellerEligibilityService
      .checkSellerAttributes({ seller, marketplaceTab, distanceKm, config }).ok;
  }

  /** Filters sellers that already carry `distanceKm` from the customer. */
  async filterServingSellers(sellers, marketplaceTab) {
    const config = await this.resolveConfig(marketplaceTab);
    return sellers.filter((seller) => this.servesLocation(seller, marketplaceTab, seller.distanceKm, config));
  }

  /**
   * Checkout guard for quick tabs: every line must come from a seller that
   * can deliver to the chosen address. Throws a 409 the app can show as-is.
   */
  async assertDeliverable({ items, location, marketplaceTab }) {
    const lat = Number(location?.lat);
    const lng = Number(location?.lng);
    if (location?.lat == null || location?.lng == null || !Number.isFinite(lat) || !Number.isFinite(lng)) {
      throw AppError.validation('Pick your delivery address on the map so we can check quick delivery', [
        { code: 'QUICK_ADDRESS_LOCATION_REQUIRED', field: 'addressId' },
      ]);
    }

    const sellerIds = [...new Set(items.map((it) => String(it.sellerId)).filter(Boolean))];
    const productIds = [...new Set(items.map((it) => String(it.productId)).filter(Boolean))];
    const [sellers, products, config] = await Promise.all([
      this.sellerRepository.find({ _id: { $in: sellerIds } }),
      this.productRepository ? this.productRepository.find({ _id: { $in: productIds } }) : [],
      this.resolveConfig(marketplaceTab),
    ]);
    const sellerById = new Map(sellers.map((s) => [String(s._id), s]));
    const productById = new Map(products.map((p) => [String(p._id), p]));

    for (const item of items) {
      const seller = sellerById.get(String(item.sellerId));
      const distanceKm = seller?.latitude != null && seller?.longitude != null
        ? haversineKm(lat, lng, seller.latitude, seller.longitude)
        : null;
      const productRadius = Number(productById.get(String(item.productId))?.attributes?.serviceableRadius);
      const outsideProductRadius = Number.isFinite(productRadius) && productRadius > 0
        && distanceKm != null && distanceKm > productRadius;

      if (distanceKm == null || outsideProductRadius || !this.servesLocation(seller, marketplaceTab, distanceKm, config)) {
        const name = item.title || item.name || productById.get(String(item.productId))?.title || 'An item';
        throw AppError.conflict(
          `${name} can't be delivered quickly to this address. Choose an address near the store or remove it from your cart.`,
          [{ code: 'QUICK_NOT_DELIVERABLE', productId: String(item.productId) }]
        );
      }
    }
  }
}

module.exports = { QuickServiceAreaService };
