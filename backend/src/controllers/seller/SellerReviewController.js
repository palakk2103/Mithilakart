const { BaseController } = require('../../core/BaseController');
const { ApiResponse } = require('../../utils/ApiResponse');
const { asyncHandler } = require('../../utils/asyncHandler');

class SellerReviewController extends BaseController {
  constructor(reviewService) {
    super(reviewService);
    this.bindMethods(['list', 'reply', 'report']);
  }

  list = asyncHandler(async (req, res) => {
    const result = await this.service.listBySeller(req.sellerId, req.query);
    return ApiResponse.paginated(res, result.items, result.meta);
  });

  reply = asyncHandler(async (req, res) => {
    const data = await this.service.reply(req.sellerId, req.params.id, req.body.reply);
    return ApiResponse.success(res, data);
  });

  report = asyncHandler(async (req, res) => {
    const data = await this.service.report(req.sellerId, req.params.id, req.body.reason);
    return ApiResponse.success(res, data);
  });
}

module.exports = { SellerReviewController };
