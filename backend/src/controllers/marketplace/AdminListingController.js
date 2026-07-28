const { BaseController } = require('../../core/BaseController');
const { asyncHandler } = require('../../utils/asyncHandler');

class AdminListingController extends BaseController {
  constructor({ marketplaceListingService }) {
    super();
    this.marketplaceListingService = marketplaceListingService;
    this.bindMethods(['list', 'approve', 'reject', 'suspend']);
  }

  list = asyncHandler(async (req, res) => {
    const result = await this.marketplaceListingService.listForAdmin(req.query);
    return this.sendPaginated(res, result.items, result.meta);
  });

  approve = asyncHandler(async (req, res) => {
    const listing = await this.marketplaceListingService.approveListing(
      req.adminId,
      req.params.id,
      req.body?.note
    );
    return this.sendSuccess(res, listing);
  });

  reject = asyncHandler(async (req, res) => {
    const listing = await this.marketplaceListingService.rejectListing(
      req.adminId,
      req.params.id,
      req.body?.note
    );
    return this.sendSuccess(res, listing);
  });

  suspend = asyncHandler(async (req, res) => {
    const listing = await this.marketplaceListingService.suspendListing(
      req.adminId,
      req.params.id,
      req.body?.note
    );
    return this.sendSuccess(res, listing);
  });
}

module.exports = { AdminListingController };
