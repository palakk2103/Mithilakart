const { BaseController } = require('../../core/BaseController');
const { ApiResponse } = require('../../utils/ApiResponse');
const { asyncHandler } = require('../../utils/asyncHandler');

class SellerNotificationController extends BaseController {
  constructor(notificationService) {
    super(notificationService);
    this.bindMethods(['list', 'markRead', 'markAllRead', 'registerDevice', 'testPush']);
  }

  list = asyncHandler(async (req, res) => {
    const data = await this.service.list(req.sellerId, req.query);
    return ApiResponse.success(res, data);
  });

  markRead = asyncHandler(async (req, res) => {
    const data = await this.service.markRead(req.sellerId, req.params.id);
    return ApiResponse.success(res, data);
  });

  markAllRead = asyncHandler(async (req, res) => {
    const data = await this.service.markAllRead(req.sellerId);
    return ApiResponse.success(res, data);
  });

  registerDevice = asyncHandler(async (req, res) => {
    const data = await this.service.registerDeviceToken(
      req.sellerId,
      req.body.deviceId,
      req.body.fcmToken,
      req.body.platform || 'web'
    );
    return ApiResponse.success(res, data);
  });

  testPush = asyncHandler(async (req, res) => {
    const data = await this.service.sendTestPush(
      req.sellerId,
      req.body || {}
    );
    return ApiResponse.success(res, data);
  });
}

module.exports = { SellerNotificationController };
