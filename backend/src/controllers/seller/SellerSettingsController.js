const { BaseController } = require('../../core/BaseController');
const { ApiResponse } = require('../../utils/ApiResponse');
const { asyncHandler } = require('../../utils/asyncHandler');

class SellerSettingsController extends BaseController {
  constructor(settingsService) {
    super(settingsService);
    this.bindMethods(['getProfile', 'updateProfile', 'updateBank', 'updatePassword', 'updateNotifications']);
  }

  getProfile = asyncHandler(async (req, res) => {
    const data = await this.service.getProfile(req.sellerId);
    return ApiResponse.success(res, data);
  });

  updateProfile = asyncHandler(async (req, res) => {
    const data = await this.service.updateProfile(req.sellerId, req.body);
    return ApiResponse.success(res, data);
  });

  updateBank = asyncHandler(async (req, res) => {
    const data = await this.service.updateBank(req.sellerId, req.body);
    return ApiResponse.success(res, data);
  });

  updatePassword = asyncHandler(async (req, res) => {
    const data = await this.service.updatePassword(req.sellerId, req.body);
    return ApiResponse.success(res, data);
  });

  updateNotifications = asyncHandler(async (req, res) => {
    const data = await this.service.updateNotifications(req.sellerId, req.body);
    return ApiResponse.success(res, data);
  });
}

module.exports = { SellerSettingsController };
