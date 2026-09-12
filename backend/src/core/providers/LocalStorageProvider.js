const path = require('path');
const fs = require('fs');
const { BaseProvider } = require('./index');
const { randomUuid } = require('../../utils/cryptoHelper');
const config = require('../../config');
const { AppError } = require('../../utils/AppError');

class LocalStorageProvider extends BaseProvider {
  constructor() {
    super('LocalStorage');
    this.basePath = path.isAbsolute(config.upload.destination)
      ? config.upload.destination
      : path.join(process.cwd(), config.upload.destination);
    this.publicBaseUrl = config.upload.publicBaseUrl || '/uploads';
    this.markConfigured();
  }

  /**
   * Resolve a storage key to an absolute path that is guaranteed to stay
   * under this.basePath. Rejects traversal (`..`), absolute paths, and
   * null-byte tricks.
   */
  _resolvePath(relativePath) {
    if (!relativePath || typeof relativePath !== 'string') {
      throw AppError.validation('Invalid storage key');
    }

    const normalizedKey = relativePath.replace(/\\/g, '/').replace(/^\/+/, '');
    if (
      !normalizedKey
      || normalizedKey.includes('\0')
      || normalizedKey.split('/').some((segment) => segment === '..')
      || path.isAbsolute(normalizedKey)
    ) {
      throw AppError.validation('Invalid storage key');
    }

    const resolved = path.resolve(this.basePath, normalizedKey);
    const base = path.resolve(this.basePath);
    const prefix = base.endsWith(path.sep) ? base : `${base}${path.sep}`;

    if (resolved !== base && !resolved.startsWith(prefix)) {
      throw AppError.forbidden('Storage path escape blocked');
    }

    return resolved;
  }

  async getPresignedUploadUrl({ context, fileName, mimeType }) {
    this.ensureConfigured();

    const extension = path.extname(fileName) || '';
    const storageKey = path.posix.join(context, `${randomUuid()}${extension}`);
    const uploadPath = this._resolvePath(storageKey);

    fs.mkdirSync(path.dirname(uploadPath), { recursive: true });

    return {
      uploadUrl: `/api/v1/uploads/local/${encodeURIComponent(storageKey)}`,
      fields: {
        key: storageKey,
        mimeType,
      },
      storageKey,
      expiresInSeconds: 900,
    };
  }

  async confirmUpload({ storageKey, mimeType }) {
    this.ensureConfigured();

    const filePath = this._resolvePath(storageKey);

    if (!fs.existsSync(filePath)) {
      throw new Error('Uploaded file not found');
    }

    return {
      storageKey,
      url: `${this.publicBaseUrl}/${storageKey.replace(/\\/g, '/')}`,
      mimeType,
    };
  }

  async getPublicUrl({ storageKey }) {
    return {
      url: `${this.publicBaseUrl}/${storageKey.replace(/\\/g, '/')}`,
    };
  }

  writeLocalFile(storageKey, buffer) {
    const filePath = this._resolvePath(storageKey);
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, buffer);
    return filePath;
  }
}

module.exports = {
  LocalStorageProvider,
};
