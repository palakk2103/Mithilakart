const { AppError } = require('../utils/AppError');
const { ERROR_CODES } = require('../constants/errorCodes');
const { ApiResponse } = require('../utils/ApiResponse');
const { logger } = require('../utils/logger');

function notFoundHandler(req, res, next) {
  next(AppError.notFound(`Route not found: ${req.method} ${req.originalUrl}`));
}

function errorHandler(err, req, res, _next) {
  if (res.headersSent) {
    logger.error({ err, requestId: req.id }, 'Headers already sent — cannot write error response');
    return;
  }

  if (err instanceof AppError) {
    if (!err.isOperational) {
      logger.error({ err, requestId: req.id }, 'Operational AppError');
    }

    return ApiResponse.fromAppError(res, err);
  }

  if (err.name === 'ValidationError') {
    const details = Object.entries(err.errors || {}).map(([field, value]) => ({
      field,
      message: value.message,
    }));

    return ApiResponse.error(
      res,
      422,
      ERROR_CODES.VALIDATION_ERROR,
      'Validation failed',
      details
    );
  }

  if (err.code === 11000) {
    return ApiResponse.error(
      res,
      409,
      ERROR_CODES.CONFLICT,
      'Duplicate key conflict',
      err.keyValue || null
    );
  }

  logger.error(
    {
      err,
      requestId: req.id,
      method: req.method,
      path: req.originalUrl,
    },
    'Unhandled error'
  );

  return ApiResponse.error(
    res,
    500,
    ERROR_CODES.INTERNAL_ERROR,
    'Something went wrong'
  );
}

module.exports = {
  notFoundHandler,
  errorHandler,
};
