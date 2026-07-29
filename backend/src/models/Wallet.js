const mongoose = require('mongoose');

const walletSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
    balance: { type: Number, default: 0, min: 0 },
    currency: { type: String, default: 'INR' },
    deletedAt: { type: Date, default: null },
  },
  {
    timestamps: true,
    collection: 'wallets',
  }
);

module.exports = mongoose.models.Wallet || mongoose.model('Wallet', walletSchema);
