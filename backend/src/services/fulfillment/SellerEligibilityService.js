const { BaseService } = require('../../core/BaseService');
const { MARKETPLACE_TABS } = require('../../constants/marketplace');
const { FULFILLMENT_FAILURE_CODE: FAIL } = require('../../constants/fulfillment');
const { normalizeMarketplaceTab } = require('../../utils/marketplaceTab');

/**
 * CR-002 — seller eligibility and the complete-cart availability check.
 *
 * THE governing rule: a seller must be able to supply EVERY line, at the full
 * requested quantity. One missing product disqualifies the seller outright —
 * there is no partial eligibility and no partial reservation.
 *
 * This service only READS. It decides who is worth attempting; the atomic
 * reservation in FulfillmentReservationService is what actually decides the
 * winner, because a candidate that passes this read can still lose the write
 * to a concurrent order. That is expected, not a bug.
 */
class SellerEligibilityService extends BaseService {
  constructor({ sellerRepository, productRepository, marketplaceListingRepository }) {
    super();
    this.sellerRepository = sellerRepository;
    this.productRepository = productRepository;
    this.marketplaceListingRepository = marketplaceListingRepository;
  }

  /** Tab -> the seller flag that gates it (conditions 4 / 13). */
  static tabEligibilityField(marketplaceTab) {
    switch (normalizeMarketplaceTab(marketplaceTab)) {
      case MARKETPLACE_TABS.QUICK_SHOP: return 'quickCommerceEligible';
      case MARKETPLACE_TABS.GROCERIES_FRESH: return 'groceryEligible';
      case MARKETPLACE_TABS.MITHILAK: return 'mithilakEligible';
      default: return null;
    }
  }

  availableStock(product) {
    if (!product) return 0;
    return Math.max(0, (product.stock || 0) - (product.reservedStock || 0));
  }

  /**
   * Conditions 1-4, 9, 11-12 — properties of the seller alone, independent of
   * the cart. Cheap, so they run before any product lookup.
   */
  checkSellerAttributes({ seller, marketplaceTab, distanceKm, config, excludedSellerIds = [] }) {
    if (!seller) return { ok: false, failureCode: FAIL.SELLER_INACTIVE };

    const excluded = new Set((excludedSellerIds || []).map(String));
    if (excluded.has(String(seller._id))) {
      return { ok: false, failureCode: FAIL.SELLER_REJECTED };
    }

    if (seller.kycStatus !== 'approved') {
      return { ok: false, failureCode: FAIL.SELLER_NOT_APPROVED };
    }

    if (seller.status !== 'active' || seller.deletedAt) {
      return { ok: false, failureCode: FAIL.SELLER_INACTIVE };
    }

    // Defaults true, so pre-CR-002 sellers are unaffected.
    if (seller.isAcceptingOrders === false) {
      return { ok: false, failureCode: FAIL.SELLER_NOT_ACCEPTING };
    }

    const tabField = SellerEligibilityService.tabEligibilityField(marketplaceTab);
    if (tabField && !seller[tabField]) {
      return { ok: false, failureCode: FAIL.SELLER_TAB_INELIGIBLE };
    }

    if (seller.latitude == null || seller.longitude == null) {
      return { ok: false, failureCode: FAIL.SELLER_NO_LOCATION };
    }

    if (distanceKm != null) {
      if (distanceKm > Number(config.sellerSearchRadiusKm)) {
        return { ok: false, failureCode: FAIL.SELLER_OUT_OF_RADIUS };
      }

      // A seller may advertise a tighter radius than the platform search.
      const ownRadius = Number(seller.fulfillmentRadiusKm);
      if (Number.isFinite(ownRadius) && ownRadius > 0 && distanceKm > ownRadius) {
        return { ok: false, failureCode: FAIL.SELLER_OUT_OF_RADIUS };
      }
    }

    return { ok: true, failureCode: null };
  }

  /**
   * Conditions 5-8 — the complete-cart check.
   *
   * Returns the resolved product for every line, or the first failure. The
   * early return on failure is the literal encoding of "one missing product
   * disqualifies the whole seller".
   */
  checkCompleteCart({ seller, requiredItems, marketplaceTab, config, productIndex, listingIndex }) {
    const sellerId = String(seller._id);
    const resolvedItems = [];

    for (const item of requiredItems) {
      const substitutable = Boolean(item.catalogKey) && config.crossSellerSubstitutionEnabled === true;

      let product;
      if (!substitutable) {
        // Not substitutable: only the seller who owns the carted product
        // qualifies. This is the pre-CR-002 behaviour and the safe default.
        if (String(item.originSellerId) !== sellerId) {
          return { ok: false, failureCode: FAIL.SELLER_MISSING_PRODUCT, failedItem: item };
        }
        product = productIndex.get(String(item.productId));
      } else {
        product = productIndex.get(`${item.catalogKey}::${sellerId}`);
      }

      if (!product || product.deletedAt) {
        return { ok: false, failureCode: FAIL.SELLER_MISSING_PRODUCT, failedItem: item };
      }

      if (this.availableStock(product) < item.quantity) {
        return { ok: false, failureCode: FAIL.SELLER_INSUFFICIENT_QUANTITY, failedItem: item };
      }

      const listing = listingIndex.get(`${String(product._id)}::${marketplaceTab}`);
      if (!listing) {
        return { ok: false, failureCode: FAIL.SELLER_LISTING_UNAVAILABLE, failedItem: item };
      }

      const maxQty = Number(listing.maxOrderQuantity);
      if (Number.isFinite(maxQty) && maxQty > 0 && item.quantity > maxQty) {
        return { ok: false, failureCode: FAIL.SELLER_INSUFFICIENT_QUANTITY, failedItem: item };
      }

      resolvedItems.push({
        productId: product._id,
        catalogKey: item.catalogKey || null,
        quantity: item.quantity,
        unitPrice: listing.price != null ? listing.price : item.unitPrice,
        listingId: listing._id,
        availableStock: this.availableStock(product),
      });
    }

    return { ok: true, failureCode: null, resolvedItems };
  }

  /** Condition 8 — serviceability by pincode, when the tab declares a list. */
  checkServiceability({ seller, tabConfig }) {
    const pincodes = tabConfig?.serviceablePincodes;
    if (!Array.isArray(pincodes) || pincodes.length === 0) return { ok: true, failureCode: null };
    if (!seller.pincode) return { ok: false, failureCode: FAIL.SELLER_NOT_SERVICEABLE };

    const serviceable = pincodes.some((prefix) => String(seller.pincode).startsWith(String(prefix)));
    return serviceable
      ? { ok: true, failureCode: null }
      : { ok: false, failureCode: FAIL.SELLER_NOT_SERVICEABLE };
  }

  /**
   * Builds lookup indexes for one candidate batch.
   *
   * Products are keyed two ways because the two resolution paths differ: by
   * `_id` for the non-substitutable path, and by `catalogKey::sellerId` for
   * the substitutable one.
   */
  async _buildIndexes({ sellerIds, requiredItems, marketplaceTab, config }) {
    const productIds = requiredItems.map((item) => item.productId).filter(Boolean);
    const catalogKeys = config.crossSellerSubstitutionEnabled
      ? [...new Set(requiredItems.map((item) => item.catalogKey).filter(Boolean))]
      : [];

    const or = [];
    if (productIds.length) or.push({ _id: { $in: productIds } });
    if (catalogKeys.length && sellerIds.length) {
      or.push({ catalogKey: { $in: catalogKeys }, sellerId: { $in: sellerIds } });
    }

    const products = or.length
      ? await this.productRepository.find({ $or: or, deletedAt: null })
      : [];

    const productIndex = new Map();
    for (const product of products) {
      productIndex.set(String(product._id), product);
      if (product.catalogKey) {
        productIndex.set(`${product.catalogKey}::${String(product.sellerId)}`, product);
      }
    }

    const listings = products.length
      ? await this.marketplaceListingRepository.findPublic({
        productId: { $in: products.map((p) => p._id) },
        marketplaceTab,
      })
      : [];

    const listingIndex = new Map();
    for (const listing of listings) {
      listingIndex.set(`${String(listing.productId)}::${listing.marketplaceTab}`, listing);
    }

    return { productIndex, listingIndex };
  }

  /**
   * Full evaluation for one candidate. Exposed separately so the warehouse
   * path can reuse it without going through nearby-seller discovery.
   */
  evaluateSeller({
    seller,
    requiredItems,
    marketplaceTab,
    config,
    distanceKm = null,
    excludedSellerIds = [],
    tabConfig = null,
    productIndex,
    listingIndex,
  }) {
    const attributes = this.checkSellerAttributes({
      seller, marketplaceTab, distanceKm, config, excludedSellerIds,
    });
    if (!attributes.ok) return { eligible: false, ...attributes, sellerId: seller?._id };

    const serviceability = this.checkServiceability({ seller, tabConfig });
    if (!serviceability.ok) return { eligible: false, ...serviceability, sellerId: seller._id };

    const cart = this.checkCompleteCart({
      seller, requiredItems, marketplaceTab, config, productIndex, listingIndex,
    });
    if (!cart.ok) return { eligible: false, ...cart, sellerId: seller._id };

    return {
      eligible: true,
      failureCode: null,
      sellerId: seller._id,
      seller,
      distanceKm,
      resolvedItems: cart.resolvedItems,
    };
  }

  /**
   * Discovers every nearby seller who can supply the COMPLETE cart.
   *
   * Returns both the eligible candidates and the rejections — the rejections
   * are persisted as FulfillmentAttempt rows so Admin can answer "why did this
   * order go to courier?" without guesswork.
   */
  async findEligibleSellers({
    requiredItems,
    customerLocation,
    marketplaceTab,
    config,
    excludedSellerIds = [],
    tabConfig = null,
  }) {
    if (!requiredItems?.length) {
      return { eligible: [], rejected: [] };
    }

    if (customerLocation?.lat == null || customerLocation?.lng == null) {
      return { eligible: [], rejected: [], failureCode: FAIL.SELLER_NO_LOCATION };
    }

    const nearby = await this.sellerRepository.findNearby({
      latitude: customerLocation.lat,
      longitude: customerLocation.lng,
      radiusKm: Number(config.sellerSearchRadiusKm),
    });

    // A warehouse is a Seller, but it is fallback level 2 — it must not be
    // picked during the local-seller pass.
    const candidates = nearby.filter((seller) => seller.isWarehouse !== true);
    if (!candidates.length) return { eligible: [], rejected: [] };

    const { productIndex, listingIndex } = await this._buildIndexes({
      sellerIds: candidates.map((s) => s._id),
      requiredItems,
      marketplaceTab,
      config,
    });

    const eligible = [];
    const rejected = [];

    for (const seller of candidates) {
      const result = this.evaluateSeller({
        seller,
        requiredItems,
        marketplaceTab,
        config,
        distanceKm: seller.distanceKm,
        excludedSellerIds,
        tabConfig,
        productIndex,
        listingIndex,
      });

      if (result.eligible) eligible.push(result);
      else rejected.push(result);
    }

    return { eligible, rejected };
  }

  /** Fallback level 2 — the warehouse pass. Same rules, different candidate set. */
  async findEligibleWarehouses({
    requiredItems,
    marketplaceTab,
    config,
    customerLocation = null,
    excludedSellerIds = [],
    tabConfig = null,
  }) {
    const warehouses = await this.sellerRepository.find({
      isWarehouse: true,
      status: 'active',
      deletedAt: null,
    });

    if (!warehouses.length) return { eligible: [], rejected: [] };

    const { productIndex, listingIndex } = await this._buildIndexes({
      sellerIds: warehouses.map((w) => w._id),
      requiredItems,
      marketplaceTab,
      config,
    });

    const eligible = [];
    const rejected = [];

    for (const warehouse of warehouses) {
      const result = this.evaluateSeller({
        seller: warehouse,
        requiredItems,
        marketplaceTab,
        config,
        // Warehouses are not radius-limited: they are the fallback precisely
        // because no local seller was within range.
        distanceKm: null,
        excludedSellerIds,
        tabConfig,
        productIndex,
        listingIndex,
      });

      if (result.eligible) {
        eligible.push({ ...result, distanceKm: this._warehouseDistance(warehouse, customerLocation) });
      } else {
        rejected.push(result);
      }
    }

    return { eligible, rejected };
  }

  _warehouseDistance(warehouse, customerLocation) {
    if (!customerLocation || warehouse.latitude == null || warehouse.longitude == null) return null;
    // Reuses the existing helper — no duplicate geo maths.
    const { haversineKm } = require('../../utils/geoHelper');
    return haversineKm(customerLocation.lat, customerLocation.lng, warehouse.latitude, warehouse.longitude);
  }
}

module.exports = { SellerEligibilityService };
