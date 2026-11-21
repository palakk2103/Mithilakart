const mongoose = require('mongoose');

/**
 * Named, atomically incremented counters (collection `counters`).
 * Used for human-readable sequential ids such as the customer id.
 */
const counterSchema = new mongoose.Schema(
  {
    _id: { type: String, required: true },
    seq: { type: Number, default: 0 },
  },
  { collection: 'counters', versionKey: false }
);

module.exports = mongoose.models.Counter || mongoose.model('Counter', counterSchema);
