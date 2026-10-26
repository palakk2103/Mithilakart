const { ERROR_CODES, ERROR_CODE_TO_STATUS, DOMAIN_ERROR_STATUS } = require('../constants/errorCodes');
const { HTTP_STATUS } = require('../constants/httpStatus');

class AppError extends Error {
  constructor(message, code = ERROR_CODES.INTERNAL_ERROR, statusCode, details = null) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.statusCode = statusCode
      || DOMAIN_ERROR_STATUS[code]
      || ERROR_CODE_TO_STATUS[code]
      || HTTP_STATUS.INTERNAL_SERVER_ERROR;
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

  static notFound(message = 'Resource not found', code = ERROR_CODES.NOT_FOUND) {
    return new AppError(message, code, null);
  }

  static conflict(message = 'Resource conflict', details = null, code = ERROR_CODES.CONFLICT) {
    return new AppError(message, code, null, details);
  }

  static outOfStock(message = 'Insufficient stock', details = null) {
    return new AppError(message, ERROR_CODES.OUT_OF_STOCK, null, details);
  }

  static paymentFailed(message = 'Payment failed', details = null) {
    return new AppError(message, ERROR_CODES.PAYMENT_FAILED, null, details);
  }

  static deliveryNotAvailable(message = 'No delivery partner available', details = null) {
    return new AppError(message, ERROR_CODES.DELIVERY_NOT_AVAILABLE, null, details);
  }

  // ── CR-002 — intelligent fulfillment ───────────────────────────────────────
  // MAP_SERVICE_UNAVAILABLE and REALTIME_CONNECTION_FAILED deliberately have no
  // factory: they are logged and degraded, never thrown at a customer.

  static fulfillmentTimeout(message = 'Fulfillment search timed out', details = null) {
    return new AppError(message, ERROR_CODES.FULFILLMENT_TIMEOUT, null, details);
  }

  static noSellerAvailable(message = 'No seller can fulfil this order', details = null) {
    return new AppError(message, ERROR_CODES.NO_SELLER_AVAILABLE, null, details);
  }

  static warehouseUnavailable(message = 'Warehouse fulfillment unavailable', details = null) {
    return new AppError(message, ERROR_CODES.WAREHOUSE_UNAVAILABLE, null, details);
  }

  static courierUnavailable(message = 'Courier service unavailable', details = null) {
    return new AppError(message, ERROR_CODES.COURIER_SERVICE_UNAVAILABLE, null, details);
  }

  static reservationFailed(message = 'Could not reserve inventory', details = null) {
    return new AppError(message, ERROR_CODES.INVENTORY_RESERVATION_FAILED, null, details);
  }

  static offerExpired(message = 'This order offer has expired', details = null) {
    return new AppError(message, ERROR_CODES.FULFILLMENT_OFFER_EXPIRED, null, details);
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
