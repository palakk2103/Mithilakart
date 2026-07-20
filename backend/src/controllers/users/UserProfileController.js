const { BaseController } = require('../../core/BaseController');
const { asyncHandler } = require('../../utils/asyncHandler');
const { ApiResponse } = require('../../utils/ApiResponse');

class UserProfileController extends BaseController {
  constructor(userProfileService) {
    super(userProfileService);
    this.bindMethods(['getMe', 'updateMe']);
  }

  getMe = asyncHandler(async (req, res) => {
    const data = await this.service.getProfile(req.user.id);
    return ApiResponse.success(res, data);
  });

  updateMe = asyncHandler(async (req, res) => {
    const data = await this.service.updateProfile(req.user.id, req.body);
    return ApiResponse.success(res, data);
  });
}

module.exports = { UserProfileController };
