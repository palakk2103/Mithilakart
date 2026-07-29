const { BaseController } = require('../../core/BaseController');
const { ApiResponse } = require('../../utils/ApiResponse');
const { asyncHandler } = require('../../utils/asyncHandler');

class SellerCustomerController extends BaseController {
  constructor(customerService) {
    super(customerService);
    this.bindMethods(['list', 'getById']);
  }

  list = asyncHandler(async (req, res) => {
    const result = await this.service.list(req.sellerId, req.query);
    return ApiResponse.paginated(res, result.items, result.meta);
  });

  getById = asyncHandler(async (req, res) => {
    const data = await this.service.getById(req.sellerId, req.params.id);
    return ApiResponse.success(res, data);
  });
}

module.exports = { SellerCustomerController };
