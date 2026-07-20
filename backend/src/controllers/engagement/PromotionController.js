const { BaseController } = require('../../core/BaseController');
const { ApiResponse } = require('../../utils/ApiResponse');
const { asyncHandler } = require('../../utils/asyncHandler');

class PromotionController extends BaseController {
  constructor(promotionService) {
    super(promotionService);
    this.bindMethods(['getDeals', 'getOffers']);
  }

  getDeals = asyncHandler(async (req, res) => {
    const data = await this.service.getDeals();
    return ApiResponse.success(res, data);
  });

  getOffers = asyncHandler(async (req, res) => {
    const data = await this.service.getOffers();
    return ApiResponse.success(res, data);
  });
}

module.exports = { PromotionController };
