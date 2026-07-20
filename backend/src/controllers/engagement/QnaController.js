const { BaseController } = require('../../core/BaseController');
const { ApiResponse } = require('../../utils/ApiResponse');
const { asyncHandler } = require('../../utils/asyncHandler');

class QnaController extends BaseController {
  constructor(qnaService) {
    super(qnaService);
    this.bindMethods(['ask', 'listByProduct', 'listMine']);
  }

  ask = asyncHandler(async (req, res) => {
    const data = await this.service.ask(req.user.id, req.params.id, req.body.question);
    return ApiResponse.created(res, data);
  });

  listByProduct = asyncHandler(async (req, res) => {
    const result = await this.service.listByProduct(req.params.id, req.query);
    return ApiResponse.success(res, result);
  });

  listMine = asyncHandler(async (req, res) => {
    const result = await this.service.listByUser(req.user.id, req.query);
    return ApiResponse.success(res, result);
  });
}

module.exports = { QnaController };
