const { BaseService } = require('../core/BaseService');
const { AppError } = require('../utils/AppError');
const { getProvider } = require('../core/providers.registry');
const { UPLOAD_CONTEXTS } = require('../constants/catalog');

const PRESIGN_TTL_SECONDS = 900;

class UploadService extends BaseService {
  constructor(config, redisClient = null) {
    super();
    this.config = config;
    this.redis = redisClient;
    this.storageProvider = getProvider('storage');
  }

  _presignKey(storageKey) {
    return `upload:presign:${storageKey}`;
  }

  async createPresignedUpload({ context, fileName, mimeType }) {
    this._validateContext(context);
    this._validateMimeType(mimeType);

    const result = await this.storageProvider.getPresignedUploadUrl({
      context,
      fileName,
      mimeType,
    });

    // One-time nonce so /local/:storageKey cannot be abused without a fresh
    // presign — even when the endpoint stays reachable without a JWT.
    if (this.redis && result?.storageKey) {
      await this.redis.set(
        this._presignKey(result.storageKey),
        '1',
        'EX',
        result.expiresInSeconds || PRESIGN_TTL_SECONDS
      );
    }

    return result;
  }

  async confirmUpload({ storageKey, mimeType, context }) {
    this._validateContext(context);
    this._validateMimeType(mimeType);

    return this.storageProvider.confirmUpload({ storageKey, mimeType });
  }

  async saveLocalUpload(storageKey, buffer) {
    if (!storageKey || typeof storageKey !== 'string') {
      throw AppError.validation('storageKey is required');
    }

    if (typeof this.storageProvider.writeLocalFile !== 'function') {
      throw AppError.internal('Local upload handler unavailable');
    }

    if (this.redis) {
      const consumed = typeof this.redis.getdel === 'function'
        ? await this.redis.getdel(this._presignKey(storageKey))
        : await this._consumePresign(storageKey);
      if (!consumed) {
        throw AppError.forbidden('Upload token missing or expired. Request a new presign.');
      }
    }

    await this.storageProvider.writeLocalFile(storageKey, buffer);
    return this.storageProvider.confirmUpload({ storageKey, mimeType: 'application/octet-stream' });
  }

  async _consumePresign(storageKey) {
    const key = this._presignKey(storageKey);
    const existing = await this.redis.get(key);
    if (!existing) return null;
    await this.redis.del(key);
    return existing;
  }

  _validateContext(context) {
    const allowed = Object.values(UPLOAD_CONTEXTS);
    if (!allowed.includes(context)) {
      throw AppError.validation('Invalid upload context');
    }
  }

  _validateMimeType(mimeType) {
    if (!this.config.upload.allowedMimeTypes.includes(mimeType)) {
      throw AppError.upload('Unsupported file type', [{ field: 'mimeType', message: mimeType }]);
    }
  }
}

module.exports = {
  UploadService,
};
