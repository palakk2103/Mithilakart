const { BaseService } = require('../../core/BaseService');
const { AppError } = require('../../utils/AppError');
const { assertSellerResource } = require('../../helpers/sellerScope');
const { PRODUCT_STATUS, COMMERCE_FLOWS } = require('../../constants/catalog');
const {
  MARKETPLACE_TABS,
  DELIVERY_TYPE,
  LISTING_STATUS,
  LEGACY_FLOW_TO_TAB,
} = require('../../constants/marketplace');
const MarketplaceListing = require('../../models/MarketplaceListing');
const { parsePagination, buildPaginationMeta } = require('../../utils/pagination');
const { buildListFilters } = require('../../utils/filter');
const { buildSortQuery } = require('../../utils/sort');
const { eventBus } = require('../../events/EventBus');

const LOCAL_COMMERCE_FLOWS = new Set([COMMERCE_FLOWS.QUICK_SHOP, COMMERCE_FLOWS.FRESH_GROCERY]);

class SellerProductService extends BaseService {
  constructor({ productRepository, productVariantRepository, categoryRepository, cacheService, sellerRepository = null, translationService = null }) {
    super();
    this.productRepository = productRepository;
    this.productVariantRepository = productVariantRepository;
    this.categoryRepository = categoryRepository;
    this.cacheService = cacheService;
    this.sellerRepository = sellerRepository;
    this.translationService = translationService;
  }

  async list(sellerId, query = {}) {
    const pagination = parsePagination(query);
    const filters = buildListFilters(query, { exactFields: ['status', 'categoryId'] });
    const sort = buildSortQuery(query, { allowedFields: ['createdAt', 'price', 'title'], defaultSort: { createdAt: -1 } });

    const [items, total] = await Promise.all([
      this.productRepository.findBySeller(sellerId, filters, {
        sort,
        skip: pagination.skip,
        limit: pagination.limit,
      }),
      this.productRepository.countBySeller(sellerId, filters),
    ]);

    return { items, meta: buildPaginationMeta(pagination.page, pagination.limit, total) };
  }

  async getById(sellerId, productId) {
    const product = await this.productRepository.findOne({ _id: productId, sellerId, deletedAt: null });
    if (!product) throw AppError.notFound('Product not found');
    const variants = await this.productVariantRepository.findByProductId(productId);
    return { ...product.toObject(), variants };
  }

  async create(sellerId, data, listingOptions = {}) {
    const category = await this.categoryRepository.findById(data.categoryId);
    if (!category || category.deletedAt) throw AppError.notFound('Category not found');

    const flows = Array.isArray(data.commerceFlows) && data.commerceFlows.length
      ? data.commerceFlows
      : [];

    const isLocalCommerce = flows.some((flow) => LOCAL_COMMERCE_FLOWS.has(flow));
    if (isLocalCommerce && this.sellerRepository) {
      const seller = await this.sellerRepository.findById(sellerId);
      if (seller?.latitude == null || seller?.longitude == null) {
        throw AppError.validation(
          'Store location (latitude/longitude) is required before listing Quick Commerce products'
        );
      }
    }

    let initialStatus = PRODUCT_STATUS.PENDING;
    let pickupCoordinates = data.pickupCoordinates || null;
    let pickupAddress = data.pickupAddress || null;
    let city = data.city || null;

    if (this.sellerRepository) {
      const seller = await this.sellerRepository.findById(sellerId);
      if (seller) {
        if (seller.kycStatus === 'approved' && seller.status === 'active') {
          initialStatus = PRODUCT_STATUS.APPROVED;
        }
        if (!pickupCoordinates && seller.latitude != null && seller.longitude != null) {
          pickupCoordinates = { latitude: seller.latitude, longitude: seller.longitude };
        }
        if (!pickupAddress) {
          pickupAddress = seller.geocodedAddress || seller.addressLine || null;
        }
        if (!city) {
          city = seller.city || null;
        }
      }
    }

    const baseSku = data.sku ? String(data.sku).trim() : `SKU-${Date.now()}`;
    let finalSku = baseSku;
    let counter = 1;
    while (await this.productRepository.findOne({ sellerId, sku: finalSku, deletedAt: null })) {
      finalSku = `${baseSku}-${counter}`;
      counter++;
    }

    if (this.translationService && (!data.translations || !data.translations.hi || !data.translations.mai)) {
      try {
        const trans = await this.translationService.translateFields({
          title: data.title,
          description: data.description || '',
        });
        data.translations = { ...(data.translations || {}), ...trans };
      } catch (_err) {
        // Safe fallback
      }
    }

    const product = await this.productRepository.create({
      ...data,
      pickupCoordinates,
      pickupAddress,
      city,
      sku: finalSku,
      sellerId,
      status: initialStatus,
      masterStatus: initialStatus,
      commerceFlows: flows.length ? flows : ['standard'],
    });

    eventBus.publish('product.created', { productId: product._id, sellerId });
    await this._syncListings(product, listingOptions);
    return product;
  }

  /**
   * @param {object} [options]
   * @param {number} [options.deliveryPromiseMinutes] quick-tab promise; when
   *   omitted an existing listing keeps its value (new ones default to 30).
   */
  async _syncListings(product, options = {}) {
    if (!product) return;
    try {
      const flows = Array.isArray(product.commerceFlows) && product.commerceFlows.length
        ? product.commerceFlows
        : ['standard'];

      // A tab the seller unticked must stop showing the product there.
      const keepTabs = flows.map((flow) => LEGACY_FLOW_TO_TAB[flow] || flow).filter(Boolean);
      await MarketplaceListing.updateMany(
        { productId: product._id, marketplaceTab: { $nin: keepTabs }, deletedAt: null },
        { $set: { isVisible: false, deletedAt: new Date() } }
      );

      for (const flow of flows) {
        const tab = LEGACY_FLOW_TO_TAB[flow] || flow;
        if (!tab) continue;

        const isQuick = tab === MARKETPLACE_TABS.QUICK_SHOP || tab === MARKETPLACE_TABS.GROCERIES_FRESH;
        const isApproved = product.status === PRODUCT_STATUS.APPROVED || product.status === 'active';

        const setOnInsert = {
          productId: product._id,
          sellerId: product.sellerId,
          marketplaceTab: tab,
        };
        const set = {
          price: product.price,
          mrp: product.mrp || product.price,
          listingStatus: isApproved ? LISTING_STATUS.APPROVED : LISTING_STATUS.PENDING,
          isVisible: isApproved,
          deliveryType: isQuick ? DELIVERY_TYPE.FIXED_PROMISE : DELIVERY_TYPE.STANDARD,
          publishedAt: product.createdAt || new Date(),
          approvedAt: isApproved ? new Date() : null,
          deletedAt: null,
        };
        // Previously forced to 30 on every save, discarding the seller's choice.
        if (!isQuick) {
          set.deliveryPromiseMinutes = null;
        } else if (options.deliveryPromiseMinutes) {
          set.deliveryPromiseMinutes = options.deliveryPromiseMinutes;
        } else {
          setOnInsert.deliveryPromiseMinutes = 30;
        }

        await MarketplaceListing.findOneAndUpdate(
          { productId: product._id, marketplaceTab: tab },
          { $setOnInsert: setOnInsert, $set: set },
          { upsert: true, new: true }
        );
      }
    } catch {
      // Non-blocking for product operations
    }
  }

  async update(sellerId, productId, data, listingOptions = {}) {
    const product = await this.productRepository.findOne({ _id: productId, sellerId, deletedAt: null });
    if (!product) throw AppError.notFound('Product not found');

    if (data.categoryId) {
      const category = await this.categoryRepository.findById(data.categoryId);
      if (!category || category.deletedAt) throw AppError.notFound('Category not found');
    }

    if (data.sku) {
      const baseSku = String(data.sku).trim();
      let finalSku = baseSku;
      let counter = 1;
      while (await this.productRepository.findOne({ sellerId, sku: finalSku, _id: { $ne: productId }, deletedAt: null })) {
        finalSku = `${baseSku}-${counter}`;
        counter++;
      }
      data.sku = finalSku;
    }

    if (this.translationService && (data.title !== undefined || data.description !== undefined)) {
      try {
        const titleToTrans = data.title !== undefined ? data.title : product.title;
        const descToTrans = data.description !== undefined ? data.description : (product.description || '');
        const trans = await this.translationService.translateFields({
          title: titleToTrans,
          description: descToTrans,
        });
        data.translations = { ...(product.translations || {}), ...(data.translations || {}), ...trans };
      } catch (_err) {
        // Safe fallback
      }
    }

    const updated = await this.productRepository.updateById(productId, data);
    if (this.cacheService) {
      const langs = ['en', 'hi', 'mai'];
      langs.forEach((l) => this.cacheService.del(`cache:products:detail:${productId}:${l}`).catch(() => {}));
    }
    await this._syncListings(updated, listingOptions);
    return updated;
  }

  async delete(sellerId, productId) {
    const product = await this.productRepository.findOne({ _id: productId, sellerId, deletedAt: null });
    if (!product) throw AppError.notFound('Product not found');
    await MarketplaceListing.updateMany({ productId }, { deletedAt: new Date(), isVisible: false });
    return this.productRepository.updateById(productId, { deletedAt: new Date() });
  }

  async duplicate(sellerId, productId) {
    const product = await this.getById(sellerId, productId);
    let initialStatus = PRODUCT_STATUS.PENDING;
    if (this.sellerRepository) {
      const seller = await this.sellerRepository.findById(sellerId);
      if (seller && seller.kycStatus === 'approved' && seller.status === 'active') {
        initialStatus = PRODUCT_STATUS.APPROVED;
      }
    }

    const copy = await this.productRepository.create({
      sellerId,
      title: `${product.title} (Copy)`,
      description: product.description,
      sku: `${product.sku}-COPY-${Date.now()}`,
      price: product.price,
      mrp: product.mrp,
      stock: product.stock,
      categoryId: product.categoryId,
      status: initialStatus,
      masterStatus: initialStatus,
      images: product.images,
      videos: product.videos,
      tags: product.tags,
      commerceFlows: product.commerceFlows,
      brand: product.brand,
      attributes: product.attributes,
    });
    await this._syncListings(copy);
    return copy;
  }

  async updateStatus(sellerId, productId, status) {
    const product = await this.productRepository.findOne({ _id: productId, sellerId, deletedAt: null });
    if (!product) throw AppError.notFound('Product not found');
    assertSellerResource(product.sellerId, sellerId);
    const updated = await this.productRepository.updateStatus(productId, status);
    await this._syncListings(updated);
    return updated;
  }
}

module.exports = { SellerProductService };
