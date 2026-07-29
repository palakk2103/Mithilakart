const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
  MIN_PAGE: 1,
  MIN_LIMIT: 1,
};

const API = {
  BASE_PATH: '/api',
  VERSION: 'v1',
  DOCS_PATH: '/api/docs',
};

const UPLOAD = {
  DEFAULT_MAX_FILE_SIZE_MB: 10,
  DEFAULT_ALLOWED_MIME_TYPES: ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'],
  DEFAULT_DESTINATION: 'uploads',
};

const SHUTDOWN = {
  DEFAULT_TIMEOUT_MS: 10000,
};

module.exports = {
  PAGINATION,
  API,
  UPLOAD,
  SHUTDOWN,
};
