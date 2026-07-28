const { BaseService } = require('../../core/BaseService');
const { AppError } = require('../../utils/AppError');

class AdminFinanceService extends BaseService {
  constructor({
    commissionRuleRepository,
    taxConfigRepository,
    deliveryChargeRuleRepository,
    sellerEarningRepository,
    sellerPayoutRepository,
    platformConfigService = null,
  }) {
    super();
    this.commissionRuleRepository = commissionRuleRepository;
    this.taxConfigRepository = taxConfigRepository;
    this.deliveryChargeRuleRepository = deliveryChargeRuleRepository;
    this.sellerEarningRepository = sellerEarningRepository;
    this.sellerPayoutRepository = sellerPayoutRepository;
    this.platformConfigService = platformConfigService;
  }

  async _invalidatePricingCache() {
    if (this.platformConfigService) {
      await this.platformConfigService.invalidateCache();
    }
  }

  async listCommissionRules() {
    return this.commissionRuleRepository.find({ deletedAt: null });
  }

  async createCommissionRule(data) {
    const rule = await this.commissionRuleRepository.create(data);
    await this._invalidatePricingCache();
    return rule;
  }

  async updateCommissionRule(id, data) {
    const rule = await this.commissionRuleRepository.findById(id);
    if (!rule) throw AppError.notFound('Commission rule not found');
    const updated = await this.commissionRuleRepository.updateById(id, data);
    await this._invalidatePricingCache();
    return updated;
  }

  async deleteCommissionRule(id) {
    const result = await this.commissionRuleRepository.updateById(id, { deletedAt: new Date() });
    await this._invalidatePricingCache();
    return result;
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
    const rule = await this.deliveryChargeRuleRepository.create(data);
    await this._invalidatePricingCache();
    return rule;
  }

  async updateDeliveryChargeRule(id, data) {
    const updated = await this.deliveryChargeRuleRepository.updateById(id, data);
    await this._invalidatePricingCache();
    return updated;
  }

  async deleteDeliveryChargeRule(id) {
    const result = await this.deliveryChargeRuleRepository.updateById(id, { deletedAt: new Date(), isActive: false });
    await this._invalidatePricingCache();
    return result;
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
