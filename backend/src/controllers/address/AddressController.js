const { BaseController } = require('../../core/BaseController');
const { asyncHandler } = require('../../utils/asyncHandler');
const { ApiResponse } = require('../../utils/ApiResponse');

class AddressController extends BaseController {
  constructor(addressService) {
    super(addressService);
    this.bindMethods(['list', 'create', 'update', 'remove', 'setDefault']);
  }

  list = asyncHandler(async (req, res) => {
    const data = await this.service.list(req.user.id);
    return ApiResponse.success(res, data);
  });

  create = asyncHandler(async (req, res) => {
    const data = await this.service.create(req.user.id, req.body);
    return ApiResponse.created(res, data);
  });

  update = asyncHandler(async (req, res) => {
    const data = await this.service.update(req.user.id, req.params.id, req.body);
    return ApiResponse.success(res, data);
  });

  remove = asyncHandler(async (req, res) => {
    const data = await this.service.remove(req.user.id, req.params.id);
    return ApiResponse.success(res, data);
  });

  setDefault = asyncHandler(async (req, res) => {
    const data = await this.service.setDefault(req.user.id, req.params.id);
    return ApiResponse.success(res, data);
  });
}

module.exports = { AddressController };
