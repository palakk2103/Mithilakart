const { ERROR_CODES, ERROR_CODE_TO_STATUS } = require('../constants/errorCodes');
const { HTTP_STATUS } = require('../constants/httpStatus');

class AppError extends Error {
  constructor(message, code = ERROR_CODES.INTERNAL_ERROR, statusCode, details = null) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.statusCode = statusCode || ERROR_CODE_TO_STATUS[code] || HTTP_STATUS.INTERNAL_SERVER_ERROR;
    this.details = details;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(message = 'Bad request', details = null) {
    return new AppError(message, ERROR_CODES.BAD_REQUEST, HTTP_STATUS.BAD_REQUEST, details);
  }

  static unauthorized(message = 'Authentication required') {
    return new AppError(message, ERROR_CODES.UNAUTHORIZED, HTTP_STATUS.UNAUTHORIZED);
  }

  static forbidden(message = 'Insufficient permissions', details = null) {
    return new AppError(message, ERROR_CODES.FORBIDDEN, HTTP_STATUS.FORBIDDEN, details);
  }

  static notFound(message = 'Resource not found') {
    return new AppError(message, ERROR_CODES.NOT_FOUND, HTTP_STATUS.NOT_FOUND);
  }

  static conflict(message = 'Resource conflict', details = null) {
    return new AppError(message, ERROR_CODES.CONFLICT, HTTP_STATUS.CONFLICT, details);
  }

  static gone(message = 'Resource expired') {
    return new AppError(message, ERROR_CODES.GONE, HTTP_STATUS.GONE);
  }

  static validation(message = 'Validation failed', details = null) {
    return new AppError(message, ERROR_CODES.VALIDATION_ERROR, HTTP_STATUS.UNPROCESSABLE_ENTITY, details);
  }

  static rateLimited(message = 'Too many requests', details = null) {
    return new AppError(message, ERROR_CODES.RATE_LIMITED, HTTP_STATUS.TOO_MANY_REQUESTS, details);
  }

  static internal(message = 'Something went wrong') {
    return new AppError(message, ERROR_CODES.INTERNAL_ERROR, HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }

  static serviceUnavailable(message = 'Service unavailable') {
    return new AppError(message, ERROR_CODES.SERVICE_UNAVAILABLE, HTTP_STATUS.SERVICE_UNAVAILABLE);
  }

  static database(message = 'Database operation failed', details = null) {
    return new AppError(message, ERROR_CODES.DATABASE_ERROR, HTTP_STATUS.INTERNAL_SERVER_ERROR, details);
  }

  static upload(message = 'File upload failed', details = null) {
    return new AppError(message, ERROR_CODES.UPLOAD_ERROR, HTTP_STATUS.BAD_REQUEST, details);
  }
}

module.exports = {
  AppError,
};
