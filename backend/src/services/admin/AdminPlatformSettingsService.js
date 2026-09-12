const { BaseService } = require('../../core/BaseService');
const { AppError } = require('../../utils/AppError');

class AdminPlatformSettingsService extends BaseService {
  constructor({ platformSettingRepository, commissionRuleRepository, platformConfigService = null }) {
    super();
    this.platformSettingRepository = platformSettingRepository;
    this.commissionRuleRepository = commissionRuleRepository;
    this.platformConfigService = platformConfigService;
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
    if (this.platformConfigService) {
      await this.platformConfigService.invalidateCache();
    }
    return results;
  }

  async updateCommission(rate, adminId) {
    if (rate < 0 || rate > 1) throw AppError.validation('Commission rate must be between 0 and 1');

    let rule = await this.commissionRuleRepository.findDefault();
    if (rule) {
      const updated = await this.commissionRuleRepository.updateById(rule._id, { rate, updatedBy: adminId });
      if (this.platformConfigService) await this.platformConfigService.invalidateCache();
      return updated;
    }

    const created = await this.commissionRuleRepository.create({
      name: 'Default Platform Commission',
      rate,
      isDefault: true,
      isActive: true,
    });
    if (this.platformConfigService) await this.platformConfigService.invalidateCache();
    return created;
  }

  async getHeaderTabs() {
    const setting = await this.platformSettingRepository.findByKey('headerTabsConfig');
    return setting?.value || null;
  }

  async updateHeaderTabs(tabs, adminId) {
    if (!Array.isArray(tabs)) {
      throw AppError.validation('Header tabs must be an array');
    }
    const existing = await this.platformSettingRepository.findByKey('headerTabsConfig');
    let result;
    if (existing) {
      result = await this.platformSettingRepository.updateById(existing._id, { value: tabs, updatedBy: adminId });
    } else {
      result = await this.platformSettingRepository.create({ key: 'headerTabsConfig', value: tabs, updatedBy: adminId });
    }
    if (this.platformConfigService) {
      await this.platformConfigService.invalidateCache();
    }
    return result;
  }
}

module.exports = { AdminPlatformSettingsService };
