const { BaseController } = require('../../core/BaseController');
const { asyncHandler } = require('../../utils/asyncHandler');
const { ApiResponse } = require('../../utils/ApiResponse');

class MapsController extends BaseController {
  constructor(nearbyService) {
    super(nearbyService);
    this.bindMethods(['reverseGeocode', 'geocode', 'nearbySellers', 'nearbyProducts']);
  }

  reverseGeocode = asyncHandler(async (req, res) => {
    const data = await this.service.reverseGeocode(req.query);
    return ApiResponse.success(res, data);
  });

  geocode = asyncHandler(async (req, res) => {
    const data = await this.service.geocodeAddress(req.body);
    return ApiResponse.success(res, data);
  });

  nearbySellers = asyncHandler(async (req, res) => {
    const data = await this.service.nearbySellers(req.query);
    return ApiResponse.success(res, data);
  });

  nearbyProducts = asyncHandler(async (req, res) => {
    const result = await this.service.nearbyProducts(req.query);
    return ApiResponse.paginated(res, result.items, {
      ...result.meta,
      sellerCount: result.sellerCount,
      location: result.location,
    });
  });
}

module.exports = { MapsController };
