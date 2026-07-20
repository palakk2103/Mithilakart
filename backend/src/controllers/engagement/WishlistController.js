const { BaseController } = require('../../core/BaseController');
const { ApiResponse } = require('../../utils/ApiResponse');
const { asyncHandler } = require('../../utils/asyncHandler');

class WishlistController extends BaseController {
  constructor(wishlistService) {
    super(wishlistService);
    this.bindMethods(['list', 'add', 'remove']);
  }

  list = asyncHandler(async (req, res) => {
    const result = await this.service.list(req.user.id, req.query);
    return ApiResponse.success(res, result);
  });

  add = asyncHandler(async (req, res) => {
    const data = await this.service.add(req.user.id, req.body.productId);
    return ApiResponse.created(res, data);
  });

  remove = asyncHandler(async (req, res) => {
    const data = await this.service.remove(req.user.id, req.params.productId);
    return ApiResponse.success(res, data);
  });
}

module.exports = { WishlistController };
