const { BaseService } = require('../../core/BaseService');
const { AppError } = require('../../utils/AppError');
const { withTransaction } = require('../../database');

const MIN_PAYOUT_AMOUNT = 100;

class PayoutService extends BaseService {
  constructor({ sellerPayoutRepository, sellerRepository, sellerEarningRepository }) {
    super();
    this.sellerPayoutRepository = sellerPayoutRepository;
    this.sellerRepository = sellerRepository;
    this.sellerEarningRepository = sellerEarningRepository;
  }

  async requestPayout(sellerId, amount) {
    if (amount < MIN_PAYOUT_AMOUNT) {
      throw AppError.validation(`Minimum payout amount is ${MIN_PAYOUT_AMOUNT}`);
    }

    return withTransaction(async (session) => {
      const seller = await this.sellerRepository.findById(sellerId, { session });
      if (!seller) throw AppError.notFound('Seller not found');

      if ((seller.balance || 0) < amount) {
        throw AppError.conflict('Insufficient balance for payout');
      }

      const payout = await this.sellerPayoutRepository.create(
        {
          sellerId,
          amount,
          status: 'pending',
          bankSnapshot: seller.bankDetails || {},
        },
        session
      );

      await this.sellerRepository.updateById(
        sellerId,
        { balance: (seller.balance || 0) - amount },
        session
      );

      await this.sellerEarningRepository.create(
        {
          sellerId,
          grossAmount: amount,
          commission: 0,
          netAmount: -amount,
          type: 'payout',
          referenceId: payout._id,
          note: 'Payout request',
        },
        session
      );

      return payout;
    });
  }
}

module.exports = { PayoutService };
