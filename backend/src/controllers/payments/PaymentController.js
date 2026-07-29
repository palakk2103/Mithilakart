const { BaseController } = require('../../core/BaseController');
const { ApiResponse } = require('../../utils/ApiResponse');
const { asyncHandler } = require('../../utils/asyncHandler');
const { AppError } = require('../../utils/AppError');
const { ORDER_STATUS, CART } = require('../../constants/commerce');

class PaymentController extends BaseController {
  constructor(paymentService, orderRepository) {
    super(paymentService);
    this.orderRepository = orderRepository;
    this.bindMethods(['initiatePayment', 'verifyPayment', 'razorpayWebhook']);
  }

  initiatePayment = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const order = await this.orderRepository.findActiveById(req.body.orderId, userId);
    if (!order) throw AppError.notFound('Order not found');
    if (order.status === ORDER_STATUS.CANCELLED) throw AppError.conflict('Order is cancelled');

    const result = await this.service.initiatePayment({
      userId,
      orderId: order._id,
      orderNumber: order.orderNumber,
      paymentMethod: req.body.paymentMethod,
      amount: order.total,
      currency: CART.DEFAULT_CURRENCY,
      idempotencyKey: req.body.idempotencyKey || null,
      sessionMeta: {},
    });

    return ApiResponse.success(res, result);
  });

  verifyPayment = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const result = await this.service.verifyPayment({
      userId,
      orderId: req.body.orderId,
      providerPaymentId: req.body.providerPaymentId,
      providerOrderId: req.body.providerOrderId || null,
      signature: req.body.signature || null,
      sessionMeta: {},
    });

    return ApiResponse.success(res, result);
  });

  razorpayWebhook = asyncHandler(async (req, res) => {
    const provider = 'razorpay';
    const signature = req.headers['x-razorpay-signature'] || req.headers['X-Razorpay-Signature'] || null;

    const result = await this.service.handleRazorpayWebhook({
      provider,
      payload: req.body,
      signature,
      rawBody: req.rawBody || null,
    });

    return ApiResponse.success(res, result);
  });
}

module.exports = {
  PaymentController,
};

