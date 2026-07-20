const { BaseController } = require('../../core/BaseController');
const { asyncHandler } = require('../../utils/asyncHandler');
const { ApiResponse } = require('../../utils/ApiResponse');

class SellerAuthController extends BaseController {
  constructor(sellerAuthService) {
    super(sellerAuthService);
    this.bindMethods(['login', 'sendPhoneOtp', 'register', 'refresh', 'logout']);
  }

  _sessionMeta(req) {
    return {
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'] || null,
    };
  }

  sendPhoneOtp = asyncHandler(async (req, res) => {
    const result = await this.service.sendPhoneOtp(req.body);
    return ApiResponse.success(res, result);
  });

  register = asyncHandler(async (req, res) => {
    const result = await this.service.register(req.body, this._sessionMeta(req));
    return ApiResponse.created(res, result);
  });

  login = asyncHandler(async (req, res) => {
    const result = await this.service.login(req.body, this._sessionMeta(req));
    return ApiResponse.success(res, result);
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
  SellerAuthController,
};
