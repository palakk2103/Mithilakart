const { BaseController } = require('../../core/BaseController');
const { ApiResponse } = require('../../utils/ApiResponse');
const { asyncHandler } = require('../../utils/asyncHandler');

class SellerEarningsController extends BaseController {
  constructor(earningsService, payoutService) {
    super(earningsService);
    this.payoutService = payoutService;
    this.bindMethods(['summary', 'transactions', 'settlements', 'requestPayout']);
  }

  summary = asyncHandler(async (req, res) => {
    const data = await this.service.getSummary(req.sellerId);
    return ApiResponse.success(res, data);
  });

  transactions = asyncHandler(async (req, res) => {
    const result = await this.service.listTransactions(req.sellerId, req.query);
    return ApiResponse.paginated(res, result.items, result.meta);
  });

  settlements = asyncHandler(async (req, res) => {
    const data = await this.service.listSettlements(req.sellerId);
    return ApiResponse.success(res, data);
  });

  requestPayout = asyncHandler(async (req, res) => {
    const data = await this.payoutService.requestPayout(req.sellerId, req.body.amount);
    return ApiResponse.created(res, data);
  });
}

module.exports = { SellerEarningsController };
