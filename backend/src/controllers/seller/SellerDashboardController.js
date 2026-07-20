const { BaseController } = require('../../core/BaseController');
const { ApiResponse } = require('../../utils/ApiResponse');
const { asyncHandler } = require('../../utils/asyncHandler');

class SellerDashboardController extends BaseController {
  constructor(dashboardService) {
    super(dashboardService);
    this.bindMethods(['getDashboard', 'getStats']);
  }

  getDashboard = asyncHandler(async (req, res) => {
    const data = await this.service.getDashboard(req.sellerId);
    return ApiResponse.success(res, data);
  });

  getStats = asyncHandler(async (req, res) => {
    const data = await this.service.getStats(req.sellerId);
    return ApiResponse.success(res, data);
  });
}

module.exports = { SellerDashboardController };
