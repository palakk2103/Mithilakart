const mongoose = require('mongoose');

const transactionLedgerSchema = new mongoose.Schema(
  {
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', default: null, index: true },
    party: {
      type: String,
      enum: ['seller', 'delivery_partner', 'admin'],
      required: true,
      index: true,
    },
    partyId: { type: mongoose.Schema.Types.ObjectId, default: null, index: true },
    amount: { type: Number, required: true },
    type: {
      type: String,
      enum: ['payout', 'commission', 'cod_due', 'settlement'],
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['pending', 'completed', 'cancelled'],
      default: 'completed',
      index: true,
    },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
    settledAt: { type: Date, default: null },
    settledBy: { type: mongoose.Schema.Types.ObjectId, ref: 'AdminUser', default: null },
    deletedAt: { type: Date, default: null },
  },
  {
    timestamps: true,
    collection: 'transactions_ledger',
  }
);

transactionLedgerSchema.index({ party: 1, partyId: 1, createdAt: -1 });
transactionLedgerSchema.index({ orderId: 1, type: 1 });

module.exports =
  mongoose.models.TransactionLedger ||
  mongoose.model('TransactionLedger', transactionLedgerSchema);
