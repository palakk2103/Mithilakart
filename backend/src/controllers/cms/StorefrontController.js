const { BaseController } = require('../../core/BaseController');
const { asyncHandler } = require('../../utils/asyncHandler');
const { ApiResponse } = require('../../utils/ApiResponse');

class StorefrontController extends BaseController {
  constructor(storefrontService) {
    super(storefrontService);
    this.bindMethods(['getHome', 'getFlowHome', 'getBanners', 'getConfig', 'getHeaderTabs']);
  }

  getHome = asyncHandler(async (req, res) => {
    const data = await this.service.getHome(req.query.commerceFlow || 'standard');
    return ApiResponse.success(res, data);
  });

  getFlowHome = asyncHandler(async (req, res) => {
    const data = await this.service.getHome(req.params.flow);
    return ApiResponse.success(res, data);
  });

  getBanners = asyncHandler(async (req, res) => {
    const data = await this.service.getBanners(req.query.commerceFlow || 'standard');
    return ApiResponse.success(res, data);
  });

  getConfig = asyncHandler(async (req, res) => {
    const data = await this.service.getPublicConfig();
    return ApiResponse.success(res, data);
  });

  getHeaderTabs = asyncHandler(async (req, res) => {
    const data = await this.service.getHeaderTabs();
    return ApiResponse.success(res, data);
  });
}

module.exports = {
  StorefrontController,
};
