const { BaseController } = require('../../core/BaseController');
const { ApiResponse } = require('../../utils/ApiResponse');
const { asyncHandler } = require('../../utils/asyncHandler');

class AdminReturnController extends BaseController {
  constructor(adminReturnService) {
    super(adminReturnService);
    this.bindMethods(['list', 'getById', 'approve', 'reject']);
  }

  list = asyncHandler(async (req, res) => {
    const result = await this.service.list(req.query);
    return ApiResponse.paginated(res, result.items, result.meta);
  });

  getById = asyncHandler(async (req, res) => {
    const data = await this.service.getById(req.params.id);
    return ApiResponse.success(res, data);
  });

  approve = asyncHandler(async (req, res) => {
    const data = await this.service.approve(req.params.id, req.user.id, req.body.note);
    return ApiResponse.success(res, data);
  });

  reject = asyncHandler(async (req, res) => {
    const data = await this.service.reject(req.params.id, req.user.id, req.body.note);
    return ApiResponse.success(res, data);
  });
}

module.exports = { AdminReturnController };
