const { BaseController } = require('../../core/BaseController');
const { ApiResponse } = require('../../utils/ApiResponse');
const { asyncHandler } = require('../../utils/asyncHandler');

class OrderController extends BaseController {
  constructor(orderService) {
    super(orderService);
    this.bindMethods([
      'placeOrder',
      'listOrders',
      'getOrderDetail',
      'getOrderTracking',
      'cancelOrder',
      'updateOrderStatusAsSeller',
      'updateOrderStatusAsAdmin',
      'listOrdersForSeller',
      'getOrderDetailForSeller',
      'listOrdersForAdmin',
      'getOrderDetailForAdmin',
    ]);
  }

  placeOrder = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const result = await this.service.placeOrder({
      userId,
      addressId: req.body.addressId,
      paymentMethod: req.body.paymentMethod,
      couponCode: req.body.couponCode || null,
      commerceFlow: req.body.commerceFlow || 'standard',
      items: req.body.items || null,
      idempotencyKey: req.body.idempotencyKey || null,
      sessionMeta: {},
    });

    return ApiResponse.created(res, result);
  });

  listOrders = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const result = await this.service.listOrders(userId, req.query);
    return ApiResponse.paginated(res, result.items, result.meta);
  });

  getOrderDetail = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const result = await this.service.getOrderDetail(req.params.id, userId);
    return ApiResponse.success(res, result);
  });

  getOrderTracking = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const result = await this.service.getTracking(req.params.id, userId);
    return ApiResponse.success(res, result);
  });

  cancelOrder = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const result = await this.service.cancelOrder(req.params.id, userId);
    return ApiResponse.success(res, result);
  });

  updateOrderStatusAsSeller = asyncHandler(async (req, res) => {
    const sellerId = req.sellerId || req.user.sellerId;
    const result = await this.service.updateStatusAsSeller({
      orderId: req.params.id,
      sellerId,
      toStatus: req.body.status,
      note: req.body.note || null,
    });
    return ApiResponse.success(res, result);
  });

  updateOrderStatusAsAdmin = asyncHandler(async (req, res) => {
    const adminId = req.user.id;
    const result = await this.service.updateStatusAsAdmin({
      orderId: req.params.id,
      adminId,
      toStatus: req.body.status,
      note: req.body.note || null,
    });
    return ApiResponse.success(res, result);
  });

  listOrdersForSeller = asyncHandler(async (req, res) => {
    const result = await this.service.listOrdersForSeller(req.sellerId, req.query);
    return ApiResponse.paginated(res, result.items, result.meta);
  });

  getOrderDetailForSeller = asyncHandler(async (req, res) => {
    const result = await this.service.getOrderDetailForSeller(req.params.id, req.sellerId);
    return ApiResponse.success(res, result);
  });

  listOrdersForAdmin = asyncHandler(async (req, res) => {
    const result = await this.service.listOrdersForAdmin(req.query);
    return ApiResponse.paginated(res, result.items, result.meta);
  });

  getOrderDetailForAdmin = asyncHandler(async (req, res) => {
    const result = await this.service.getOrderDetailForAdmin(req.params.id);
    return ApiResponse.success(res, result);
  });
}

module.exports = {
  OrderController,
};

