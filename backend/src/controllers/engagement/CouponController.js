const { BaseController } = require('../../core/BaseController');
const { ApiResponse } = require('../../utils/ApiResponse');
const { asyncHandler } = require('../../utils/asyncHandler');

class CouponController extends BaseController {
  constructor(couponService) {
    super(couponService);
    this.bindMethods(['listMine', 'validate']);
  }

  listMine = asyncHandler(async (req, res) => {
    const data = await this.service.listForUser(req.user.id);
    return ApiResponse.success(res, data);
  });

  validate = asyncHandler(async (req, res) => {
    const data = await this.service.validateCoupon({
      code: req.body.code,
      subtotal: req.body.subtotal,
      userId: req.user?.id || null,
    });
    return ApiResponse.success(res, data);
  });
}

module.exports = { CouponController };
