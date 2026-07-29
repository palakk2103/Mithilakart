const { BaseController } = require('../../core/BaseController');
const { asyncHandler } = require('../../utils/asyncHandler');
const { ApiResponse } = require('../../utils/ApiResponse');

class DeliveryAuthController extends BaseController {
  constructor(deliveryAuthService) {
    super(deliveryAuthService);
    this.bindMethods(['sendOtp', 'verifyOtp', 'signup', 'refresh', 'logout']);
  }

  _sessionMeta(req) {
    return {
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'] || null,
    };
  }

  sendOtp = asyncHandler(async (req, res) => {
    const result = await this.service.sendOtp(req.body);
    return ApiResponse.success(res, result);
  });

  verifyOtp = asyncHandler(async (req, res) => {
    const result = await this.service.verifyOtp(req.body, this._sessionMeta(req));
    return ApiResponse.success(res, result);
  });

  signup = asyncHandler(async (req, res) => {
    const result = await this.service.signup(req.body);
    return ApiResponse.created(res, result);
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
  DeliveryAuthController,
};
