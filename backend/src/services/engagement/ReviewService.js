const { BaseService } = require('../../core/BaseService');
const { AppError } = require('../../utils/AppError');
const { parsePagination, buildPaginationMeta } = require('../../utils/pagination');
const { ORDER_STATUS } = require('../../constants/commerce');
const { MAX_REVIEWS_PER_DAY, REVIEW_STATUS } = require('../../constants/engagement');

class ReviewService extends BaseService {
  constructor({
    reviewRepository,
    orderRepository,
    orderItemRepository,
    productRepository,
  }) {
    super();
    this.reviewRepository = reviewRepository;
    this.orderRepository = orderRepository;
    this.orderItemRepository = orderItemRepository;
    this.productRepository = productRepository;
  }

  async create(userId, productId, payload) {
    const todayCount = await this.reviewRepository.countByUserToday(userId);
    if (todayCount >= MAX_REVIEWS_PER_DAY) {
      throw AppError.rateLimited('Daily review limit reached');
    }

    const product = await this.productRepository.findPublicById(productId);
    if (!product) throw AppError.notFound('Product not found');

    const order = await this.orderRepository.findOne({
      _id: payload.orderId,
      userId,
      status: ORDER_STATUS.DELIVERED,
    });
    if (!order) throw AppError.forbidden('Verified purchase required to review');

    const orderItem = await this.orderItemRepository.findOne({
      orderId: order._id,
      productId,
      userId,
      deletedAt: null,
    });
    if (!orderItem) throw AppError.forbidden('Product not found in delivered order');

    const existing = await this.reviewRepository.findOne({
      productId,
      userId,
      orderId: order._id,
      deletedAt: null,
    });
    if (existing) throw AppError.conflict('Review already submitted for this order');

    return this.reviewRepository.create({
      productId,
      userId,
      orderId: order._id,
      sellerId: orderItem.sellerId,
      rating: payload.rating,
      title: payload.title || null,
      body: payload.body,
      images: payload.images || [],
      videos: payload.videos || [],
      isVerifiedPurchase: true,
      status: REVIEW_STATUS.PENDING,
    });
  }

  async listByProduct(productId, query = {}) {
    const page = Number(query.page) || 1;
    const limit = Math.min(Number(query.limit) || 20, 100);
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      this.reviewRepository.findByProduct(productId, {}, { sort: '-createdAt', skip, limit }),
      this.reviewRepository.countByProduct(productId),
    ]);

    return { items, total, page, limit };
  }

  async listByUser(userId, query = {}) {
    const page = Number(query.page) || 1;
    const limit = Math.min(Number(query.limit) || 20, 100);
    const skip = (page - 1) * limit;

    const items = await this.reviewRepository.findByUser(userId, { sort: '-createdAt', skip, limit });
    return { items, page, limit };
  }

  async listBySeller(sellerId, query = {}) {
    const pagination = parsePagination(query);
    const filter = query.status ? { status: query.status } : {};

    const [items, total] = await Promise.all([
      this.reviewRepository.findBySeller(sellerId, filter, {
        sort: '-createdAt',
        skip: pagination.skip,
        limit: pagination.limit,
      }),
      this.reviewRepository.count({ sellerId, deletedAt: null, ...filter }),
    ]);

    return { items, meta: buildPaginationMeta(pagination.page, pagination.limit, total) };
  }

  async reply(sellerId, reviewId, reply) {
    const review = await this.reviewRepository.findOne({ _id: reviewId, sellerId, deletedAt: null });
    if (!review) throw AppError.notFound('Review not found');

    return this.reviewRepository.updateById(reviewId, {
      sellerReply: reply,
      sellerRepliedAt: new Date(),
    });
  }

  async report(sellerId, reviewId, reason) {
    const review = await this.reviewRepository.findOne({ _id: reviewId, sellerId, deletedAt: null });
    if (!review) throw AppError.notFound('Review not found');

    return this.reviewRepository.updateById(reviewId, {
      reportedAt: new Date(),
      reportReason: reason || null,
    });
  }

  async listForAdmin(query = {}) {
    const pagination = parsePagination(query);
    const filter = { deletedAt: null };
    if (query.status) filter.status = query.status;

    const [items, total] = await Promise.all([
      this.reviewRepository.find(filter, {
        sort: '-createdAt',
        skip: pagination.skip,
        limit: pagination.limit,
      }),
      this.reviewRepository.count(filter),
    ]);

    const productIds = [...new Set(items.map((r) => String(r.productId)))];
    const products = productIds.length
      ? await this.productRepository.find({ _id: { $in: productIds } })
      : [];
    const productMap = new Map(products.map((p) => [String(p._id), p]));

    const enriched = items.map((review) => {
      const product = productMap.get(String(review.productId));
      return {
        ...review.toObject?.() || review,
        productName: product?.title || product?.name || 'Product',
      };
    });

    return { items: enriched, meta: buildPaginationMeta(pagination.page, pagination.limit, total) };
  }

  async moderateReview(reviewId, action, adminId, note = null) {
    const review = await this.reviewRepository.findById(reviewId);
    if (!review) throw AppError.notFound('Review not found');

    const statusMap = {
      approve: REVIEW_STATUS.APPROVED,
      reject: REVIEW_STATUS.REJECTED,
      hide: REVIEW_STATUS.HIDDEN,
    };
    const status = statusMap[action];
    if (!status) throw AppError.validation('Invalid moderation action');

    return this.reviewRepository.updateById(reviewId, {
      status,
      moderatedBy: adminId,
      moderatedAt: new Date(),
      moderationNote: note,
    });
  }
}

module.exports = { ReviewService };
