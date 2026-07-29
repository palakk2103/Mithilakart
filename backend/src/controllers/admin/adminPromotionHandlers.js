const { asyncHandler } = require('../../utils/asyncHandler');
const { ApiResponse } = require('../../utils/ApiResponse');

function createAdminPromotionHandlers(services) {
  return {
    listCoupons: asyncHandler(async (req, res) => {
      const result = await services.promotions.listCoupons(req.query);
      return ApiResponse.paginated(res, result.items, { page: result.page, limit: result.limit, total: result.total });
    }),
    createCoupon: asyncHandler(async (req, res) => ApiResponse.created(res, await services.promotions.createCoupon(req.body))),
    updateCoupon: asyncHandler(async (req, res) => ApiResponse.success(res, await services.promotions.updateCoupon(req.params.id, req.body))),
    deleteCoupon: asyncHandler(async (req, res) => ApiResponse.success(res, await services.promotions.deleteCoupon(req.params.id))),

    listFlashSales: asyncHandler(async (req, res) => ApiResponse.success(res, await services.promotions.listFlashSales())),
    createFlashSale: asyncHandler(async (req, res) => ApiResponse.created(res, await services.promotions.createFlashSale(req.body))),
    updateFlashSale: asyncHandler(async (req, res) => ApiResponse.success(res, await services.promotions.updateFlashSale(req.params.id, req.body))),
    deleteFlashSale: asyncHandler(async (req, res) => ApiResponse.success(res, await services.promotions.deleteFlashSale(req.params.id))),
    addFlashSaleProduct: asyncHandler(async (req, res) => ApiResponse.created(res, await services.promotions.addFlashSaleProduct(req.params.id, req.body.productId, req.body.salePrice))),

    listFeaturedProducts: asyncHandler(async (req, res) => ApiResponse.success(res, await services.promotions.listFeaturedProducts())),
    setFeaturedProduct: asyncHandler(async (req, res) => ApiResponse.created(res, await services.promotions.setFeaturedProduct(req.body.productId, req.body.sortOrder))),
    removeFeaturedProduct: asyncHandler(async (req, res) => ApiResponse.success(res, await services.promotions.removeFeaturedProduct(req.params.id))),

    listSubAdmins: asyncHandler(async (req, res) => {
      const result = await services.subAdmins.list(req.query);
      return ApiResponse.paginated(res, result.items, { page: result.page, limit: result.limit, total: result.total });
    }),
    createSubAdmin: asyncHandler(async (req, res) => ApiResponse.created(res, await services.subAdmins.create(req.body))),
    updateSubAdmin: asyncHandler(async (req, res) => ApiResponse.success(res, await services.subAdmins.update(req.params.id, req.body))),
    deleteSubAdmin: asyncHandler(async (req, res) => ApiResponse.success(res, await services.subAdmins.remove(req.params.id))),

    listPayouts: asyncHandler(async (req, res) => {
      const result = await services.finance.listPayouts(req.query);
      return ApiResponse.paginated(res, result.items, { page: result.page, limit: result.limit, total: result.total });
    }),
    updatePayoutStatus: asyncHandler(async (req, res) => ApiResponse.success(res, await services.finance.updatePayoutStatus(req.params.id, req.body))),
  };
}

module.exports = { createAdminPromotionHandlers };
