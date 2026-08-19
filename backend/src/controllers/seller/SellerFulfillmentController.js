const { BaseController } = require('../../core/BaseController');
const { ApiResponse } = require('../../utils/ApiResponse');
const { asyncHandler } = require('../../utils/asyncHandler');

/**
 * CR-002 — seller fulfillment offers.
 *
 * sellerId always comes from the authenticated token, never the request body,
 * so a seller cannot act on another seller's offer by forging a field.
 */
class SellerFulfillmentController extends BaseController {
  constructor(sellerFulfillmentService) {
    super(sellerFulfillmentService);
    this.bindMethods(['listOffers', 'acceptOffer', 'rejectOffer']);
  }

  _sellerId(req) {
    return req.sellerId || req.user?.sellerId || req.user?.id;
  }

  listOffers = asyncHandler(async (req, res) => {
    const result = await this.service.listOffers(this._sellerId(req));
    return ApiResponse.success(res, result);
  });

  acceptOffer = asyncHandler(async (req, res) => {
    const result = await this.service.acceptOffer({
      sellerId: this._sellerId(req),
      orderId: req.params.id,
      attemptId: req.body.attemptId,
    });
    return ApiResponse.success(res, result);
  });

  rejectOffer = asyncHandler(async (req, res) => {
    const result = await this.service.rejectOffer({
      sellerId: this._sellerId(req),
      orderId: req.params.id,
      attemptId: req.body.attemptId,
      reason: req.body.reason || null,
    });
    // 202 — recorded; reassignment proceeds asynchronously.
    return ApiResponse.success(res, result, null, 202);
  });
}

module.exports = { SellerFulfillmentController };
