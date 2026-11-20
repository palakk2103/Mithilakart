const { BaseController } = require('../../core/BaseController');
const { asyncHandler } = require('../../utils/asyncHandler');
const { ApiResponse } = require('../../utils/ApiResponse');

class CustomerAuthController extends BaseController {
  constructor(customerAuthService) {
    super(customerAuthService);
    this.bindMethods([
      'sendPhoneOtp',
      'verifyPhoneOtp',
      'sendEmailOtp',
      'verifyEmailOtp',
      'registerStart',
      'registerVerifyPhone',
      'registerVerifyEmail',
      'registerResend',
      'logoutAll',
      'refresh',
      'logout',
    ]);
  }

  _sessionMeta(req) {
    return {
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'] || null,
      sessionId: req.cookies?.sessionId || null,
    };
  }

  sendPhoneOtp = asyncHandler(async (req, res) => {
    const result = await this.service.sendPhoneOtp(req.body);
    return ApiResponse.success(res, result);
  });

  verifyPhoneOtp = asyncHandler(async (req, res) => {
    const result = await this.service.verifyPhoneOtp(req.body, this._sessionMeta(req));
    return ApiResponse.success(res, result);
  });

  sendEmailOtp = asyncHandler(async (req, res) => {
    const result = await this.service.sendEmailOtp(req.body);
    return ApiResponse.success(res, result);
  });

  verifyEmailOtp = asyncHandler(async (req, res) => {
    const result = await this.service.verifyEmailOtp(req.body, this._sessionMeta(req));
    return ApiResponse.success(res, result);
  });

  registerStart = asyncHandler(async (req, res) => {
    const result = await this.service.registerStart(req.body);
    return ApiResponse.success(res, result);
  });

  registerVerifyPhone = asyncHandler(async (req, res) => {
    const result = await this.service.registerVerifyPhone(req.body);
    return ApiResponse.success(res, result);
  });

  registerVerifyEmail = asyncHandler(async (req, res) => {
    const result = await this.service.registerVerifyEmail(req.body, this._sessionMeta(req));
    return ApiResponse.created(res, result);
  });

  registerResend = asyncHandler(async (req, res) => {
    const result = await this.service.registerResend(req.body);
    return ApiResponse.success(res, result);
  });

  logoutAll = asyncHandler(async (req, res) => {
    await this.service.logoutAll({ userId: req.user.id, accessToken: req.auth?.token });
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
  CustomerAuthController,
};
