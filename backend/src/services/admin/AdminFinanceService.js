const { BaseService } = require('../../core/BaseService');
const { AppError } = require('../../utils/AppError');

class AdminFinanceService extends BaseService {
  constructor({
    commissionRuleRepository,
    taxConfigRepository,
    deliveryChargeRuleRepository,
    sellerEarningRepository,
    sellerPayoutRepository,
  }) {
    super();
    this.commissionRuleRepository = commissionRuleRepository;
    this.taxConfigRepository = taxConfigRepository;
    this.deliveryChargeRuleRepository = deliveryChargeRuleRepository;
    this.sellerEarningRepository = sellerEarningRepository;
    this.sellerPayoutRepository = sellerPayoutRepository;
  }

  async listCommissionRules() {
    return this.commissionRuleRepository.find({ deletedAt: null });
  }

  async createCommissionRule(data) {
    return this.commissionRuleRepository.create(data);
  }

  async updateCommissionRule(id, data) {
    const rule = await this.commissionRuleRepository.findById(id);
    if (!rule) throw AppError.notFound('Commission rule not found');
    return this.commissionRuleRepository.updateById(id, data);
  }

  async deleteCommissionRule(id) {
    return this.commissionRuleRepository.updateById(id, { deletedAt: new Date() });
  }

  async listTaxConfigs() {
    return this.taxConfigRepository.findActive();
  }

  async createTaxConfig(data) {
    return this.taxConfigRepository.create(data);
  }

  async updateTaxConfig(id, data) {
    return this.taxConfigRepository.updateById(id, data);
  }

  async deleteTaxConfig(id) {
    return this.taxConfigRepository.updateById(id, { deletedAt: new Date(), isActive: false });
  }

  async listDeliveryChargeRules() {
    return this.deliveryChargeRuleRepository.findActive();
  }

  async createDeliveryChargeRule(data) {
    return this.deliveryChargeRuleRepository.create(data);
  }

  async updateDeliveryChargeRule(id, data) {
    return this.deliveryChargeRuleRepository.updateById(id, data);
  }

  async deleteDeliveryChargeRule(id) {
    return this.deliveryChargeRuleRepository.updateById(id, { deletedAt: new Date(), isActive: false });
  }

  async getPlatformEarnings() {
    const result = await this.sellerEarningRepository.model.aggregate([
      { $match: { deletedAt: null } },
      { $group: { _id: null, gross: { $sum: '$grossAmount' }, net: { $sum: '$netAmount' }, commission: { $sum: '$commission' } } },
    ]);
    const payouts = await this.sellerPayoutRepository.count({ deletedAt: null });
    return { ...(result[0] || { gross: 0, net: 0, commission: 0 }), payoutCount: payouts };
  }

  async listPayouts(query = {}) {
    const page = Number(query.page) || 1;
    const limit = Math.min(Number(query.limit) || 20, 100);
    const skip = (page - 1) * limit;
    const filter = { deletedAt: null };
    if (query.status) filter.status = query.status;

    const [items, total] = await Promise.all([
      this.sellerPayoutRepository.model.find(filter)
        .populate('sellerId', 'name storeName email')
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 })
        .exec(),
      this.sellerPayoutRepository.count(filter),
    ]);

    return {
      items: items.map((p) => ({
        id: p._id,
        vendor: p.sellerId?.storeName || p.sellerId?.name || 'Unknown',
        vendorId: p.sellerId?._id,
        amount: p.amount,
        status: p.status,
        date: p.createdAt,
        method: p.bankSnapshot?.method || 'Bank Transfer',
        bank: p.bankSnapshot?.bankName || p.bankSnapshot?.bank || '—',
        rejectionReason: p.rejectionReason,
      })),
      total,
      page,
      limit,
    };
  }

  async updatePayoutStatus(id, { status, rejectionReason = null }) {
    const payout = await this.sellerPayoutRepository.findById(id);
    if (!payout) throw AppError.notFound('Payout not found');

    return this.sellerPayoutRepository.updateById(id, {
      status,
      rejectionReason,
      processedAt: ['completed', 'rejected'].includes(status) ? new Date() : null,
    });
  }
}

module.exports = { AdminFinanceService };
