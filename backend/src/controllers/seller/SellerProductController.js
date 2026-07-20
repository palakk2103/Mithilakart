const { BaseController } = require('../../core/BaseController');
const { ApiResponse } = require('../../utils/ApiResponse');
const { asyncHandler } = require('../../utils/asyncHandler');

class SellerProductController extends BaseController {
  constructor(productService) {
    super(productService);
    this.bindMethods(['list', 'getById', 'create', 'update', 'remove', 'duplicate', 'updateStatus']);
  }

  list = asyncHandler(async (req, res) => {
    const result = await this.service.list(req.sellerId, req.query);
    return ApiResponse.paginated(res, result.items, result.meta);
  });

  getById = asyncHandler(async (req, res) => {
    const data = await this.service.getById(req.sellerId, req.params.id);
    return ApiResponse.success(res, data);
  });

  create = asyncHandler(async (req, res) => {
    const data = await this.service.create(req.sellerId, req.body);
    return ApiResponse.created(res, data);
  });

  update = asyncHandler(async (req, res) => {
    const data = await this.service.update(req.sellerId, req.params.id, req.body);
    return ApiResponse.success(res, data);
  });

  remove = asyncHandler(async (req, res) => {
    await this.service.delete(req.sellerId, req.params.id);
    return ApiResponse.noContent(res);
  });

  duplicate = asyncHandler(async (req, res) => {
    const data = await this.service.duplicate(req.sellerId, req.params.id);
    return ApiResponse.created(res, data);
  });

  updateStatus = asyncHandler(async (req, res) => {
    const data = await this.service.updateStatus(req.sellerId, req.params.id, req.body.status);
    return ApiResponse.success(res, data);
  });
}

module.exports = { SellerProductController };
