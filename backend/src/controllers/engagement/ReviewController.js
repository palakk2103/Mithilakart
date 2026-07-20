const { BaseController } = require('../../core/BaseController');
const { ApiResponse } = require('../../utils/ApiResponse');
const { asyncHandler } = require('../../utils/asyncHandler');

class ReviewController extends BaseController {
  constructor(reviewService) {
    super(reviewService);
    this.bindMethods(['create', 'listByProduct', 'listMine']);
  }

  create = asyncHandler(async (req, res) => {
    const data = await this.service.create(req.user.id, req.params.id, req.body);
    return ApiResponse.created(res, data);
  });

  listByProduct = asyncHandler(async (req, res) => {
    const result = await this.service.listByProduct(req.params.id, req.query);
    return ApiResponse.success(res, result);
  });

  listMine = asyncHandler(async (req, res) => {
    const result = await this.service.listByUser(req.user.id, req.query);
    return ApiResponse.success(res, result);
  });
}

module.exports = { ReviewController };
