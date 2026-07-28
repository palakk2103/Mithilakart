const { BaseController } = require('../../core/BaseController');
const { ApiResponse } = require('../../utils/ApiResponse');
const { asyncHandler } = require('../../utils/asyncHandler');

class SellerQnaController extends BaseController {
  constructor(qnaService) {
    super(qnaService);
    this.bindMethods(['list', 'answer']);
  }

  list = asyncHandler(async (req, res) => {
    const result = await this.service.listBySeller(req.sellerId, req.query);
    return ApiResponse.paginated(res, result.items, result.meta);
  });

  answer = asyncHandler(async (req, res) => {
    const data = await this.service.answer(
      req.params.id,
      'seller',
      req.sellerId,
      req.body.answer
    );
    return ApiResponse.success(res, data);
  });
}

module.exports = { SellerQnaController };
