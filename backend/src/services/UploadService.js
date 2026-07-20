const { BaseService } = require('../core/BaseService');
const { AppError } = require('../utils/AppError');
const { getProvider } = require('../core/providers.registry');
const { UPLOAD_CONTEXTS } = require('../constants/catalog');

class UploadService extends BaseService {
  constructor(config) {
    super();
    this.config = config;
    this.storageProvider = getProvider('storage');
  }

  async createPresignedUpload({ context, fileName, mimeType }) {
    this._validateContext(context);
    this._validateMimeType(mimeType);

    return this.storageProvider.getPresignedUploadUrl({
      context,
      fileName,
      mimeType,
    });
  }

  async confirmUpload({ storageKey, mimeType, context }) {
    this._validateContext(context);
    this._validateMimeType(mimeType);

    return this.storageProvider.confirmUpload({ storageKey, mimeType });
  }

  async saveLocalUpload(storageKey, buffer) {
    if (typeof this.storageProvider.writeLocalFile !== 'function') {
      throw AppError.internal('Local upload handler unavailable');
    }

    this.storageProvider.writeLocalFile(storageKey, buffer);
    return this.storageProvider.confirmUpload({ storageKey, mimeType: 'application/octet-stream' });
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
