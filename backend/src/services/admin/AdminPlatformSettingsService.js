const { BaseService } = require('../../core/BaseService');
const { AppError } = require('../../utils/AppError');
const { YOU_POPUP_SETTING_KEY, YOU_POPUP_LABEL_MAX, YOU_POPUP_ITEMS } = require('../../constants/youPopup');
const { mergeYouPopupItems } = require('../platform/youPopupMerge');
const { HELP_CENTER_SETTING_KEY } = require('../../constants/helpCenter');
const { validateHelpCenter, resolveHelpCenter } = require('../platform/helpCenterContent');

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
    const { DEFAULT_CART_RAILS, DEFAULT_CHECKOUT_CONTENT } = require('../../constants/checkoutContent');
    const { DEFAULT_CART_DESIGN } = require('../../constants/cartDesign');
    return {
      settings: map,
      // What the storefront uses until an admin saves their own (single source of truth).
      defaults: { cartRails: DEFAULT_CART_RAILS, checkoutContent: DEFAULT_CHECKOUT_CONTENT, cartDesign: DEFAULT_CART_DESIGN },
      commission: defaultCommission ? { rate: defaultCommission.rate, name: defaultCommission.name } : null,
    };
  }

  /**
   * Checkout fees, purchase limits and package rules are read straight into customers'
   * bills, so a malformed value must never reach the store (a string fee would turn every
   * total into NaN). Only the keys below are checked; all other settings keep their
   * existing behaviour.
   */
  _validateCheckoutSettings(updates) {
    const num = (key, { min = 0, max = 10000000, integer = false } = {}) => {
      if (updates[key] === undefined) return;
      const v = updates[key];
      if (typeof v !== 'number' || !Number.isFinite(v) || v < min || v > max || (integer && !Number.isInteger(v))) {
        throw AppError.validation(`${key} must be ${integer ? 'a whole ' : 'a '}number between ${min} and ${max}`);
      }
    };
    ['handlingFee', 'defaultDeliveryCharge', 'freeShippingThreshold', 'platformFee', 'packagingFee', 'minOrderAmount', 'codHandlingFee'].forEach((k) => num(k));
    num('maxQuantityPerItem', { max: 1000, integer: true });
    num('maxCartItems', { max: 1000, integer: true });
    num('packageMinPricePercent', { max: 100 });

    if (updates.loginRequired !== undefined && typeof updates.loginRequired !== 'boolean') {
      throw AppError.validation('loginRequired must be true or false');
    }
    if (updates.limitedQuantityMessage !== undefined) {
      const m = updates.limitedQuantityMessage;
      if (typeof m !== 'string' || !m.trim() || m.length > 160 || /[<>]/.test(m)) {
        throw AppError.validation('limitedQuantityMessage must be 1-160 characters without < or >');
      }
    }
    if (updates.surgeConfig !== undefined) this._validateSurgeConfig(updates.surgeConfig);
    if (updates.cartRails !== undefined) this._validateCartRails(updates.cartRails);
    if (updates.checkoutContent !== undefined) this._validateCheckoutContent(updates.checkoutContent);
    if (updates.cartDesign !== undefined) this._validateCartDesign(updates.cartDesign);
    if (updates.handlingFeeTiers !== undefined) {
      const tiers = updates.handlingFeeTiers;
      if (!Array.isArray(tiers) || tiers.length > 10) throw AppError.validation('handlingFeeTiers must be a list of at most 10 tiers');
      const seen = new Set();
      tiers.forEach((t) => {
        const ok = t && Number.isFinite(t.minSubtotal) && t.minSubtotal >= 0
          && Number.isFinite(t.discountPercent) && t.discountPercent >= 0 && t.discountPercent <= 100;
        if (!ok) throw AppError.validation('Each handling-fee tier needs minSubtotal >= 0 and discountPercent between 0 and 100');
        if (seen.has(t.minSubtotal)) throw AppError.validation('Two handling-fee tiers cannot start at the same order value');
        seen.add(t.minSubtotal);
      });
    }
  }

  /** Cart page design: colours must be #hex, numbers inside their range, sections known. */
  _validateCartDesign(d) {
    const { TABS, PAGE_SECTIONS, COLOR_TOKENS, NUMBER_TOKENS, SECTION_NUMBERS } = require('../../constants/cartDesign');
    const COLOR_RE = /^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i;
    if (!d || typeof d !== 'object' || Array.isArray(d)) throw AppError.validation('cartDesign must be an object');
    const tokens = (t, where) => {
      if (t === undefined) return;
      if (!t || typeof t !== 'object' || Array.isArray(t)) throw AppError.validation(`${where} must be an object`);
      COLOR_TOKENS.forEach((k) => {
        if (t[k] !== undefined && t[k] !== '' && t[k] !== null && !(typeof t[k] === 'string' && COLOR_RE.test(t[k]))) {
          throw AppError.validation(`${where}.${k} must be a colour like #1a7f37 (or empty to follow the tab theme)`);
        }
      });
      Object.entries(NUMBER_TOKENS).forEach(([k, [min, max]]) => {
        if (t[k] !== undefined && t[k] !== '' && t[k] !== null && (typeof t[k] !== 'number' || !Number.isFinite(t[k]) || t[k] < min || t[k] > max)) {
          throw AppError.validation(`${where}.${k} must be a number between ${min} and ${max}`);
        }
      });
      if (t.cardShadow !== undefined && typeof t.cardShadow !== 'boolean') throw AppError.validation(`${where}.cardShadow must be true or false`);
    };
    tokens(d.global, 'cartDesign.global');
    if (d.tabs !== undefined) {
      if (!d.tabs || typeof d.tabs !== 'object' || Array.isArray(d.tabs)) throw AppError.validation('cartDesign.tabs must be an object');
      Object.keys(d.tabs).forEach((tab) => {
        if (!TABS.includes(tab)) throw AppError.validation(`cartDesign.tabs has an unknown tab: ${tab}`);
        tokens(d.tabs[tab], `cartDesign.tabs.${tab}`);
      });
    }
    if (d.pages !== undefined) {
      if (!d.pages || typeof d.pages !== 'object' || Array.isArray(d.pages)) throw AppError.validation('cartDesign.pages must be an object');
      Object.entries(d.pages).forEach(([page, def]) => {
        if (!PAGE_SECTIONS[page]) throw AppError.validation(`cartDesign.pages has an unknown page: ${page}`);
        if (!def || !Array.isArray(def.sections) || def.sections.length > 20) throw AppError.validation(`cartDesign.pages.${page}.sections must be a list`);
        def.sections.forEach((s, i) => {
          const where = `cartDesign.pages.${page}.sections[${i}]`;
          if (!s || !PAGE_SECTIONS[page].includes(s.key)) throw AppError.validation(`${where}.key is not a section of the ${page} page`);
          if (s.enabled !== undefined && typeof s.enabled !== 'boolean') throw AppError.validation(`${where}.enabled must be true or false`);
          const st = s.style || {};
          ['bg', 'border'].forEach((k) => {
            if (st[k] !== undefined && st[k] !== '' && !(typeof st[k] === 'string' && COLOR_RE.test(st[k]))) throw AppError.validation(`${where}.style.${k} must be a colour like #ffffff`);
          });
          Object.entries(SECTION_NUMBERS).forEach(([k, [min, max]]) => {
            if (st[k] !== undefined && st[k] !== '' && st[k] !== null && (typeof st[k] !== 'number' || st[k] < min || st[k] > max)) throw AppError.validation(`${where}.style.${k} must be a number between ${min} and ${max}`);
          });
          if (st.title !== undefined && (typeof st.title !== 'string' || st.title.length > 60 || /[<>]/.test(st.title))) throw AppError.validation(`${where}.style.title must be up to 60 characters without < or >`);
        });
      });
    }
  }

  /** CART-1 rails: titles, order, on/off, sources and hand-picked products. */
  _validateCartRails(c) {
    const { CART_RAIL_SOURCES } = require('../../constants/checkoutContent');
    const text = (v) => typeof v === 'string' && v.trim().length > 0 && v.length <= 60 && !/[<>]/.test(v);
    const rail = (r, where) => {
      if (!r || typeof r !== 'object') throw AppError.validation(`${where} must be an object`);
      if (!/^[a-z0-9_]{1,40}$/.test(String(r.key))) throw AppError.validation(`${where}.key must be lowercase letters, digits or _`);
      if (!text(r.title)) throw AppError.validation(`${where}.title must be 1-60 characters without < or >`);
      if (r.enabled !== undefined && typeof r.enabled !== 'boolean') throw AppError.validation(`${where}.enabled must be true or false`);
      if (r.source !== undefined && !CART_RAIL_SOURCES.includes(r.source)) throw AppError.validation(`${where}.source is not a known source`);
      if (r.fallbackSource !== undefined && r.fallbackSource !== null && !CART_RAIL_SOURCES.includes(r.fallbackSource)) throw AppError.validation(`${where}.fallbackSource is not a known source`);
      if (r.productIds !== undefined && (!Array.isArray(r.productIds) || r.productIds.length > 50 || r.productIds.some((id) => !/^[a-f0-9]{24}$/i.test(String(id))))) {
        throw AppError.validation(`${where}.productIds must be up to 50 product ids`);
      }
      if (r.maxPrice !== undefined && (typeof r.maxPrice !== 'number' || r.maxPrice < 0 || r.maxPrice > 100000)) throw AppError.validation(`${where}.maxPrice must be a number`);
    };
    if (!c || typeof c !== 'object' || !Array.isArray(c.rails) || c.rails.length > 20) throw AppError.validation('cartRails.rails must be a list of at most 20 rails');
    if (c.itemsPerRail !== undefined && (!Number.isInteger(c.itemsPerRail) || c.itemsPerRail < 3 || c.itemsPerRail > 20)) throw AppError.validation('cartRails.itemsPerRail must be 3-20');
    c.rails.forEach((r, i) => {
      rail(r, `cartRails.rails[${i}]`);
      if (r.subTabs !== undefined) {
        if (!Array.isArray(r.subTabs) || r.subTabs.length > 10) throw AppError.validation(`cartRails.rails[${i}].subTabs must be at most 10 tabs`);
        r.subTabs.forEach((t, j) => rail(t, `cartRails.rails[${i}].subTabs[${j}]`));
      }
    });
  }

  /** CART-1/2/3 texts: cashback banner, offers, trust block, tip card, policy. */
  _validateCheckoutContent(c) {
    if (!c || typeof c !== 'object' || Array.isArray(c)) throw AppError.validation('checkoutContent must be an object');
    const strings = [];
    const walk = (v, path) => {
      if (typeof v === 'string') strings.push([v, path]);
      else if (Array.isArray(v)) v.forEach((x, i) => walk(x, `${path}[${i}]`));
      else if (v && typeof v === 'object') Object.entries(v).forEach(([k, x]) => walk(x, `${path}.${k}`));
    };
    walk(c, 'checkoutContent');
    strings.forEach(([s, path]) => {
      if (s.length > 300 || /[<>]/.test(s)) throw AppError.validation(`${path} must be up to 300 characters without < or >`);
    });
    if (c.policyPoints !== undefined && (!Array.isArray(c.policyPoints) || c.policyPoints.length > 10)) {
      throw AppError.validation('checkoutContent.policyPoints must be a list of at most 10 lines');
    }
    const rating = c.trust?.rating;
    if (rating !== undefined && rating !== null && (typeof rating !== 'number' || rating < 0 || rating > 5)) {
      throw AppError.validation('checkoutContent.trust.rating must be between 0 and 5');
    }
  }

  /** FEE-3 surge settings: amounts, tabs, IST time windows and customer texts. */
  _validateSurgeConfig(s) {
    if (!s || typeof s !== 'object' || Array.isArray(s)) throw AppError.validation('surgeConfig must be an object');
    const TABS = ['mithilakart', 'mithilak', 'quick_shop', 'groceries_fresh'];
    if (s.enabled !== undefined && typeof s.enabled !== 'boolean') throw AppError.validation('surgeConfig.enabled must be true or false');
    ['amount', 'threshold'].forEach((k) => {
      if (s[k] !== undefined && (typeof s[k] !== 'number' || !Number.isFinite(s[k]) || s[k] < 0 || s[k] > 100000)) {
        throw AppError.validation(`surgeConfig.${k} must be a number between 0 and 100000`);
      }
    });
    if (s.tabs !== undefined && (!Array.isArray(s.tabs) || s.tabs.some((t) => !TABS.includes(t)))) {
      throw AppError.validation(`surgeConfig.tabs must list tabs from: ${TABS.join(', ')}`);
    }
    if (s.windows !== undefined) {
      const hhmm = /^([01]?\d|2[0-3]):[0-5]\d$/;
      if (!Array.isArray(s.windows) || s.windows.length > 20) throw AppError.validation('surgeConfig.windows must be a list of at most 20 time windows');
      s.windows.forEach((w) => {
        const daysOk = w && (w.days === undefined || (Array.isArray(w.days) && w.days.every((d) => Number.isInteger(d) && d >= 0 && d <= 6)));
        if (!daysOk || !hhmm.test(String(w.start)) || !hhmm.test(String(w.end))) {
          throw AppError.validation('Each surge window needs start and end as HH:MM and days as numbers 0 (Sun) to 6 (Sat)');
        }
      });
    }
    ['bannerTitle', 'bannerText', 'billLabel', 'billNote'].forEach((k) => {
      if (s[k] !== undefined && (typeof s[k] !== 'string' || s[k].length > 200 || /[<>]/.test(s[k]))) {
        throw AppError.validation(`surgeConfig.${k} must be up to 200 characters without < or >`);
      }
    });
  }

  async updateSettings(updates, adminId) {
    this._validateCheckoutSettings(updates || {});
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

  async getTabThemes() {
    const setting = await this.platformSettingRepository.findByKey('tabThemes');
    return setting?.value || null;
  }

  /** null restores the app's built-in colours. Shape is validated by the route. */
  async updateTabThemes(themes, adminId) {
    const existing = await this.platformSettingRepository.findByKey('tabThemes');
    const result = existing
      ? await this.platformSettingRepository.updateById(existing._id, { value: themes, updatedBy: adminId })
      : await this.platformSettingRepository.create({ key: 'tabThemes', value: themes, updatedBy: adminId });
    if (this.platformConfigService) await this.platformConfigService.invalidateCache();
    return result?.value ?? null;
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

  async getHelpCenter() {
    const setting = await this.platformSettingRepository.findByKey(HELP_CENTER_SETTING_KEY);
    return resolveHelpCenter(setting?.value);
  }

  /** `content === null` resets the page to the built-in defaults. */
  async updateHelpCenter(content, adminId) {
    const value = content === null ? null : validateHelpCenter(content);
    const existing = await this.platformSettingRepository.findByKey(HELP_CENTER_SETTING_KEY);
    if (existing) {
      await this.platformSettingRepository.updateById(existing._id, { value, updatedBy: adminId });
    } else {
      await this.platformSettingRepository.create({ key: HELP_CENTER_SETTING_KEY, value, updatedBy: adminId });
    }
    if (this.platformConfigService) await this.platformConfigService.invalidateCache();
    return resolveHelpCenter(value);
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
