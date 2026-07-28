const { BaseController } = require('../../core/BaseController');
const { ApiResponse } = require('../../utils/ApiResponse');
const { asyncHandler } = require('../../utils/asyncHandler');

class DeliveryEarningsController extends BaseController {
  constructor(deliveryEarningsService) {
    super(deliveryEarningsService);
    this.bindMethods(['list']);
  }

  list = asyncHandler(async (req, res) => {
    const result = await this.service.list(req.partnerId, req.query);
    return ApiResponse.success(res, result.items, {
      ...result.meta,
      totalEarnings: result.totalEarnings,
    });
  });
}

module.exports = { DeliveryEarningsController };
