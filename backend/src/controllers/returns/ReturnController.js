const { BaseController } = require('../../core/BaseController');
const { ApiResponse } = require('../../utils/ApiResponse');
const { asyncHandler } = require('../../utils/asyncHandler');

class ReturnController extends BaseController {
  constructor(returnService) {
    super(returnService);
    this.bindMethods(['initiateReturn', 'listReturns']);
  }

  initiateReturn = asyncHandler(async (req, res) => {
    const data = await this.service.initiateReturn(req.user.id, req.params.id, req.body);
    return ApiResponse.created(res, data);
  });

  listReturns = asyncHandler(async (req, res) => {
    const result = await this.service.listByUser(req.user.id, req.query);
    return ApiResponse.success(res, result);
  });
}

module.exports = { ReturnController };
