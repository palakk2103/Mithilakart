const mongoose = require('mongoose');
const {
  GAME_REWARD_TYPE_VALUES,
  GAME_SESSION_STATUS_VALUES,
} = require('../constants/game');

/**
 * One play attempt of "Catch Your Delivery". Outcome (win/lose, reward type,
 * reward value) is decided and stored server-side at start() — the client
 * only reports that the play finished, never the result.
 *
 * `orderId` + `attemptNumber` carries the real anti-replay guarantee: unlike
 * WalletTransaction/Refund/Order's idempotencyKey (indexed but NOT unique —
 * a real race in the existing codebase, left as-is there; see gap matrix),
 * this index IS unique, so two concurrent claim attempts for the same
 * order+attempt cannot both succeed even under a genuine race.
 */
const gameSessionSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true, index: true },
    attemptNumber: { type: Number, required: true, min: 1 },
    status: { type: String, enum: GAME_SESSION_STATUS_VALUES, default: 'started', index: true },
    won: { type: Boolean, default: false },
    rewardType: { type: String, enum: GAME_REWARD_TYPE_VALUES, default: 'none' },
    rewardValue: { type: Number, default: 0, min: 0 },
    rewardLabel: { type: String, default: null },
    walletTransactionId: { type: mongoose.Schema.Types.ObjectId, ref: 'WalletTransaction', default: null },
    claimedAt: { type: Date, default: null },
    expiresAt: { type: Date, required: true },
    deletedAt: { type: Date, default: null },
  },
  {
    timestamps: true,
    collection: 'game_sessions',
  }
);

gameSessionSchema.index({ orderId: 1, attemptNumber: 1 }, { unique: true });
gameSessionSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.models.GameSession || mongoose.model('GameSession', gameSessionSchema);
