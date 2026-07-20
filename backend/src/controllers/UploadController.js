const { BaseController } = require('../core/BaseController');
const { asyncHandler } = require('../utils/asyncHandler');
const { ApiResponse } = require('../utils/ApiResponse');
const { AppError } = require('../utils/AppError');

class UploadController extends BaseController {
  constructor(uploadService) {
    super(uploadService);
    this.bindMethods(['presign', 'confirm', 'uploadLocal']);
  }

  presign = asyncHandler(async (req, res) => {
    const data = await this.service.createPresignedUpload(req.body);
    return ApiResponse.success(res, data);
  });

  confirm = asyncHandler(async (req, res) => {
    const data = await this.service.confirmUpload(req.body);
    return ApiResponse.success(res, data);
  });

  uploadLocal = asyncHandler(async (req, res) => {
    if (!req.file) {
      throw AppError.upload('File is required');
    }

    const storageKey = req.params.storageKey || req.body.storageKey;
    const data = await this.service.saveLocalUpload(storageKey, req.file.buffer);
    return ApiResponse.success(res, data);
  });
}

module.exports = {
  UploadController,
};
