const { BaseService } = require('../../core/BaseService');
const { parsePagination, buildPaginationMeta } = require('../../utils/pagination');

class DeliveryEarningsService extends BaseService {
  constructor({ deliveryEarningRepository }) {
    super();
    this.deliveryEarningRepository = deliveryEarningRepository;
  }

  async list(partnerId, query = {}) {
    const pagination = parsePagination(query);
    const [items, total] = await Promise.all([
      this.deliveryEarningRepository.findByPartner(partnerId, {
        sort: '-createdAt',
        skip: pagination.skip,
        limit: pagination.limit,
      }),
      this.deliveryEarningRepository.count({ partnerId, deletedAt: null }),
    ]);

    const totalEarnings = await this.deliveryEarningRepository.sumByPartner(partnerId, { status: 'credited' });

    return {
      items,
      totalEarnings,
      meta: buildPaginationMeta(pagination.page, pagination.limit, total),
    };
  }
}

module.exports = { DeliveryEarningsService };
