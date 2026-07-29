const { BaseController } = require('../../core/BaseController');
const { asyncHandler } = require('../../utils/asyncHandler');
const { ApiResponse } = require('../../utils/ApiResponse');

class ProductController extends BaseController {
  constructor(productService) {
    super(productService);
    this.bindMethods([
      'list',
      'listByCategory',
      'search',
      'getById',
      'listAdmin',
      'getAdminById',
      'approve',
      'reject',
      'delete',
      'update',
      'bulk',
    ]);
  }

  list = asyncHandler(async (req, res) => {
    const result = await this.service.listPublic(req.query);
    return ApiResponse.paginated(res, result.items, result.meta);
  });

  listByCategory = asyncHandler(async (req, res) => {
    const result = await this.service.listByCategory(req.params.id, req.query);
    return ApiResponse.paginated(res, result.items, result.meta);
  });

  search = asyncHandler(async (req, res) => {
    const result = await this.service.searchPublic(req.query);
    return ApiResponse.paginated(res, result.items, result.meta);
  });

  getById = asyncHandler(async (req, res) => {
    const data = await this.service.getPublicById(req.params.id, req.query);
    return ApiResponse.success(res, data);
  });

  listAdmin = asyncHandler(async (req, res) => {
    const result = await this.service.listAdmin(req.query);
    return ApiResponse.paginated(res, result.items, result.meta);
  });

  getAdminById = asyncHandler(async (req, res) => {
    const data = await this.service.getAdminById(req.params.id);
    return ApiResponse.success(res, data);
  });

  approve = asyncHandler(async (req, res) => {
    const data = await this.service.approve(req.params.id, req.user.id);
    return ApiResponse.success(res, data);
  });

  reject = asyncHandler(async (req, res) => {
    const data = await this.service.reject(req.params.id, req.body.moderationNote, req.user.id);
    return ApiResponse.success(res, data);
  });

  delete = asyncHandler(async (req, res) => {
    await this.service.delete(req.params.id);
    return ApiResponse.noContent(res);
  });

  update = asyncHandler(async (req, res) => {
    const data = await this.service.update(req.params.id, req.body);
    return ApiResponse.success(res, data);
  });

  bulk = asyncHandler(async (req, res) => {
    const data = await this.service.bulkAction(req.body.ids, req.body.action);
    return ApiResponse.success(res, data);
  });
}

module.exports = {
  ProductController,
};
