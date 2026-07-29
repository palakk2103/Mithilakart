const { BaseService } = require('../../core/BaseService');
const { AppError } = require('../../utils/AppError');
const { withTransaction } = require('../../database');
const { WALLET_TX_TYPE } = require('../../constants/wallet');

class WalletService extends BaseService {
  constructor({ walletRepository, walletTransactionRepository }) {
    super();
    this.walletRepository = walletRepository;
    this.walletTransactionRepository = walletTransactionRepository;
  }

  async getOrCreateWallet(userId, session = null) {
    let wallet = await this.walletRepository.findByUserId(userId, { session });
    if (!wallet) {
      wallet = await this.walletRepository.create({ userId, balance: 0 }, session);
    }
    return wallet;
  }

  async getBalance(userId) {
    const wallet = await this.getOrCreateWallet(userId);
    return {
      balance: wallet.balance,
      currency: wallet.currency || 'INR',
      walletId: wallet._id,
    };
  }

  async listTransactions(userId, query = {}) {
    const page = Number(query.page) || 1;
    const limit = Math.min(Number(query.limit) || 20, 100);
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      this.walletTransactionRepository.findByUserId(userId, { sort: '-createdAt', skip, limit }),
      this.walletTransactionRepository.countByUserId(userId),
    ]);

    return { items, total, page, limit };
  }

  async credit({ userId, amount, referenceType, referenceId, description, idempotencyKey = null, session = null }) {
    if (amount <= 0) throw AppError.validation('Credit amount must be positive');

    if (idempotencyKey) {
      const existing = await this.walletTransactionRepository.findByIdempotencyKey(idempotencyKey);
      if (existing) return existing;
    }

    const run = async (txSession) => {
      const wallet = await this.getOrCreateWallet(userId, txSession);
      const updated = await this.walletRepository.incrementBalance(wallet._id, amount, txSession);
      if (updated.balance < 0) throw AppError.conflict('Wallet balance cannot be negative');

      return this.walletTransactionRepository.create({
        walletId: wallet._id,
        userId,
        type: WALLET_TX_TYPE.CREDIT,
        amount,
        balanceAfter: updated.balance,
        referenceType,
        referenceId,
        description,
        idempotencyKey,
      }, txSession);
    };

    return session ? run(session) : withTransaction(run);
  }

  async debit({ userId, amount, referenceType, referenceId, description, idempotencyKey = null, session = null }) {
    if (amount <= 0) throw AppError.validation('Debit amount must be positive');

    if (idempotencyKey) {
      const existing = await this.walletTransactionRepository.findByIdempotencyKey(idempotencyKey);
      if (existing) return existing;
    }

    const run = async (txSession) => {
      const wallet = await this.getOrCreateWallet(userId, txSession);
      if (wallet.balance < amount) {
        throw AppError.conflict('Insufficient wallet balance');
      }

      const updated = await this.walletRepository.decrementBalance(wallet._id, amount, txSession);

      return this.walletTransactionRepository.create({
        walletId: wallet._id,
        userId,
        type: WALLET_TX_TYPE.DEBIT,
        amount,
        balanceAfter: updated.balance,
        referenceType,
        referenceId,
        description,
        idempotencyKey,
      }, txSession);
    };

    return session ? run(session) : withTransaction(run);
  }
}

module.exports = { WalletService };
