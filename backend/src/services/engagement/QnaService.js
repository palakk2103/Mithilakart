const { BaseService } = require('../../core/BaseService');
const { AppError } = require('../../utils/AppError');
const { QNA_STATUS } = require('../../constants/engagement');
const { parsePagination, buildPaginationMeta } = require('../../utils/pagination');

class QnaService extends BaseService {
  constructor({ productQnaRepository, productRepository }) {
    super();
    this.productQnaRepository = productQnaRepository;
    this.productRepository = productRepository;
  }

  async ask(userId, productId, question) {
    const product = await this.productRepository.findPublicById(productId);
    if (!product) throw AppError.notFound('Product not found');

    return this.productQnaRepository.create({
      productId,
      userId,
      sellerId: product.sellerId,
      question,
      status: QNA_STATUS.PENDING,
    });
  }

  async listByProduct(productId, query = {}) {
    const page = Number(query.page) || 1;
    const limit = Math.min(Number(query.limit) || 20, 100);
    const skip = (page - 1) * limit;

    const items = await this.productQnaRepository.findByProduct(productId, {
      sort: '-createdAt',
      skip,
      limit,
    });

    return { items, page, limit };
  }

  async listByUser(userId, query = {}) {
    const page = Number(query.page) || 1;
    const limit = Math.min(Number(query.limit) || 20, 100);
    const skip = (page - 1) * limit;

    const items = await this.productQnaRepository.findByUser(userId, { sort: '-createdAt', skip, limit });
    return { items, page, limit };
  }

  async answer(questionId, answeredBy, answeredById, answer) {
    const qna = await this.productQnaRepository.findById(questionId);
    if (!qna) throw AppError.notFound('Question not found');

    if (answeredBy === 'seller' && String(qna.sellerId) !== String(answeredById)) {
      throw AppError.forbidden('Cannot answer this question');
    }

    return this.productQnaRepository.updateById(questionId, {
      answer,
      answeredBy,
      answeredById,
      answeredAt: new Date(),
      status: QNA_STATUS.ANSWERED,
    });
  }

  async listForAdmin(query = {}) {
    const pagination = parsePagination(query);
    const filter = { deletedAt: null };
    if (query.status) filter.status = query.status;

    const [items, total] = await Promise.all([
      this.productQnaRepository.find(filter, {
        sort: '-createdAt',
        skip: pagination.skip,
        limit: pagination.limit,
      }),
      this.productQnaRepository.count(filter),
    ]);

    const productIds = [...new Set(items.map((q) => String(q.productId)))];
    const products = productIds.length
      ? await this.productRepository.find({ _id: { $in: productIds } })
      : [];
    const productMap = new Map(products.map((p) => [String(p._id), p]));

    const enriched = items.map((qna) => {
      const product = productMap.get(String(qna.productId));
      return {
        ...qna.toObject?.() || qna,
        productName: product?.title || product?.name || 'Product',
      };
    });

    return { items: enriched, meta: buildPaginationMeta(pagination.page, pagination.limit, total) };
  }

  async listBySeller(sellerId, query = {}) {
    const pagination = parsePagination(query);
    const filter = { sellerId, deletedAt: null };
    if (query.status) filter.status = query.status;

    const [items, total] = await Promise.all([
      this.productQnaRepository.find(filter, {
        sort: '-createdAt',
        skip: pagination.skip,
        limit: pagination.limit,
      }),
      this.productQnaRepository.count(filter),
    ]);

    return { items, meta: buildPaginationMeta(pagination.page, pagination.limit, total) };
  }

  async moderateQuestion(questionId, action, adminId) {
    const qna = await this.productQnaRepository.findById(questionId);
    if (!qna) throw AppError.notFound('Question not found');

    if (action === 'hide') {
      return this.productQnaRepository.updateById(questionId, {
        status: QNA_STATUS.HIDDEN,
        moderatedBy: adminId,
        moderatedAt: new Date(),
      });
    }

    throw AppError.validation('Invalid moderation action');
  }
}

module.exports = { QnaService };
