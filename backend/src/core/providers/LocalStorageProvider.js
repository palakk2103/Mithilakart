const path = require('path');
const fs = require('fs');
const { BaseProvider } = require('./index');
const { randomUuid } = require('../../utils/cryptoHelper');
const config = require('../../config');

class LocalStorageProvider extends BaseProvider {
  constructor() {
    super('LocalStorage');
    this.basePath = path.isAbsolute(config.upload.destination)
      ? config.upload.destination
      : path.join(process.cwd(), config.upload.destination);
    this.publicBaseUrl = config.upload.publicBaseUrl || '/uploads';
    this.markConfigured();
  }

  _resolvePath(relativePath) {
    return path.join(this.basePath, relativePath);
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
