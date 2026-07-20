const { BaseController } = require('../../core/BaseController');
const { ApiResponse } = require('../../utils/ApiResponse');
const { asyncHandler } = require('../../utils/asyncHandler');

class DeliveryDashboardController extends BaseController {
  constructor(deliveryOrderService) {
    super(deliveryOrderService);
    this.bindMethods(['getDashboard', 'updateStatus']);
  }

  getDashboard = asyncHandler(async (req, res) => {
    const data = await this.service.getDashboard(req.partnerId);
    return ApiResponse.success(res, data);
  });

  updateStatus = asyncHandler(async (req, res) => {
    const data = await this.service.toggleStatus(req.partnerId, req.body.isOnline);
    return ApiResponse.success(res, data);
  });
}

module.exports = { DeliveryDashboardController };
