const { BaseService } = require('../../core/BaseService');
const { AppError } = require('../../utils/AppError');
const { isFiniteNumber } = require('../../utils/numeric');
const { PLATFORM_SETTING_KEYS: K, FULFILLMENT_SETTING_RANGES } = require('../../constants/platformSettings');

/**
 * Validating façade over the same platform_settings store used by
 * AdminFulfillmentService/AdminPlatformSettingsService — mirrors that
 * pattern exactly rather than introducing a second settings mechanism.
 */

const NUMERIC_KEYS = [
  K.GAME_DURATION_SECONDS,
  K.GAME_MAX_PLAYS_PER_ORDER,
  K.GAME_WIN_PROBABILITY,
  K.GAME_COIN_REWARD_MIN,
  K.GAME_COIN_REWARD_MAX,
];

const BOOLEAN_KEYS = [K.GAME_ENABLED];
const DATE_KEYS = [K.GAME_STARTS_AT, K.GAME_EXPIRES_AT];

class AdminGameService extends BaseService {
  constructor({ adminPlatformSettingsService, platformConfigService, gameSessionRepository = null }) {
    super();
    this.adminPlatformSettingsService = adminPlatformSettingsService;
    this.platformConfigService = platformConfigService;
    this.gameSessionRepository = gameSessionRepository;
  }

  static get MANAGED_KEYS() {
    return [...NUMERIC_KEYS, ...BOOLEAN_KEYS, ...DATE_KEYS];
  }

  validate(updates) {
    if (!updates || typeof updates !== 'object' || Array.isArray(updates)) {
      throw AppError.validation('Settings payload must be an object');
    }

    const keys = Object.keys(updates);
    if (!keys.length) throw AppError.validation('No settings provided');

    const errors = [];
    const clean = {};

    for (const key of keys) {
      const value = updates[key];

      if (NUMERIC_KEYS.includes(key)) {
        if (!isFiniteNumber(value)) {
          errors.push({ field: key, message: 'must be a number' });
          continue;
        }
        const num = Number(value);
        const range = FULFILLMENT_SETTING_RANGES[key];
        if (range && (num < range.min || num > range.max)) {
          errors.push({ field: key, message: `must be between ${range.min} and ${range.max}` });
          continue;
        }
        clean[key] = num;
        continue;
      }

      if (BOOLEAN_KEYS.includes(key)) {
        if (typeof value !== 'boolean') {
          errors.push({ field: key, message: 'must be true or false' });
          continue;
        }
        clean[key] = value;
        continue;
      }

      if (DATE_KEYS.includes(key)) {
        if (value !== null && Number.isNaN(new Date(value).getTime())) {
          errors.push({ field: key, message: 'must be a valid date or null' });
          continue;
        }
        clean[key] = value === null ? null : new Date(value).toISOString();
        continue;
      }

      errors.push({ field: key, message: 'is not a game setting' });
    }

    if (clean[K.GAME_COIN_REWARD_MIN] !== undefined || clean[K.GAME_COIN_REWARD_MAX] !== undefined) {
      const min = clean[K.GAME_COIN_REWARD_MIN];
      const max = clean[K.GAME_COIN_REWARD_MAX];
      if (min !== undefined && max !== undefined && min > max) {
        errors.push({ field: K.GAME_COIN_REWARD_MIN, message: 'must not be greater than the maximum' });
      }
    }

    if (errors.length) {
      throw AppError.validation('Invalid game settings', errors);
    }

    return clean;
  }

  async getSettings() {
    const config = await this.platformConfigService.getConfig();
    const settings = {};
    for (const key of AdminGameService.MANAGED_KEYS) settings[key] = config[key];

    return {
      settings,
      ranges: FULFILLMENT_SETTING_RANGES,
    };
  }

  async updateSettings(updates, adminId) {
    const clean = this.validate(updates);
    await this.adminPlatformSettingsService.updateSettings(clean, adminId);
    return this.getSettings();
  }
}

module.exports = { AdminGameService };
