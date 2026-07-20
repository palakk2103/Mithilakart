const { BaseController } = require('../../core/BaseController');
const { ApiResponse } = require('../../utils/ApiResponse');
const { asyncHandler } = require('../../utils/asyncHandler');

class AdminDeliveryController extends BaseController {
  constructor(adminDeliveryService) {
    super(adminDeliveryService);
    this.bindMethods(['list', 'getById', 'approve', 'reject', 'suspend', 'create']);
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
    const data = await this.service.approve(req.params.id);
    return ApiResponse.success(res, data);
  });

  reject = asyncHandler(async (req, res) => {
    const data = await this.service.reject(req.params.id);
    return ApiResponse.success(res, data);
  });

  suspend = asyncHandler(async (req, res) => {
    const data = await this.service.suspend(req.params.id);
    return ApiResponse.success(res, data);
  });

  create = asyncHandler(async (req, res) => {
    const data = await this.service.create(req.body);
    return ApiResponse.created(res, data);
  });
}

module.exports = { AdminDeliveryController };
