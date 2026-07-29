const path = require('path');
const cloudinary = require('cloudinary').v2;
const { StorageProvider } = require('./index');
const { randomUuid } = require('../../utils/cryptoHelper');

class CloudinaryStorageProvider extends StorageProvider {
  constructor(config) {
    super('Cloudinary');
    if (!config.cloudName || !config.apiKey || !config.apiSecret) {
      throw new Error('Cloudinary credentials are incomplete');
    }

    cloudinary.config({
      cloud_name: config.cloudName,
      api_key: config.apiKey,
      api_secret: config.apiSecret,
    });

    this.uploads = new Map();
    this.markConfigured();
  }

  async getPresignedUploadUrl({ context, fileName, mimeType }) {
    this.ensureConfigured();

    const extension = path.extname(fileName) || '';
    const storageKey = path.posix.join(context, `${randomUuid()}${extension}`);

    // Return a local upload endpoint route so the frontend doesn't need to change.
    // The frontend will upload the image to the backend via POST /local/:storageKey(*)
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

    const url = this.uploads.get(storageKey);
    if (!url) {
      throw new Error('Uploaded file not found or upload in progress/failed');
    }

    // Clean up cache to prevent memory leaks
    this.uploads.delete(storageKey);

    return {
      storageKey,
      url,
      mimeType,
    };
  }

  async getPublicUrl({ storageKey }) {
    // Note: Since confirmUpload returns the absolute cloudinary URL, this might not be called,
    // but we implement it just in case.
    const url = this.uploads.get(storageKey);
    if (url) {
      return { url };
    }
    return { url: '' };
  }

  async writeLocalFile(storageKey, buffer) {
    this.ensureConfigured();

    // Remove file extension to use as public_id
    const extension = path.extname(storageKey);
    const publicId = storageKey.slice(0, storageKey.length - extension.length);

    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          public_id: publicId,
          resource_type: 'auto',
        },
        (error, result) => {
          if (error) {
            return reject(error);
          }
          this.uploads.set(storageKey, result.secure_url);
          resolve(result);
        }
      );
      uploadStream.end(buffer);
    });
  }

  async deleteObject({ storageKey }) {
    this.ensureConfigured();
    const extension = path.extname(storageKey);
    const publicId = storageKey.slice(0, storageKey.length - extension.length);
    
    return new Promise((resolve, reject) => {
      cloudinary.uploader.destroy(publicId, (error, result) => {
        if (error) {
          return reject(error);
        }
        resolve(result);
      });
    });
  }
}

module.exports = {
  CloudinaryStorageProvider,
};
