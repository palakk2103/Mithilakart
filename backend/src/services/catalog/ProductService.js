const { BaseService } = require('../../core/BaseService');
const { AppError } = require('../../utils/AppError');
const { PRODUCT_STATUS, CACHE_KEYS, CACHE_TTL } = require('../../constants/catalog');
const { parsePagination, buildPaginationMeta } = require('../../utils/pagination');
const { buildListFilters } = require('../../utils/filter');
const { buildSearchQuery } = require('../../utils/search');
const { buildSortQuery } = require('../../utils/sort');
const { eventBus } = require('../../events/EventBus');

class ProductService extends BaseService {
  constructor(productRepository, productVariantRepository, categoryRepository, cacheService) {
    super(productRepository);
    this.productRepository = productRepository;
    this.productVariantRepository = productVariantRepository;
    this.categoryRepository = categoryRepository;
    this.cacheService = cacheService;
  }

  async listPublic(query = {}) {
    const pagination = parsePagination(query);
    const filters = buildListFilters(query, {
      exactFields: ['commerceFlow', 'brand'],
      rangeFields: [{ minKey: 'minPrice', maxKey: 'maxPrice', field: 'price' }],
      baseFilter: {},
    });

    if (query.categoryId) {
      filters.categoryId = query.categoryId;
    }

    const searchFilter = buildSearchQuery(query, { fields: ['title', 'description', 'brand', 'tags'] });
    const sort = buildSortQuery(query, {
      allowedFields: ['createdAt', 'price', 'rating', 'title'],
      defaultSort: { createdAt: -1 },
    });

    const combinedFilter = { ...filters, ...searchFilter };

    const [items, total] = await Promise.all([
      this.productRepository.findPublic(combinedFilter, {
        sort,
        skip: pagination.skip,
        limit: pagination.limit,
      }),
      this.productRepository.countPublic(combinedFilter),
    ]);

    return {
      items: items.map((item) => this._serializeListItem(item)),
      meta: buildPaginationMeta(pagination.page, pagination.limit, total),
    };
  }

  async listByCategory(categoryId, query = {}) {
    await this._ensureCategoryExists(categoryId);
    return this.listPublic({ ...query, categoryId });
  }

  async searchPublic(query = {}) {
    const searchTerm = query.q || query.search;
    if (!searchTerm) {
      throw AppError.validation('Search query is required');
    }

    const pagination = parsePagination(query);
    const filter = buildListFilters(query, {
      exactFields: ['commerceFlow'],
    });

    const items = await this.productRepository.searchPublic(searchTerm, filter, {
      sort: { score: { $meta: 'textScore' } },
      skip: pagination.skip,
      limit: pagination.limit,
    });

    const total = await this.productRepository.countPublic({
      ...filter,
      $text: { $search: searchTerm },
    });

    return {
      items: items.map((item) => this._serializeListItem(item)),
      meta: buildPaginationMeta(pagination.page, pagination.limit, total),
    };
  }

  async getPublicById(id) {
    const cacheKey = CACHE_KEYS.productDetail(id);
    const cached = await this.cacheService.get(cacheKey);
    if (cached) return cached;

    const product = await this.productRepository.findPublicById(id);
    if (!product) {
      throw AppError.notFound('Product not found');
    }

    const variants = await this.productVariantRepository.findByProductId(id);
    const payload = this._serializeDetail(product, variants);

    await this.cacheService.set(cacheKey, payload, CACHE_TTL.PRODUCT_DETAIL);
    return payload;
  }

  async listAdmin(query = {}) {
    const pagination = parsePagination(query);
    const filters = buildListFilters(query, {
      exactFields: ['status', 'sellerId', 'categoryId', 'commerceFlow'],
      dateRange: { fromKey: 'from', toKey: 'to', field: 'createdAt' },
    });

    const sort = buildSortQuery(query, {
      allowedFields: ['createdAt', 'price', 'title', 'status'],
      defaultSort: { createdAt: -1 },
    });

    const [items, total] = await Promise.all([
      this.productRepository.findAdmin(filters, {
        sort,
        skip: pagination.skip,
        limit: pagination.limit,
      }),
      this.productRepository.countAdmin(filters),
    ]);

    return {
      items: items.map((item) => this._serializeAdminItem(item)),
      meta: buildPaginationMeta(pagination.page, pagination.limit, total),
    };
  }

  async getAdminById(id) {
    const product = await this.productRepository.findById(id);
    if (!product || product.deletedAt) {
      throw AppError.notFound('Product not found');
    }

    const variants = await this.productVariantRepository.findByProductId(id);
    return this._serializeDetail(product, variants);
  }

  async approve(id, adminId) {
    const product = await this.getAdminById(id);
    if (product.status === PRODUCT_STATUS.APPROVED) {
      return product;
    }

    await this.productRepository.updateStatus(id, PRODUCT_STATUS.APPROVED);
    await this._invalidateProductCache(id);
    eventBus.publish('product.approved', { productId: id, adminId });
    return this.getAdminById(id);
  }

  async reject(id, moderationNote, adminId) {
    await this.getAdminById(id);
    await this.productRepository.updateStatus(id, PRODUCT_STATUS.REJECTED, moderationNote);
    await this._invalidateProductCache(id);
    eventBus.publish('product.rejected', { productId: id, adminId, moderationNote });
    return this.getAdminById(id);
  }

  async delete(id) {
    await this.getAdminById(id);
    await this.productRepository.softDelete(id);
    await this._invalidateProductCache(id);
  }

  async bulkAction(ids, action) {
    if (!Array.isArray(ids) || ids.length === 0) {
      throw AppError.validation('Product ids are required');
    }

    if (ids.length > 100) {
      throw AppError.validation('Maximum 100 products per bulk request');
    }

    if (action === 'approve') {
      await this.productRepository.bulkUpdateStatus(ids, PRODUCT_STATUS.APPROVED);
    } else if (action === 'reject') {
      await this.productRepository.bulkUpdateStatus(ids, PRODUCT_STATUS.REJECTED);
    } else if (action === 'delete') {
      await this.productRepository.softDeleteMany(ids);
    } else {
      throw AppError.validation('Invalid bulk action');
    }

    await Promise.all(ids.map((id) => this._invalidateProductCache(id)));

    return { updatedCount: ids.length, action };
  }

  async _ensureCategoryExists(categoryId) {
    const category = await this.categoryRepository.findById(categoryId);
    if (!category || category.deletedAt || !category.isActive) {
      throw AppError.notFound('Category not found');
    }
  }

  async _invalidateProductCache(productId) {
    await this.cacheService.del(CACHE_KEYS.productDetail(productId));
  }

  _serializeListItem(product) {
    return {
      id: product._id,
      title: product.title,
      price: product.price,
      mrp: product.mrp,
      stock: product.stock,
      categoryId: product.categoryId,
      images: product.images,
      commerceFlows: product.commerceFlows,
      rating: product.rating,
      reviewCount: product.reviewCount,
      brand: product.brand,
    };
  }

  _serializeAdminItem(product) {
    return {
      ...this._serializeListItem(product),
      sellerId: product.sellerId,
      sku: product.sku,
      status: product.status,
      moderationNote: product.moderationNote,
      createdAt: product.createdAt,
    };
  }

  _serializeDetail(product, variants = []) {
    return {
      ...this._serializeAdminItem(product),
      description: product.description,
      tags: product.tags,
      attributes: product.attributes,
      variants: variants.map((variant) => ({
        id: variant._id,
        name: variant.name,
        sku: variant.sku,
        price: variant.price,
        mrp: variant.mrp,
        stock: variant.stock,
        attributes: variant.attributes,
      })),
    };
  }
}

module.exports = {
  ProductService,
};
