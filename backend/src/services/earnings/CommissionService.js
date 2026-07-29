const { BaseService } = require('../../core/BaseService');
const { PRICING } = require('../../constants/pricing');

class CommissionService extends BaseService {
  calculateCommission(grossAmount, rate = PRICING.DEFAULT_COMMISSION_RATE) {
    const commission = Math.round(grossAmount * rate * 100) / 100;
    const netAmount = Math.round((grossAmount - commission) * 100) / 100;
    return { commission, netAmount, rate };
  }
}

module.exports = { CommissionService };
