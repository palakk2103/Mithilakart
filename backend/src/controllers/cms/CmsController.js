const { BaseController } = require('../../core/BaseController');
const { asyncHandler } = require('../../utils/asyncHandler');
const { ApiResponse } = require('../../utils/ApiResponse');

class CmsController extends BaseController {
  constructor(cmsService) {
    super(cmsService);
    this.bindMethods([
      'getPage',
      'getLegalPage',
      'listBanners',
      'createBanner',
      'updateBanner',
      'deleteBanner',
      'listChips',
      'createChip',
      'updateChip',
      'deleteChip',
      'listSections',
      'updateSection',
      'reorderSections',
      'getAdminPage',
      'upsertAdminPage',
      'upsertLegalPage',
    ]);
  }

  getPage = asyncHandler(async (req, res) => {
    const data = await this.service.getCmsPage(req.params.slug);
    return ApiResponse.success(res, data);
  });

  getLegalPage = asyncHandler(async (req, res) => {
    const data = await this.service.getLegalPage(req.params.type);
    return ApiResponse.success(res, data);
  });

  listBanners = asyncHandler(async (req, res) => {
    const data = await this.service.listBanners();
    return ApiResponse.success(res, data);
  });

  createBanner = asyncHandler(async (req, res) => {
    const data = await this.service.createBanner(req.body);
    return ApiResponse.created(res, data);
  });

  updateBanner = asyncHandler(async (req, res) => {
    const data = await this.service.updateBanner(req.params.id, req.body);
    return ApiResponse.success(res, data);
  });

  deleteBanner = asyncHandler(async (req, res) => {
    await this.service.deleteBanner(req.params.id);
    return ApiResponse.noContent(res);
  });

  listChips = asyncHandler(async (req, res) => {
    const data = await this.service.listChips();
    return ApiResponse.success(res, data);
  });

  createChip = asyncHandler(async (req, res) => {
    const data = await this.service.createChip(req.body);
    return ApiResponse.created(res, data);
  });

  updateChip = asyncHandler(async (req, res) => {
    const data = await this.service.updateChip(req.params.id, req.body);
    return ApiResponse.success(res, data);
  });

  deleteChip = asyncHandler(async (req, res) => {
    await this.service.deleteChip(req.params.id);
    return ApiResponse.noContent(res);
  });

  listSections = asyncHandler(async (req, res) => {
    const data = await this.service.listSections(req.query.commerceFlow || 'standard');
    return ApiResponse.success(res, data);
  });

  updateSection = asyncHandler(async (req, res) => {
    const data = await this.service.updateSection(
      req.params.sectionKey,
      req.query.commerceFlow || 'standard',
      req.body
    );
    return ApiResponse.success(res, data);
  });

  reorderSections = asyncHandler(async (req, res) => {
    const data = await this.service.reorderSections(req.body.commerceFlow, req.body.orderedKeys);
    return ApiResponse.success(res, data);
  });

  getAdminPage = asyncHandler(async (req, res) => {
    const data = await this.service.getAdminCmsPage(req.params.slug);
    return ApiResponse.success(res, data);
  });

  upsertAdminPage = asyncHandler(async (req, res) => {
    const data = await this.service.upsertCmsPage(req.params.slug, req.body, req.user.id);
    return ApiResponse.success(res, data);
  });

  upsertLegalPage = asyncHandler(async (req, res) => {
    const data = await this.service.upsertLegalPage(req.params.type, req.body, req.user.id);
    return ApiResponse.success(res, data);
  });
}

module.exports = {
  CmsController,
};
