const { BaseController } = require('../../core/BaseController');
const { ApiResponse } = require('../../utils/ApiResponse');
const { asyncHandler } = require('../../utils/asyncHandler');

class SellerAnalyticsController extends BaseController {
  constructor(analyticsService) {
    super(analyticsService);
    this.bindMethods(['sales', 'revenue', 'products', 'categories', 'customers']);
  }

  sales = asyncHandler(async (req, res) => {
    const data = await this.service.getSales(req.sellerId, req.query.range);
    return ApiResponse.success(res, data);
  });

  revenue = asyncHandler(async (req, res) => {
    const data = await this.service.getRevenue(req.sellerId);
    return ApiResponse.success(res, data);
  });

  products = asyncHandler(async (req, res) => {
    const data = await this.service.getTopProducts(req.sellerId);
    return ApiResponse.success(res, data);
  });

  categories = asyncHandler(async (req, res) => {
    const data = await this.service.getTopCategories(req.sellerId);
    return ApiResponse.success(res, data);
  });

  customers = asyncHandler(async (req, res) => {
    const data = await this.service.getTopCustomers(req.sellerId);
    return ApiResponse.success(res, data);
  });
}

module.exports = { SellerAnalyticsController };
