const mongoose = require('mongoose');

const commissionRuleSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    rate: { type: Number, required: true, min: 0, max: 1 },
    categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', default: null },
    sellerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Seller', default: null },
    isDefault: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true, collection: 'commission_rules' }
);

module.exports = mongoose.models.CommissionRule || mongoose.model('CommissionRule', commissionRuleSchema);
