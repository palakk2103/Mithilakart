const mongoose = require('mongoose');

const taxConfigSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    rate: { type: Number, required: true, min: 0, max: 1 },
    region: { type: String, default: 'IN' },
    isActive: { type: Boolean, default: true },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true, collection: 'tax_configs' }
);

module.exports = mongoose.models.TaxConfig || mongoose.model('TaxConfig', taxConfigSchema);
