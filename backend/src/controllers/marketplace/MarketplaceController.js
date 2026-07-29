const { BaseController } = require('../../core/BaseController');
const { asyncHandler } = require('../../utils/asyncHandler');

class MarketplaceController extends BaseController {
  constructor({ marketplaceEngineService, marketplaceListingService }) {
    super();
    this.marketplaceEngineService = marketplaceEngineService;
    this.marketplaceListingService = marketplaceListingService;
    this.bindMethods(['listTabs', 'getListing', 'listListings', 'getProductWithListing']);
  }

  listTabs = asyncHandler(async (_req, res) => {
    const tabs = await this.marketplaceEngineService.getActiveTabs();
    return this.sendSuccess(res, { tabs });
  });

  getListing = asyncHandler(async (req, res) => {
    const listing = await this.marketplaceListingService.getPublicListing(req.params.id);
    return this.sendSuccess(res, listing);
  });

  listListings = asyncHandler(async (req, res) => {
    const result = await this.marketplaceListingService.listPublicForTab(req.query);
    return this.sendPaginated(res, result.items, result.meta);
  });

  getProductWithListing = asyncHandler(async (req, res) => {
    const result = await this.marketplaceListingService.getProductWithListing(req.params.id, req.query);
    return this.sendSuccess(res, result);
  });
}

module.exports = { MarketplaceController };
