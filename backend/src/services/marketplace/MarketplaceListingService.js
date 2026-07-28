const { BaseService } = require('../../core/BaseService');
const { AppError } = require('../../utils/AppError');
const { PRODUCT_STATUS } = require('../../constants/catalog');
const {
  LISTING_STATUS,
  MARKETPLACE_TABS,
} = require('../../constants/marketplace');
const {
  normalizeMarketplaceTab,
  resolveTabFromQuery,
  deliveryLabelForListing,
  toLegacyCommerceFlow,
} = require('../../utils/marketplaceTab');
const { parsePagination, buildPaginationMeta } = require('../../utils/pagination');
const { eventBus } = require('../../events/EventBus');

class MarketplaceListingService extends BaseService {
  constructor({
    marketplaceListingRepository,
    marketplaceEngineService,
    productRepository,
    categoryRepository,
    sellerRepository,
  }) {
    super();
    this.marketplaceListingRepository = marketplaceListingRepository;
    this.marketplaceEngineService = marketplaceEngineService;
    this.productRepository = productRepository;
    this.categoryRepository = categoryRepository;
    this.sellerRepository = sellerRepository;
  }

  _serializeListing(listing, product = null) {
    const obj = listing?.toObject ? listing.toObject() : listing;
    return {
      listingId: String(obj._id),
      id: String(obj._id),
      productId: String(obj.productId),
      sellerId: String(obj.sellerId),
      marketplaceTab: obj.marketplaceTab,
      price: obj.price,
      mrp: obj.mrp,
      maxOrderQuantity: obj.maxOrderQuantity,
      listingStatus: obj.listingStatus,
      isVisible: obj.isVisible,
      deliveryType: obj.deliveryType,
      deliveryPromiseMinutes: obj.deliveryPromiseMinutes,
      deliveryLabel: deliveryLabelForListing(obj),
      promotionTags: obj.promotionTags || [],
      publishedAt: obj.publishedAt,
      approvedAt: obj.approvedAt,
      product: product ? this._serializeProductEmbed(product) : undefined,
    };
  }

  _serializeProductEmbed(product) {
    const p = product?.toObject ? product.toObject() : product;
    return {
      id: String(p._id),
      title: p.title,
      brand: p.brand,
      images: p.images || [],
      rating: p.rating,
      reviewCount: p.reviewCount,
      stock: p.stock,
      sku: p.sku,
    };
  }

  async _loadMasterProduct(productId, sellerId = null) {
    const filter = { _id: productId, deletedAt: null };
    if (sellerId) filter.sellerId = sellerId;
    const product = await this.productRepository.findOne(filter);
    if (!product) throw AppError.notFound('Product not found');
    return product;
  }

  async _assertCategoryVisibleOnTab(categoryId, tab) {
    const category = await this.categoryRepository.findById(categoryId);
    if (!category || category.deletedAt) throw AppError.notFound('Category not found');

    const tabs = category.visibleTabs?.length
      ? category.visibleTabs
      : (category.commerceFlows || []).map((f) => normalizeMarketplaceTab(f)).filter(Boolean);

    const normalized = normalizeMarketplaceTab(tab);
    if (!tabs.includes(normalized)) {
      throw AppError.validation('Product category is not visible on selected marketplace tab');
    }
  }

  async createListing(sellerId, productId, data) {
    const tab = await this.marketplaceEngineService.assertTabActive(data.marketplaceTab);
    const seller = await this.sellerRepository.findById(sellerId);
    this.marketplaceEngineService.assertSellerEligibleForTab(seller, tab);

    const product = await this._loadMasterProduct(productId, sellerId);
    const masterStatus = product.masterStatus || product.status;
    if (masterStatus !== PRODUCT_STATUS.APPROVED) {
      throw AppError.conflict('Master product must be approved before creating listings', [
        { code: 'MASTER_PRODUCT_NOT_APPROVED' },
      ]);
    }

    await this._assertCategoryVisibleOnTab(product.categoryId, tab);

    const existing = await this.marketplaceListingRepository.findByProductAndTab(productId, tab);
    if (existing) {
      throw AppError.conflict('Listing already exists for this product on selected tab');
    }

    const delivery = this.marketplaceEngineService.validateListingCommercialFields(tab, data);

    const listing = await this.marketplaceListingRepository.create({
      productId,
      sellerId,
      marketplaceTab: tab,
      price: data.price,
      mrp: data.mrp,
      maxOrderQuantity: data.maxOrderQuantity || null,
      listingStatus: LISTING_STATUS.DRAFT,
      isVisible: false,
      deliveryType: delivery.deliveryType,
      deliveryPromiseMinutes: delivery.deliveryPromiseMinutes,
      promotionTags: data.promotionTags || [],
      sortBoost: data.sortBoost || 0,
    });

    eventBus.publish('listing.created', { listingId: listing._id, productId, sellerId, tab });
    return this._serializeListing(listing, product);
  }

  async updateListing(sellerId, listingId, data) {
    const listing = await this.marketplaceListingRepository.findOne({
      _id: listingId,
      sellerId,
      deletedAt: null,
    });
    if (!listing) throw AppError.notFound('Listing not found');

    const delivery = this.marketplaceEngineService.validateListingCommercialFields(
      listing.marketplaceTab,
      {
        price: data.price ?? listing.price,
        mrp: data.mrp ?? listing.mrp,
        deliveryPromiseMinutes: data.deliveryPromiseMinutes ?? listing.deliveryPromiseMinutes,
      }
    );

    const updated = await this.marketplaceListingRepository.updateById(listingId, {
      price: data.price ?? listing.price,
      mrp: data.mrp ?? listing.mrp,
      maxOrderQuantity: data.maxOrderQuantity ?? listing.maxOrderQuantity,
      deliveryType: delivery.deliveryType,
      deliveryPromiseMinutes: delivery.deliveryPromiseMinutes,
      promotionTags: data.promotionTags ?? listing.promotionTags,
      sortBoost: data.sortBoost ?? listing.sortBoost,
      listingStatus: LISTING_STATUS.PENDING,
      isVisible: false,
    });

    return this._serializeListing(updated);
  }

  async publishListing(sellerId, listingId) {
    const listing = await this.marketplaceListingRepository.findOne({
      _id: listingId,
      sellerId,
      deletedAt: null,
    });
    if (!listing) throw AppError.notFound('Listing not found');

    const product = await this._loadMasterProduct(listing.productId, sellerId);
    const masterStatus = product.masterStatus || product.status;
    if (masterStatus !== PRODUCT_STATUS.APPROVED) {
      throw AppError.conflict('Master product must be approved', [{ code: 'MASTER_PRODUCT_NOT_APPROVED' }]);
    }

    const updated = await this.marketplaceListingRepository.updateById(listingId, {
      listingStatus: LISTING_STATUS.PENDING,
      isVisible: false,
      publishedAt: new Date(),
    });

    eventBus.publish('listing.submitted', { listingId, sellerId });
    return this._serializeListing(updated, product);
  }

  async unpublishListing(sellerId, listingId) {
    const listing = await this.marketplaceListingRepository.findOne({
      _id: listingId,
      sellerId,
      deletedAt: null,
    });
    if (!listing) throw AppError.notFound('Listing not found');

    const updated = await this.marketplaceListingRepository.updateById(listingId, {
      isVisible: false,
    });
    return this._serializeListing(updated);
  }

  async deleteListing(sellerId, listingId) {
    const listing = await this.marketplaceListingRepository.findOne({
      _id: listingId,
      sellerId,
      deletedAt: null,
    });
    if (!listing) throw AppError.notFound('Listing not found');

    await this.marketplaceListingRepository.updateById(listingId, { deletedAt: new Date(), isVisible: false });
    return { deleted: true };
  }

  async listForSeller(sellerId, query = {}) {
    const pagination = parsePagination(query);
    const filter = {};
    if (query.marketplaceTab) filter.marketplaceTab = normalizeMarketplaceTab(query.marketplaceTab);
    if (query.listingStatus) filter.listingStatus = query.listingStatus;

    const [items, total] = await Promise.all([
      this.marketplaceListingRepository.findBySeller(sellerId, filter, {
        sort: { updatedAt: -1 },
        skip: pagination.skip,
        limit: pagination.limit,
      }),
      this.marketplaceListingRepository.countBySeller(sellerId, filter),
    ]);

    return {
      items: items.map((item) => this._serializeListing(item)),
      meta: buildPaginationMeta(pagination.page, pagination.limit, total),
    };
  }

  async getListingForSeller(sellerId, listingId) {
    const listing = await this.marketplaceListingRepository.findOne({
      _id: listingId,
      sellerId,
      deletedAt: null,
    });
    if (!listing) throw AppError.notFound('Listing not found');
    const product = await this.productRepository.findById(listing.productId);
    return this._serializeListing(listing, product);
  }

  async listByProduct(productId, sellerId = null) {
    const filter = { productId, deletedAt: null };
    if (sellerId) filter.sellerId = sellerId;
    const listings = await this.marketplaceListingRepository.find(filter, { sort: { marketplaceTab: 1 } });
    return listings.map((l) => this._serializeListing(l));
  }

  async listPublicForTab(query = {}) {
    const tab = resolveTabFromQuery(query);
    if (!tab) throw AppError.validation('marketplaceTab is required');

    await this.marketplaceEngineService.assertTabActive(tab);

    const pagination = parsePagination(query);
    const filter = { marketplaceTab: tab };
    if (query.categoryId) {
      const products = await this.productRepository.findPublic({ categoryId: query.categoryId }, { limit: 500 });
      const productIds = products.map((p) => p._id);
      if (!productIds.length) {
        return { items: [], meta: buildPaginationMeta(pagination.page, pagination.limit, 0) };
      }
      filter.productId = { $in: productIds };
    }

    const [listings, total] = await Promise.all([
      this.marketplaceListingRepository.findPublic(filter, {
        sort: { sortBoost: -1, price: 1 },
        skip: pagination.skip,
        limit: pagination.limit,
      }),
      this.marketplaceListingRepository.countPublic(filter),
    ]);

    const productIds = [...new Set(listings.map((l) => String(l.productId)))];
    const products = productIds.length
      ? await this.productRepository.findPublic({ _id: { $in: productIds } })
      : [];
    const productMap = new Map(products.map((p) => [String(p._id), p]));

    const items = listings
      .map((listing) => {
        const product = productMap.get(String(listing.productId));
        if (!product) return null;
        const availableStock = this.productRepository.getAvailableStock(product);
        if (availableStock <= 0) return null;
        return {
          ...this._serializeListing(listing, product),
          name: product.title,
          title: product.title,
          brand: product.brand,
          image: product.images?.[0]?.url || null,
          imageUrl: product.images?.[0]?.url || null,
          availableStock,
          commerceFlow: toLegacyCommerceFlow(tab),
          marketplaceTab: tab,
        };
      })
      .filter(Boolean);

    return {
      items,
      meta: buildPaginationMeta(pagination.page, pagination.limit, total),
    };
  }

  async getPublicListing(listingId) {
    const listing = await this.marketplaceListingRepository.findPublicOne({ _id: listingId });
    if (!listing) throw AppError.notFound('Listing not found', [{ code: 'LISTING_NOT_FOUND' }]);

    const product = await this.productRepository.findPublicById(listing.productId);
    if (!product) throw AppError.notFound('Product not found');

    return this._serializeListing(listing, product);
  }

  async getProductWithListing(productId, query = {}) {
    const tab = resolveTabFromQuery(query);
    const product = await this.productRepository.findPublicById(productId);
    if (!product) throw AppError.notFound('Product not found');

    if (tab) {
      const listing = await this.marketplaceListingRepository.findPublicOne({
        productId,
        marketplaceTab: tab,
      });

      if (listing) {
        return {
          product: this._serializeProductEmbed(product),
          listing: this._serializeListing(listing, product),
        };
      }
    }

    const listings = await this.marketplaceListingRepository.findPublic({ productId });
    const activeListing = listings[0] || null;

    if (activeListing) {
      return {
        product: this._serializeProductEmbed(product),
        listing: this._serializeListing(activeListing, product),
      };
    }

    return {
      product: {
        ...this._serializeProductEmbed(product),
        price: product.price,
        mrp: product.mrp,
      },
      listing: null,
    };
  }

  async resolveListingForCart(listingId) {
    const listing = await this.marketplaceListingRepository.findPublicOne({ _id: listingId });
    if (!listing) {
      throw AppError.notFound('Listing not found or not available', [{ code: 'LISTING_NOT_FOUND' }]);
    }

    const product = await this.productRepository.findPublicById(listing.productId);
    if (!product) throw AppError.notFound('Product not found');

    const availableStock = this.productRepository.getAvailableStock(product);
    if (availableStock <= 0) {
      throw AppError.conflict('Product is out of stock');
    }

    return { listing, product };
  }

  async approveListing(adminId, listingId, note = null) {
    const listing = await this.marketplaceListingRepository.findOne({ _id: listingId, deletedAt: null });
    if (!listing) throw AppError.notFound('Listing not found');

    const updated = await this.marketplaceListingRepository.updateById(listingId, {
      listingStatus: LISTING_STATUS.APPROVED,
      isVisible: true,
      approvedAt: new Date(),
      moderationNote: note,
      rejectedAt: null,
    });

    eventBus.publish('listing.approved', { listingId, adminId });
    return this._serializeListing(updated);
  }

  async rejectListing(adminId, listingId, note = null) {
    const listing = await this.marketplaceListingRepository.findOne({ _id: listingId, deletedAt: null });
    if (!listing) throw AppError.notFound('Listing not found');

    const updated = await this.marketplaceListingRepository.updateById(listingId, {
      listingStatus: LISTING_STATUS.REJECTED,
      isVisible: false,
      rejectedAt: new Date(),
      moderationNote: note,
    });

    return this._serializeListing(updated);
  }

  async suspendListing(adminId, listingId, note = null) {
    const listing = await this.marketplaceListingRepository.findOne({ _id: listingId, deletedAt: null });
    if (!listing) throw AppError.notFound('Listing not found');

    const updated = await this.marketplaceListingRepository.updateById(listingId, {
      listingStatus: LISTING_STATUS.SUSPENDED,
      isVisible: false,
      moderationNote: note,
    });

    return this._serializeListing(updated);
  }

  async listForAdmin(query = {}) {
    const pagination = parsePagination(query);
    const filter = { deletedAt: null };
    if (query.listingStatus) filter.listingStatus = query.listingStatus;
    if (query.marketplaceTab) filter.marketplaceTab = normalizeMarketplaceTab(query.marketplaceTab);

    const [items, total] = await Promise.all([
      this.marketplaceListingRepository.find(filter, {
        sort: { createdAt: -1 },
        skip: pagination.skip,
        limit: pagination.limit,
      }),
      this.marketplaceListingRepository.count(filter),
    ]);

    return {
      items: items.map((item) => this._serializeListing(item)),
      meta: buildPaginationMeta(pagination.page, pagination.limit, total),
    };
  }
}

module.exports = { MarketplaceListingService };
