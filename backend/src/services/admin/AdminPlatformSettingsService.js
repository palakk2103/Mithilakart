const { BaseService } = require('../../core/BaseService');
const { AppError } = require('../../utils/AppError');

class AdminPlatformSettingsService extends BaseService {
  constructor({ platformSettingRepository, commissionRuleRepository }) {
    super();
    this.platformSettingRepository = platformSettingRepository;
    this.commissionRuleRepository = commissionRuleRepository;
  }

  async getSettings() {
    const settings = await this.platformSettingRepository.find({ deletedAt: null });
    const map = {};
    for (const s of settings) map[s.key] = s.value;

    const defaultCommission = await this.commissionRuleRepository.findDefault();
    return {
      settings: map,
      commission: defaultCommission ? { rate: defaultCommission.rate, name: defaultCommission.name } : null,
    };
  }

  async updateSettings(updates, adminId) {
    const results = [];
    for (const [key, value] of Object.entries(updates)) {
      const existing = await this.platformSettingRepository.findByKey(key);
      if (existing) {
        results.push(await this.platformSettingRepository.updateById(existing._id, { value, updatedBy: adminId }));
      } else {
        results.push(await this.platformSettingRepository.create({ key, value, updatedBy: adminId }));
      }
    }
    return results;
  }

  async updateCommission(rate, adminId) {
    if (rate < 0 || rate > 1) throw AppError.validation('Commission rate must be between 0 and 1');

    let rule = await this.commissionRuleRepository.findDefault();
    if (rule) {
      return this.commissionRuleRepository.updateById(rule._id, { rate, updatedBy: adminId });
    }

    return this.commissionRuleRepository.create({
      name: 'Default Platform Commission',
      rate,
      isDefault: true,
      isActive: true,
    });
  }
}

module.exports = { AdminPlatformSettingsService };
