const { BaseController } = require('../../core/BaseController');
const { asyncHandler } = require('../../utils/asyncHandler');

class SellerListingController extends BaseController {
  constructor({ marketplaceListingService }) {
    super();
    this.marketplaceListingService = marketplaceListingService;
    this.bindMethods([
      'list',
      'getById',
      'createForProduct',
      'update',
      'publish',
      'unpublish',
      'remove',
      'listByProduct',
    ]);
  }

  list = asyncHandler(async (req, res) => {
    const result = await this.marketplaceListingService.listForSeller(req.sellerId, req.query);
    return this.sendPaginated(res, result.items, result.meta);
  });

  getById = asyncHandler(async (req, res) => {
    const listing = await this.marketplaceListingService.getListingForSeller(req.sellerId, req.params.id);
    return this.sendSuccess(res, listing);
  });

  createForProduct = asyncHandler(async (req, res) => {
    const listing = await this.marketplaceListingService.createListing(
      req.sellerId,
      req.params.productId,
      req.body
    );
    return this.sendCreated(res, listing);
  });

  update = asyncHandler(async (req, res) => {
    const listing = await this.marketplaceListingService.updateListing(
      req.sellerId,
      req.params.id,
      req.body
    );
    return this.sendSuccess(res, listing);
  });

  publish = asyncHandler(async (req, res) => {
    const listing = await this.marketplaceListingService.publishListing(req.sellerId, req.params.id);
    return this.sendSuccess(res, listing);
  });

  unpublish = asyncHandler(async (req, res) => {
    const listing = await this.marketplaceListingService.unpublishListing(req.sellerId, req.params.id);
    return this.sendSuccess(res, listing);
  });

  remove = asyncHandler(async (req, res) => {
    const result = await this.marketplaceListingService.deleteListing(req.sellerId, req.params.id);
    return this.sendSuccess(res, result);
  });

  listByProduct = asyncHandler(async (req, res) => {
    const listings = await this.marketplaceListingService.listByProduct(req.params.productId, req.sellerId);
    return this.sendSuccess(res, { listings });
  });
}

module.exports = { SellerListingController };
