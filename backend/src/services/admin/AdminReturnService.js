const { BaseService } = require('../../core/BaseService');
const { AppError } = require('../../utils/AppError');
const { parsePagination, buildPaginationMeta } = require('../../utils/pagination');
const { RETURN_STATUS } = require('../../constants/pricing');

class AdminReturnService extends BaseService {
  constructor({ returnRepository }) {
    super();
    this.returnRepository = returnRepository;
  }

  async list(query = {}) {
    const pagination = parsePagination(query);
    const filter = query.status ? { status: query.status } : {};

    const [items, total] = await Promise.all([
      this.returnRepository.find({ deletedAt: null, ...filter }, {
        sort: '-createdAt',
        skip: pagination.skip,
        limit: pagination.limit,
      }),
      this.returnRepository.count({ deletedAt: null, ...filter }),
    ]);

    return { items, meta: buildPaginationMeta(pagination.page, pagination.limit, total) };
  }

  async getById(id) {
    const ret = await this.returnRepository.findById(id);
    if (!ret) throw AppError.notFound('Return not found');
    return ret;
  }

  async approve(id, adminId, note = null) {
    const ret = await this.returnRepository.findById(id);
    if (!ret) throw AppError.notFound('Return not found');

    if (![RETURN_STATUS.REQUESTED, RETURN_STATUS.SELLER_APPROVED].includes(ret.status)) {
      throw AppError.conflict('Return cannot be approved in current status');
    }

    return this.returnRepository.updateById(id, {
      status: RETURN_STATUS.ADMIN_APPROVED,
      adminNote: note,
    });
  }

  async reject(id, adminId, note = null) {
    const ret = await this.returnRepository.findById(id);
    if (!ret) throw AppError.notFound('Return not found');

    if ([RETURN_STATUS.REFUNDED, RETURN_STATUS.ADMIN_REJECTED].includes(ret.status)) {
      throw AppError.conflict('Return cannot be rejected in current status');
    }

    return this.returnRepository.updateById(id, {
      status: RETURN_STATUS.ADMIN_REJECTED,
      adminNote: note,
    });
  }
}

module.exports = { AdminReturnService };
