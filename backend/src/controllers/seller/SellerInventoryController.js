const { BaseController } = require('../../core/BaseController');
const { ApiResponse } = require('../../utils/ApiResponse');
const { asyncHandler } = require('../../utils/asyncHandler');

class SellerInventoryController extends BaseController {
  constructor(inventoryService) {
    super(inventoryService);
    this.bindMethods(['list', 'updateStock', 'getHistory']);
  }

  list = asyncHandler(async (req, res) => {
    const data = await this.service.listInventory(req.sellerId);
    return ApiResponse.success(res, data);
  });

  updateStock = asyncHandler(async (req, res) => {
    const data = await this.service.updateStock(
      req.sellerId,
      req.params.id,
      req.body.quantity,
      req.body.note
    );
    return ApiResponse.success(res, data);
  });

  getHistory = asyncHandler(async (req, res) => {
    const data = await this.service.getHistory(req.sellerId, req.params.id);
    return ApiResponse.success(res, data);
  });
}

module.exports = { SellerInventoryController };
