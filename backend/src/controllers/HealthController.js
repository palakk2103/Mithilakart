const { BaseController } = require('../core/BaseController');
const { asyncHandler } = require('../utils/asyncHandler');
const { ApiResponse } = require('../utils/ApiResponse');
const { HTTP_STATUS } = require('../constants/httpStatus');

class HealthController extends BaseController {
  constructor(healthService) {
    super(healthService);
    this.bindMethods(['getHealth', 'getReadiness']);
  }

  getHealth = asyncHandler(async (req, res) => {
    const data = this.service.getLiveness();
    return ApiResponse.success(res, data);
  });

  getReadiness = asyncHandler(async (req, res) => {
    const data = this.service.getReadiness();
    const statusCode = data.isReady ? HTTP_STATUS.OK : HTTP_STATUS.SERVICE_UNAVAILABLE;
    return ApiResponse.success(res, data, null, statusCode);
  });
}

module.exports = {
  HealthController,
};
