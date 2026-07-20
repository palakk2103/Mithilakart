const { requestIdMiddleware } = require('./requestId');
const { requestLogger } = require('./requestLogger');
const { validate, validateQuery, validateParams, validateBody } = require('./validate');
const { authenticate, requirePortal, requireAuthenticatedUser } = require('./authenticate');
const { authorize, authorizeAny, authorizePolicy } = require('./authorize');
const { notFoundHandler, errorHandler } = require('./errorHandler');
const { createUploadMiddleware, handleUploadError, ensureUploadDirectory } = require('./upload');
const { createRateLimiterMiddleware } = require('./rateLimiter');
const { createHelmetMiddleware, createCorsMiddleware } = require('./security');
const { createMetricsMiddleware } = require('./metrics');
const {
  createAuthMiddleware,
  requireActiveSeller,
  requireApprovedPartner,
  requirePermission,
} = require('./authMiddleware');

module.exports = {
  requestIdMiddleware,
  requestLogger,
  validate,
  validateQuery,
  validateParams,
  validateBody,
  authenticate,
  requirePortal,
  requireAuthenticatedUser,
  authorize,
  authorizeAny,
  authorizePolicy,
  notFoundHandler,
  errorHandler,
  createUploadMiddleware,
  handleUploadError,
  ensureUploadDirectory,
  createRateLimiterMiddleware,
  createHelmetMiddleware,
  createCorsMiddleware,
  createMetricsMiddleware,
  createAuthMiddleware,
  requireActiveSeller,
  requireApprovedPartner,
  requirePermission,
};
