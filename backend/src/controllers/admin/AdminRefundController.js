const { BaseController } = require('../../core/BaseController');
const { ApiResponse } = require('../../utils/ApiResponse');
const { asyncHandler } = require('../../utils/asyncHandler');

class AdminRefundController extends BaseController {
  constructor(refundService) {
    super(refundService);
    this.bindMethods(['list', 'getById', 'process']);
  }

  list = asyncHandler(async (req, res) => {
    const result = await this.service.list(req.query);
    return ApiResponse.paginated(res, result.items, result.meta);
  });

  getById = asyncHandler(async (req, res) => {
    const data = await this.service.getById(req.params.id);
    return ApiResponse.success(res, data);
  });

  process = asyncHandler(async (req, res) => {
    const data = await this.service.processRefund({
      returnId: req.body.returnId,
      adminId: req.user.id,
      method: req.body.method,
      idempotencyKey: req.body.idempotencyKey || null,
    });
    return ApiResponse.success(res, data);
  });
}

module.exports = { AdminRefundController };
