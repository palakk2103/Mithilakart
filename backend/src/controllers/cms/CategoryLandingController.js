const { BaseController } = require('../../core/BaseController');
const { asyncHandler } = require('../../utils/asyncHandler');
const { ApiResponse } = require('../../utils/ApiResponse');

class CategoryLandingController extends BaseController {
  constructor(service) {
    super(service);
    this.bindMethods(['getPublic', 'getAdmin', 'updateConfig', 'createSection', 'updateSection', 'deleteSection']);
  }

  getPublic = asyncHandler(async (req, res) => {
    const lang = req.language || req.query.lang || 'en';
    return ApiResponse.success(res, await this.service.getPublicLanding(req.params.categoryId, lang, req.query.tab || undefined));
  });

  getAdmin = asyncHandler(async (req, res) =>
    ApiResponse.success(res, await this.service.getAdminLanding(req.params.categoryId)));

  updateConfig = asyncHandler(async (req, res) =>
    ApiResponse.success(res, await this.service.updateConfig(req.params.categoryId, req.body)));

  createSection = asyncHandler(async (req, res) =>
    ApiResponse.created(res, await this.service.createSection(req.params.categoryId, req.body)));

  updateSection = asyncHandler(async (req, res) =>
    ApiResponse.success(res, await this.service.updateSection(req.params.id, req.body)));

  deleteSection = asyncHandler(async (req, res) => {
    await this.service.deleteSection(req.params.id);
    return ApiResponse.noContent(res);
  });
}

module.exports = { CategoryLandingController };
