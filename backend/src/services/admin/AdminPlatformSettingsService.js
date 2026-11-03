const { BaseService } = require('../../core/BaseService');
const { AppError } = require('../../utils/AppError');
const { YOU_POPUP_SETTING_KEY, YOU_POPUP_LABEL_MAX, YOU_POPUP_ITEMS } = require('../../constants/youPopup');
const { mergeYouPopupItems } = require('../platform/youPopupMerge');

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

  async getYouPopup() {
    const setting = await this.platformSettingRepository.findByKey(YOU_POPUP_SETTING_KEY);
    return { key: 'customer_you_popup', items: mergeYouPopupItems(setting?.value) };
  }

  /**
   * Strictly validates the payload: every registry ID exactly once, no unknown
   * IDs, trimmed bounded labels, boolean enabled and unique integer orders.
   * Routes are never accepted from the client.
   */
  async updateYouPopup(items, adminId) {
    if (!Array.isArray(items)) throw AppError.validation('items must be an array');
    const allowed = new Map(YOU_POPUP_ITEMS.map((i) => [i.id, i]));
    if (items.length !== allowed.size) {
      throw AppError.validation(`items must contain exactly ${allowed.size} entries`);
    }
    const seen = new Set();
    const orders = new Set();
    const clean = items.map((raw) => {
      if (!raw || typeof raw !== 'object') throw AppError.validation('Invalid item');
      const { id } = raw;
      if (typeof id !== 'string' || !allowed.has(id)) {
        throw AppError.validation(`Unknown menu item id: ${String(id).slice(0, 40)}`);
      }
      if (seen.has(id)) throw AppError.validation(`Duplicate menu item: ${id}`);
      seen.add(id);
      if (typeof raw.enabled !== 'boolean') throw AppError.validation(`enabled must be boolean for ${id}`);
      const label = typeof raw.label === 'string' ? raw.label.trim().replace(/\s+/g, ' ') : '';
      if (!label || label.length > YOU_POPUP_LABEL_MAX) {
        throw AppError.validation(`label for ${id} must be 1-${YOU_POPUP_LABEL_MAX} characters`);
      }
      if (/[<>]/.test(label)) throw AppError.validation(`label for ${id} contains invalid characters`);
      const { order } = raw;
      if (!Number.isInteger(order) || order < 1 || order > 100) {
        throw AppError.validation(`order for ${id} must be an integer 1-100`);
      }
      if (orders.has(order)) throw AppError.validation('Display order values must be unique');
      orders.add(order);
      return { id, label, enabled: raw.enabled, order };
    });

    const existing = await this.platformSettingRepository.findByKey(YOU_POPUP_SETTING_KEY);
    if (existing) {
      await this.platformSettingRepository.updateById(existing._id, { value: clean, updatedBy: adminId });
    } else {
      await this.platformSettingRepository.create({ key: YOU_POPUP_SETTING_KEY, value: clean, updatedBy: adminId });
    }
    if (this.platformConfigService) await this.platformConfigService.invalidateCache();
    return { key: 'customer_you_popup', items: mergeYouPopupItems(clean) };
  }
}

module.exports = { AdminPlatformSettingsService };
