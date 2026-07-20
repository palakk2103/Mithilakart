const { BaseController } = require('../../core/BaseController');
const { asyncHandler } = require('../../utils/asyncHandler');
const { ApiResponse } = require('../../utils/ApiResponse');

class CategoryController extends BaseController {
  constructor(categoryService) {
    super(categoryService);
    this.bindMethods(['list', 'listAdmin', 'getById', 'create', 'update', 'delete']);
  }

  list = asyncHandler(async (req, res) => {
    const data = await this.service.listPublicTree(req.query.commerceFlow);
    return ApiResponse.success(res, data);
  });

  listAdmin = asyncHandler(async (req, res) => {
    const data = await this.service.listAdmin(req.query);
    return ApiResponse.success(res, data);
  });

  getById = asyncHandler(async (req, res) => {
    const data = await this.service.getById(req.params.id);
    return ApiResponse.success(res, data);
  });

  create = asyncHandler(async (req, res) => {
    const data = await this.service.create(req.body);
    return ApiResponse.created(res, data);
  });

  update = asyncHandler(async (req, res) => {
    const data = await this.service.update(req.params.id, req.body);
    return ApiResponse.success(res, data);
  });

  delete = asyncHandler(async (req, res) => {
    await this.service.delete(req.params.id);
    return ApiResponse.noContent(res);
  });
}

module.exports = {
  CategoryController,
};
