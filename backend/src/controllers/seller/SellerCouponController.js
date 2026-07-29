const { BaseController } = require('../../core/BaseController');
const { ApiResponse } = require('../../utils/ApiResponse');
const { asyncHandler } = require('../../utils/asyncHandler');

class SellerCouponController extends BaseController {
  constructor(couponService) {
    super(couponService);
    this.bindMethods(['list', 'create', 'update', 'remove']);
  }

  list = asyncHandler(async (req, res) => {
    const result = await this.service.listBySeller(req.sellerId, req.query);
    return ApiResponse.success(res, result.items, { page: result.page, limit: result.limit, total: result.total });
  });

  create = asyncHandler(async (req, res) => {
    const data = await this.service.createForSeller(req.sellerId, req.body);
    return ApiResponse.created(res, data);
  });

  update = asyncHandler(async (req, res) => {
    const data = await this.service.updateForSeller(req.sellerId, req.params.id, req.body);
    return ApiResponse.success(res, data);
  });

  remove = asyncHandler(async (req, res) => {
    await this.service.deleteForSeller(req.sellerId, req.params.id);
    return ApiResponse.noContent(res);
  });
}

module.exports = { SellerCouponController };
