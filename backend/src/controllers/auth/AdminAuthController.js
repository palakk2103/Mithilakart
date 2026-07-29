const { BaseController } = require('../../core/BaseController');
const { asyncHandler } = require('../../utils/asyncHandler');
const { ApiResponse } = require('../../utils/ApiResponse');

class AdminAuthController extends BaseController {
  constructor(adminAuthService) {
    super(adminAuthService);
    this.bindMethods(['login', 'profile', 'changePassword', 'refresh', 'logout']);
  }

  _sessionMeta(req) {
    return {
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'] || null,
    };
  }

  login = asyncHandler(async (req, res) => {
    const result = await this.service.login(req.body, this._sessionMeta(req));
    return ApiResponse.success(res, result);
  });

  profile = asyncHandler(async (req, res) => {
    const result = await this.service.getProfile(req.user.id);
    return ApiResponse.success(res, result);
  });

  changePassword = asyncHandler(async (req, res) => {
    await this.service.changePassword(req.user.id, req.body);
    return ApiResponse.noContent(res);
  });

  refresh = asyncHandler(async (req, res) => {
    const result = await this.service.refresh(req.body.refreshToken, this._sessionMeta(req));
    return ApiResponse.success(res, result);
  });

  logout = asyncHandler(async (req, res) => {
    await this.service.logout({
      refreshToken: req.body.refreshToken,
      accessToken: req.auth?.token,
    });
    return ApiResponse.noContent(res);
  });
}

module.exports = {
  AdminAuthController,
};
