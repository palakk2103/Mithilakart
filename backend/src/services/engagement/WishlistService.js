const { BaseService } = require('../../core/BaseService');
const { AppError } = require('../../utils/AppError');
const { MAX_WISHLIST_ITEMS } = require('../../constants/engagement');

class WishlistService extends BaseService {
  constructor({ wishlistRepository, productRepository }) {
    super();
    this.wishlistRepository = wishlistRepository;
    this.productRepository = productRepository;
  }

  async list(userId, query = {}) {
    const page = Number(query.page) || 1;
    const limit = Math.min(Number(query.limit) || 20, 100);
    const skip = (page - 1) * limit;

    const entries = await this.wishlistRepository.findByUser(userId, { sort: '-createdAt', skip, limit });
    const productIds = entries.map((e) => e.productId);
    const products = productIds.length
      ? await this.productRepository.find({ _id: { $in: productIds }, deletedAt: null })
      : [];

    return { items: products, page, limit };
  }

  async add(userId, productId) {
    const product = await this.productRepository.findPublicById(productId);
    if (!product) throw AppError.notFound('Product not found');

    // The request may carry a sku/catalogKey (cart lines can store one), so
    // always query the wishlist by the resolved product _id.
    const existing = await this.wishlistRepository.findEntry(userId, product._id);
    if (existing) return existing;

    const count = await this.wishlistRepository.countByUser(userId);
    if (count >= MAX_WISHLIST_ITEMS) {
      throw AppError.conflict(`Wishlist limit of ${MAX_WISHLIST_ITEMS} items reached`);
    }

    // Use the resolved product's _id (the request may have sent a sku/catalogKey)
    return this.wishlistRepository.upsertActive(userId, product._id);
  }

  async remove(userId, productId) {
    const product = await this.productRepository.findPublicById(productId);
    const resolvedId = product ? product._id : productId;
    if (!require('mongoose').Types.ObjectId.isValid(resolvedId)) return { removed: true };
    const entry = await this.wishlistRepository.findEntry(userId, resolvedId);
    if (!entry) return { removed: true }; // already gone: idempotent
    await this.wishlistRepository.softDelete(userId, resolvedId);
    return { removed: true };
  }
}

module.exports = { WishlistService };
