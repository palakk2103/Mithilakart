const { BaseController } = require('../../core/BaseController');
const { ApiResponse } = require('../../utils/ApiResponse');
const { asyncHandler } = require('../../utils/asyncHandler');

class GameController extends BaseController {
  constructor(gameService) {
    super(gameService);
    this.bindMethods(['getEligibility', 'startSession', 'claimSession']);
  }

  getEligibility = asyncHandler(async (req, res) => {
    const data = await this.service.getPlayEligibility({ orderId: req.params.id, userId: req.user.id });
    return ApiResponse.success(res, data);
  });

  startSession = asyncHandler(async (req, res) => {
    const data = await this.service.startSession({ orderId: req.params.id, userId: req.user.id });
    return ApiResponse.success(res, data);
  });

  claimSession = asyncHandler(async (req, res) => {
    const data = await this.service.claimSession({ sessionId: req.params.sessionId, userId: req.user.id });
    return ApiResponse.success(res, data);
  });
}

module.exports = { GameController };
