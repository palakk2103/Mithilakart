const { BaseService } = require('../../core/BaseService');
const { AppError } = require('../../utils/AppError');
const { QNA_STATUS } = require('../../constants/engagement');

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
}

module.exports = { QnaService };
