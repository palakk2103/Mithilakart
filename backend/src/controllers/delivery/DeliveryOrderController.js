const { BaseController } = require('../../core/BaseController');
const { ApiResponse } = require('../../utils/ApiResponse');
const { asyncHandler } = require('../../utils/asyncHandler');

class DeliveryOrderController extends BaseController {
  constructor(deliveryOrderService) {
    super(deliveryOrderService);
    this.bindMethods(['listOrders', 'getOrderDetail', 'acceptOrder', 'confirmPickup', 'confirmDelivery', 'rejectOrder', 'markDeliveryFailed', 'getProfile', 'updateProfile', 'updateLocation', 'registerDevice']);
  }

  listOrders = asyncHandler(async (req, res) => {
    const data = await this.service.listOrders(req.partnerId);
    return ApiResponse.success(res, data);
  });

  getOrderDetail = asyncHandler(async (req, res) => {
    const data = await this.service.getOrderDetail(req.partnerId, req.params.id);
    return ApiResponse.success(res, data);
  });

  acceptOrder = asyncHandler(async (req, res) => {
    const data = await this.service.acceptOrder(req.partnerId, req.params.id);
    return ApiResponse.success(res, data);
  });

  confirmPickup = asyncHandler(async (req, res) => {
    const data = await this.service.confirmPickup(req.partnerId, req.params.id, req.body.otp);
    return ApiResponse.success(res, data);
  });

  confirmDelivery = asyncHandler(async (req, res) => {
    const data = await this.service.confirmDelivery(req.partnerId, req.params.id, req.body.otp);
    return ApiResponse.success(res, data);
  });

  rejectOrder = asyncHandler(async (req, res) => {
    const data = await this.service.rejectOrder(req.partnerId, req.params.id, req.body.reason);
    return ApiResponse.success(res, data);
  });

  markDeliveryFailed = asyncHandler(async (req, res) => {
    const data = await this.service.markDeliveryFailed(req.partnerId, req.params.id, req.body.reason);
    return ApiResponse.success(res, data);
  });

  updateProfile = asyncHandler(async (req, res) => {
    const data = await this.service.updateProfile(req.partnerId, req.body);
    return ApiResponse.success(res, data);
  });

  getProfile = asyncHandler(async (req, res) => {
    const data = await this.service.getProfile(req.partnerId);
    return ApiResponse.success(res, data);
  });

  updateLocation = asyncHandler(async (req, res) => {
    const data = await this.service.updateLocation(req.partnerId, req.body);
    return ApiResponse.success(res, data);
  });

  registerDevice = asyncHandler(async (req, res) => {
    const data = await this.service.registerDeviceToken(
      req.partnerId,
      req.body.deviceId,
      req.body.fcmToken,
      req.body.platform || 'web'
    );
    return ApiResponse.success(res, data);
  });
}

module.exports = { DeliveryOrderController };
