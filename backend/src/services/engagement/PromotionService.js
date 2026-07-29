const { BaseService } = require('../../core/BaseService');
const { AppError } = require('../../utils/AppError');

class PromotionService extends BaseService {
  constructor({
    flashSaleRepository,
    flashSaleProductRepository,
    featuredProductRepository,
    productRepository,
    couponRepository,
  }) {
    super();
    this.flashSaleRepository = flashSaleRepository;
    this.flashSaleProductRepository = flashSaleProductRepository;
    this.featuredProductRepository = featuredProductRepository;
    this.productRepository = productRepository;
    this.couponRepository = couponRepository;
  }

  async getDeals() {
    const now = new Date();
    const flashSales = await this.flashSaleRepository.findActive(now);
    const deals = [];

    for (const sale of flashSales) {
      const products = await this.flashSaleProductRepository.findByFlashSale(sale._id);
      deals.push({
        type: 'flash_sale',
        sale,
        products,
      });
    }

    return deals;
  }

  async getOffers() {
    const [featured, platformCoupons] = await Promise.all([
      this.featuredProductRepository.findActive({ limit: 20 }),
      this.couponRepository.find({
        scope: 'platform',
        isActive: true,
        deletedAt: null,
        $or: [{ expiresAt: null }, { expiresAt: { $gte: new Date() } }],
      }, { limit: 20 }),
    ]);

    const productIds = featured.map((f) => f.productId);
    const products = productIds.length
      ? await this.productRepository.find({ _id: { $in: productIds }, deletedAt: null })
      : [];

    return {
      featuredProducts: products,
      coupons: platformCoupons,
    };
  }

  async getFlashSalePrice(productId) {
    const rows = await this.flashSaleProductRepository.findActiveForProduct(productId);
    if (!rows.length) return null;
    return rows[0].salePrice;
  }

  async createFlashSale(data) {
    return this.flashSaleRepository.create(data);
  }

  async addFlashSaleProduct(flashSaleId, productId, salePrice) {
    const sale = await this.flashSaleRepository.findById(flashSaleId);
    if (!sale) throw AppError.notFound('Flash sale not found');

    const product = await this.productRepository.findPublicById(productId);
    if (!product) throw AppError.notFound('Product not found');

    return this.flashSaleProductRepository.create({ flashSaleId, productId, salePrice });
  }

  async setFeaturedProduct(productId, sortOrder = 0) {
    const product = await this.productRepository.findPublicById(productId);
    if (!product) throw AppError.notFound('Product not found');

    const existing = await this.featuredProductRepository.findOne({ productId, deletedAt: null });
    if (existing) {
      return this.featuredProductRepository.updateById(existing._id, { isActive: true, sortOrder });
    }

    return this.featuredProductRepository.create({ productId, sortOrder, isActive: true });
  }
}

module.exports = { PromotionService };
