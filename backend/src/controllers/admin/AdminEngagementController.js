const { BaseController } = require('../../core/BaseController');
const { ApiResponse } = require('../../utils/ApiResponse');
const { asyncHandler } = require('../../utils/asyncHandler');

class AdminEngagementController extends BaseController {
  constructor(reviewService, qnaService) {
    super(reviewService);
    this.qnaService = qnaService;
    this.bindMethods([
      'listReviews',
      'moderateReview',
      'listQuestions',
      'moderateQuestion',
    ]);
  }

  listReviews = asyncHandler(async (req, res) => {
    const result = await this.service.listForAdmin(req.query);
    return ApiResponse.paginated(res, result.items, result.meta);
  });

  moderateReview = asyncHandler(async (req, res) => {
    const data = await this.service.moderateReview(
      req.params.id,
      req.body.action,
      req.user.id,
      req.body.note
    );
    return ApiResponse.success(res, data);
  });

  listQuestions = asyncHandler(async (req, res) => {
    const result = await this.qnaService.listForAdmin(req.query);
    return ApiResponse.paginated(res, result.items, result.meta);
  });

  moderateQuestion = asyncHandler(async (req, res) => {
    const data = await this.qnaService.moderateQuestion(
      req.params.id,
      req.body.action,
      req.user.id
    );
    return ApiResponse.success(res, data);
  });
}

module.exports = { AdminEngagementController };
