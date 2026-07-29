const mongoose = require('mongoose');
const { WALLET_TX_TYPE_VALUES, WALLET_TX_REFERENCE_VALUES } = require('../constants/wallet');

const walletTransactionSchema = new mongoose.Schema(
  {
    walletId: { type: mongoose.Schema.Types.ObjectId, ref: 'Wallet', required: true, index: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: { type: String, enum: WALLET_TX_TYPE_VALUES, required: true },
    amount: { type: Number, required: true, min: 0 },
    balanceAfter: { type: Number, required: true, min: 0 },
    referenceType: { type: String, enum: WALLET_TX_REFERENCE_VALUES, required: true },
    referenceId: { type: mongoose.Schema.Types.ObjectId, default: null },
    description: { type: String, default: null },
    idempotencyKey: { type: String, default: null, index: true, sparse: true },
    deletedAt: { type: Date, default: null },
  },
  {
    timestamps: true,
    collection: 'wallet_transactions',
  }
);

walletTransactionSchema.index({ userId: 1, createdAt: -1 });

module.exports =
  mongoose.models.WalletTransaction || mongoose.model('WalletTransaction', walletTransactionSchema);
