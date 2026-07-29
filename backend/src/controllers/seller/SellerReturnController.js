const { BaseController } = require('../../core/BaseController');
const { ApiResponse } = require('../../utils/ApiResponse');
const { asyncHandler } = require('../../utils/asyncHandler');

class SellerReturnController extends BaseController {
  constructor(returnService) {
    super(returnService);
    this.bindMethods(['list', 'approve', 'reject']);
  }

  list = asyncHandler(async (req, res) => {
    const result = await this.service.list(req.sellerId, req.query);
    return ApiResponse.paginated(res, result.items, result.meta);
  });

  approve = asyncHandler(async (req, res) => {
    const data = await this.service.approve(req.sellerId, req.params.id, req.body.note);
    return ApiResponse.success(res, data);
  });

  reject = asyncHandler(async (req, res) => {
    const data = await this.service.reject(req.sellerId, req.params.id, req.body.note);
    return ApiResponse.success(res, data);
  });
}

module.exports = { SellerReturnController };
