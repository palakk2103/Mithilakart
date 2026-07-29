const { ApiResponse } = require('../utils/ApiResponse');

class BaseController {
  constructor(service = null) {
    this.service = service;
  }

  bindMethods(methodNames = []) {
    methodNames.forEach((methodName) => {
      if (typeof this[methodName] === 'function') {
        this[methodName] = this[methodName].bind(this);
      }
    });
  }

  sendSuccess(res, data, meta = null, statusCode = 200) {
    return ApiResponse.success(res, data, meta, statusCode);
  }

  sendCreated(res, data, meta = null) {
    return ApiResponse.created(res, data, meta);
  }

  sendPaginated(res, data, paginationMeta) {
    return ApiResponse.paginated(res, data, paginationMeta);
  }

  sendNoContent(res) {
    return ApiResponse.noContent(res);
  }
}

module.exports = {
  BaseController,
};
