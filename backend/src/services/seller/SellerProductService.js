const { BaseService } = require('../../core/BaseService');
const { AppError } = require('../../utils/AppError');
const { assertSellerResource } = require('../../helpers/sellerScope');
const { PRODUCT_STATUS, COMMERCE_FLOWS } = require('../../constants/catalog');
const { parsePagination, buildPaginationMeta } = require('../../utils/pagination');
const { buildListFilters } = require('../../utils/filter');
const { buildSortQuery } = require('../../utils/sort');
const { eventBus } = require('../../events/EventBus');

const LOCAL_COMMERCE_FLOWS = new Set([COMMERCE_FLOWS.QUICK_SHOP, COMMERCE_FLOWS.FRESH_GROCERY]);

class SellerProductService extends BaseService {
  constructor({ productRepository, productVariantRepository, categoryRepository, cacheService, sellerRepository = null }) {
    super();
    this.productRepository = productRepository;
    this.productVariantRepository = productVariantRepository;
    this.categoryRepository = categoryRepository;
    this.cacheService = cacheService;
    this.sellerRepository = sellerRepository;
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

  async create(sellerId, data) {
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
    if (this.sellerRepository) {
      const seller = await this.sellerRepository.findById(sellerId);
      if (seller && seller.kycStatus === 'approved' && seller.status === 'active') {
        initialStatus = PRODUCT_STATUS.APPROVED;
      }
    }

    const baseSku = data.sku ? String(data.sku).trim() : `SKU-${Date.now()}`;
    let finalSku = baseSku;
    let counter = 1;
    while (await this.productRepository.findOne({ sellerId, sku: finalSku, deletedAt: null })) {
      finalSku = `${baseSku}-${counter}`;
      counter++;
    }

    const product = await this.productRepository.create({
      ...data,
      sku: finalSku,
      sellerId,
      status: initialStatus,
      masterStatus: initialStatus,
      commerceFlows: flows.length ? flows : ['standard'],
    });

    eventBus.publish('product.created', { productId: product._id, sellerId });
    return product;
  }

  async update(sellerId, productId, data) {
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

    return this.productRepository.updateById(productId, data);
  }

  async delete(sellerId, productId) {
    const product = await this.productRepository.findOne({ _id: productId, sellerId, deletedAt: null });
    if (!product) throw AppError.notFound('Product not found');
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
      tags: product.tags,
      commerceFlows: product.commerceFlows,
      brand: product.brand,
      attributes: product.attributes,
    });
    return copy;
  }

  async updateStatus(sellerId, productId, status) {
    const product = await this.productRepository.findOne({ _id: productId, sellerId, deletedAt: null });
    if (!product) throw AppError.notFound('Product not found');
    assertSellerResource(product.sellerId, sellerId);
    return this.productRepository.updateStatus(productId, status);
  }
}

module.exports = { SellerProductService };
