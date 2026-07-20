jest.mock('../../../src/database', () => ({
  withTransaction: (callback) => callback(null),
}));

const { WalletService } = require('../../../src/services/wallet/WalletService');
const { WALLET_TX_REFERENCE } = require('../../../src/constants/wallet');

describe('WalletService', () => {
  it('credits wallet and records transaction with idempotency', async () => {
    const wallet = { _id: 'wallet1', userId: 'user1', balance: 100, currency: 'INR' };
    const walletRepository = {
      findByUserId: jest.fn().mockResolvedValue(wallet),
      create: jest.fn(),
      incrementBalance: jest.fn().mockResolvedValue({ ...wallet, balance: 150 }),
    };
    const walletTransactionRepository = {
      findByIdempotencyKey: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockResolvedValue({ _id: 'tx1' }),
    };

    const service = new WalletService({ walletRepository, walletTransactionRepository });

    await service.credit({
      userId: 'user1',
      amount: 50,
      referenceType: WALLET_TX_REFERENCE.REFUND,
      referenceId: 'refund1',
      description: 'Refund',
      idempotencyKey: 'idem-1',
    });

    expect(walletTransactionRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'credit',
        amount: 50,
        balanceAfter: 150,
        idempotencyKey: 'idem-1',
      }),
      null
    );
  });
});
