const { BaseService } = require('../../core/BaseService');
const { parsePagination, buildPaginationMeta } = require('../../utils/pagination');

class EarningsService extends BaseService {
  constructor({
    sellerEarningRepository,
    sellerSettlementRepository,
    sellerRepository,
    commissionService,
  }) {
    super();
    this.sellerEarningRepository = sellerEarningRepository;
    this.sellerSettlementRepository = sellerSettlementRepository;
    this.sellerRepository = sellerRepository;
    this.commissionService = commissionService;
  }

  async getSummary(sellerId) {
    const [totalEarnings, seller, recent] = await Promise.all([
      this.sellerEarningRepository.sumNetBySeller(sellerId),
      this.sellerRepository.findById(sellerId),
      this.sellerEarningRepository.findBySeller(sellerId, { limit: 5 }),
    ]);

    return {
      balance: seller?.balance || 0,
      totalEarnings,
      recentTransactions: recent,
    };
  }

  async listTransactions(sellerId, query = {}) {
    const pagination = parsePagination(query);
    const items = await this.sellerEarningRepository.findBySeller(sellerId, {
      skip: pagination.skip,
      limit: pagination.limit,
    });
    const total = items.length;
    return { items, meta: buildPaginationMeta(pagination.page, pagination.limit, total) };
  }

  async listSettlements(sellerId) {
    return this.sellerSettlementRepository.findBySeller(sellerId);
  }

  async recordOrderEarning({ sellerId, orderId, orderItemId, grossAmount }) {
    const { commission, netAmount } = this.commissionService.calculateCommission(grossAmount);
    const earning = await this.sellerEarningRepository.create({
      sellerId,
      orderId,
      orderItemId,
      grossAmount,
      commission,
      netAmount,
      type: 'order',
    });

    await this.sellerRepository.model.updateOne({ _id: sellerId }, { $inc: { balance: netAmount } });

    return earning;
  }
}

module.exports = { EarningsService };
