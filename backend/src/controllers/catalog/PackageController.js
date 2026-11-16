const { BaseController } = require('../../core/BaseController');
const { ApiResponse } = require('../../utils/ApiResponse');
const { asyncHandler } = require('../../utils/asyncHandler');
const { resolveTabFromQuery } = require('../../utils/marketplaceTab');

class PackageController extends BaseController {
  constructor(packageService) {
    super(packageService);
    this.bindMethods(['list', 'get', 'quote', 'listAdmin', 'create', 'update', 'remove']);
  }

  list = asyncHandler(async (req, res) => {
    const data = await this.service.listPublic({ marketplaceTab: resolveTabFromQuery(req.query) || null });
    return ApiResponse.success(res, data);
  });

  get = asyncHandler(async (req, res) => ApiResponse.success(res, await this.service.getPublic(req.params.id)));

  quote = asyncHandler(async (req, res) => (
    ApiResponse.success(res, await this.service.quotePublic(req.params.id, req.body.selectedItemIds))
  ));

  listAdmin = asyncHandler(async (req, res) => ApiResponse.success(res, await this.service.listAdmin()));

  create = asyncHandler(async (req, res) => ApiResponse.created(res, await this.service.create(req.body)));

  update = asyncHandler(async (req, res) => ApiResponse.success(res, await this.service.update(req.params.id, req.body)));

  remove = asyncHandler(async (req, res) => ApiResponse.success(res, await this.service.remove(req.params.id)));
}

module.exports = { PackageController };
