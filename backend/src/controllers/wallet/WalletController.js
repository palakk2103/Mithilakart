const { BaseController } = require('../../core/BaseController');
const { ApiResponse } = require('../../utils/ApiResponse');
const { asyncHandler } = require('../../utils/asyncHandler');

class WalletController extends BaseController {
  constructor(walletService) {
    super(walletService);
    this.bindMethods(['getWallet', 'listTransactions']);
  }

  getWallet = asyncHandler(async (req, res) => {
    const data = await this.service.getBalance(req.user.id);
    return ApiResponse.success(res, data);
  });

  listTransactions = asyncHandler(async (req, res) => {
    const result = await this.service.listTransactions(req.user.id, req.query);
    return ApiResponse.success(res, result);
  });
}

module.exports = { WalletController };
