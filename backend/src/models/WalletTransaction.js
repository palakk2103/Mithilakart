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
    // Indexed via the PARTIAL unique index declared below, not field-level
    // `index: true` (that would register a second, conflicting index). See
    // Order.js for why `sparse` alone is not safe with a `default: null`
    // field.
    idempotencyKey: { type: String, default: null },
    deletedAt: { type: Date, default: null },
  },
  {
    timestamps: true,
    collection: 'wallet_transactions',
  }
);

walletTransactionSchema.index({ userId: 1, createdAt: -1 });
walletTransactionSchema.index(
  { idempotencyKey: 1 },
  { unique: true, partialFilterExpression: { idempotencyKey: { $type: 'string' } } }
);

module.exports =
  mongoose.models.WalletTransaction || mongoose.model('WalletTransaction', walletTransactionSchema);
