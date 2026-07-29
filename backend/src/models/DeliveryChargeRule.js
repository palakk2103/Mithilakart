const mongoose = require('mongoose');

const deliveryChargeRuleSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    baseCharge: { type: Number, required: true, min: 0 },
    freeAbove: { type: Number, default: null, min: 0 },
    pincodePrefix: { type: String, default: null },
    isActive: { type: Boolean, default: true },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true, collection: 'delivery_charge_rules' }
);

module.exports = mongoose.models.DeliveryChargeRule || mongoose.model('DeliveryChargeRule', deliveryChargeRuleSchema);
