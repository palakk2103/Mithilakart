const path = require('path');
const fs = require('fs');
const multer = require('multer');
const config = require('../config');
const { AppError } = require('../utils/AppError');

function ensureUploadDirectory() {
  const uploadPath = path.isAbsolute(config.upload.destination)
    ? config.upload.destination
    : path.join(process.cwd(), config.upload.destination);

  if (!fs.existsSync(uploadPath)) {
    fs.mkdirSync(uploadPath, { recursive: true });
  }

  return uploadPath;
}

function createDiskStorage() {
  const uploadPath = ensureUploadDirectory();

  return multer.diskStorage({
    destination: (_req, _file, callback) => {
      callback(null, uploadPath);
    },
    filename: (_req, file, callback) => {
      const extension = path.extname(file.originalname);
      const baseName = path.basename(file.originalname, extension)
        .replace(/[^a-zA-Z0-9-_]/g, '_')
        .slice(0, 50);
      const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
      callback(null, `${baseName}-${uniqueSuffix}${extension}`);
    },
  });
}

function createUploadMiddleware(options = {}) {
  const maxFileSize = (options.maxFileSizeMb || config.upload.maxFileSizeMb) * 1024 * 1024;
  const allowedMimeTypes = options.allowedMimeTypes || config.upload.allowedMimeTypes;

  return multer({
    storage: createDiskStorage(),
    limits: {
      fileSize: maxFileSize,
      files: options.maxFiles || 1,
    },
    fileFilter: (_req, file, callback) => {
      if (!allowedMimeTypes.includes(file.mimetype)) {
        return callback(AppError.upload('Unsupported file type', [{ field: 'file', message: file.mimetype }]));
      }

      return callback(null, true);
    },
  });
}

function handleUploadError(err, req, res, next) {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return next(AppError.upload('File exceeds maximum allowed size'));
    }

    return next(AppError.upload(err.message));
  }

  return next(err);
}

module.exports = {
  ensureUploadDirectory,
  createUploadMiddleware,
  handleUploadError,
};
