const { BaseController } = require('../../core/BaseController');
const { ApiResponse } = require('../../utils/ApiResponse');
const { asyncHandler } = require('../../utils/asyncHandler');

class OrderController extends BaseController {
  constructor(orderService) {
    super(orderService);
    this.bindMethods([
      'placeOrder',
      'quoteOrder',
      'listOrders',
      'getOrderDetail',
      'getOrderTracking',
      'getOrderFulfillment',
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
      tipAmount: Number(req.body.tipAmount) || 0,
      giftCardCode: req.body.giftCardCode || null,
      useWallet: req.body.useWallet === true,
      expectedTotal: req.body.expectedTotal ?? null,
      sessionMeta: {},
    });

    return ApiResponse.created(res, result);
  });

  quoteOrder = asyncHandler(async (req, res) => ApiResponse.success(res, await this.service.quoteOrder({
    userId: req.user.id,
    items: req.body.items || null,
    commerceFlow: req.body.commerceFlow || 'standard',
    couponCode: req.body.couponCode || null,
    tipAmount: Number(req.body.tipAmount) || 0,
    paymentMethod: req.body.paymentMethod || null,
    giftCardCode: req.body.giftCardCode || null,
    useWallet: req.body.useWallet === true,
  })));

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

  getOrderFulfillment = asyncHandler(async (req, res) => {
    const result = await this.service.getFulfillmentStatus(req.params.id, req.user.id);
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

