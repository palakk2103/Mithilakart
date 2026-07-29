const { BaseRepository } = require('../core/BaseRepository');
const Wallet = require('../models/Wallet');

class WalletRepository extends BaseRepository {
  constructor() {
    super(Wallet);
  }

  async findByUserId(userId, options = {}) {
    return this.findOne({ userId, deletedAt: null }, options);
  }

  async incrementBalance(walletId, amount, session = null) {
    const query = this.model.findByIdAndUpdate(
      walletId,
      { $inc: { balance: amount } },
      { new: true }
    );
    return session ? query.session(session).exec() : query.exec();
  }

  async decrementBalance(walletId, amount, session = null) {
    return this.incrementBalance(walletId, -amount, session);
  }
}

module.exports = { WalletRepository };
