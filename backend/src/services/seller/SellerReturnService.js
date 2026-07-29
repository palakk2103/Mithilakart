const { BaseService } = require('../../core/BaseService');
const { AppError } = require('../../utils/AppError');
const { RETURN_STATUS } = require('../../constants/pricing');
const { parsePagination, buildPaginationMeta } = require('../../utils/pagination');

class SellerReturnService extends BaseService {
  constructor({ returnRepository }) {
    super();
    this.returnRepository = returnRepository;
  }

  async list(sellerId, query = {}) {
    const pagination = parsePagination(query);
    const filter = query.status ? { status: query.status } : {};

    const [items, total] = await Promise.all([
      this.returnRepository.findBySeller(sellerId, filter, {
        skip: pagination.skip,
        limit: pagination.limit,
        sort: '-createdAt',
      }),
      this.returnRepository.countBySeller(sellerId, filter),
    ]);

    return { items, meta: buildPaginationMeta(pagination.page, pagination.limit, total) };
  }

  async approve(sellerId, returnId, note = null) {
    const ret = await this.returnRepository.findOne({ _id: returnId, sellerId, deletedAt: null });
    if (!ret) throw AppError.notFound('Return not found');
    if (ret.status !== RETURN_STATUS.REQUESTED) {
      throw AppError.conflict('Return cannot be approved in current status');
    }

    return this.returnRepository.updateById(returnId, {
      status: RETURN_STATUS.SELLER_APPROVED,
      sellerNote: note,
    });
  }

  async reject(sellerId, returnId, note = null) {
    const ret = await this.returnRepository.findOne({ _id: returnId, sellerId, deletedAt: null });
    if (!ret) throw AppError.notFound('Return not found');
    if (ret.status !== RETURN_STATUS.REQUESTED) {
      throw AppError.conflict('Return cannot be rejected in current status');
    }

    return this.returnRepository.updateById(returnId, {
      status: RETURN_STATUS.SELLER_REJECTED,
      sellerNote: note,
    });
  }
}

module.exports = { SellerReturnService };
