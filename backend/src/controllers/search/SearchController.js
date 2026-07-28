const { BaseController } = require('../../core/BaseController');
const { ApiResponse } = require('../../utils/ApiResponse');
const { asyncHandler } = require('../../utils/asyncHandler');

class SearchController extends BaseController {
  constructor(searchService) {
    super(searchService);
    this.bindMethods(['search']);
  }

  search = asyncHandler(async (req, res) => {
    const result = await this.service.searchProducts(req.query);
    return ApiResponse.paginated(res, result.items, {
      ...result.meta,
      query: result.query,
    });
  });
}

module.exports = { SearchController };
