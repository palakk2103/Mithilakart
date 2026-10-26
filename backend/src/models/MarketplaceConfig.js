const mongoose = require('mongoose');
const {
  MARKETPLACE_TAB_VALUES,
  DELIVERY_TYPE_VALUES,
  DELIVERY_PROMISE_MINUTES,
} = require('../constants/marketplace');

const marketplaceConfigSchema = new mongoose.Schema(
  {
    tab: { type: String, enum: MARKETPLACE_TAB_VALUES, required: true, unique: true },
    displayName: { type: String, required: true },
    isActive: { type: Boolean, default: true },
    deliveryModel: { type: String, enum: DELIVERY_TYPE_VALUES, required: true },
    allowedPromiseMinutes: { type: [Number], default: DELIVERY_PROMISE_MINUTES },
    sellerEligibilityRule: {
      type: String,
      enum: ['all_approved', 'mithilak_approved', 'quick_enabled', 'grocery_enabled'],
      default: 'all_approved',
    },
    minCartValue: { type: Number, default: 0 },
    serviceablePincodes: { type: [String], default: [] },

    /**
     * CR-002 — per-tab overrides. null means "inherit the platform setting".
     * Resolution order: this -> PlatformSetting -> DEFAULT_PLATFORM_SETTINGS.
     */
    fulfillmentOverrides: {
      sellerSearchRadiusKm: { type: Number, default: null },
      quickFulfillmentSearchTimeoutSeconds: { type: Number, default: null },
      sellerAcceptanceTimeoutSeconds: { type: Number, default: null },
      warehouseFallbackEnabled: { type: Boolean, default: null },
      courierFallbackEnabled: { type: Boolean, default: null },
    },
  },
  {
    timestamps: true,
    collection: 'marketplace_config',
  }
);

module.exports =
  mongoose.models.MarketplaceConfig
  || mongoose.model('MarketplaceConfig', marketplaceConfigSchema);
