const { BaseController } = require('../../core/BaseController');
const { asyncHandler } = require('../../utils/asyncHandler');
const { ApiResponse } = require('../../utils/ApiResponse');

class AlreadyBoughtController extends BaseController {
  constructor(alreadyBoughtService) {
    super(alreadyBoughtService);
    this.bindMethods(['list']);
  }

  list = asyncHandler(async (req, res) => {
    // Personal purchase data must never be cached by browsers or shared proxies.
    res.set('Cache-Control', 'private, no-store');
    // Identity comes only from the verified token, never from the request.
    const data = await this.service.list(req.user.id, req.query);
    return ApiResponse.success(res, data);
  });
}

module.exports = { AlreadyBoughtController };
