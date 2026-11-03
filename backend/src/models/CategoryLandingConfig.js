const mongoose = require('mongoose');

// One document per main category. Absent document == defaults (enabled, natural order).
const categoryLandingConfigSchema = new mongoose.Schema(
  {
    categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
    enabled: { type: Boolean, default: true },
    // e.g. ["banner", "subcategories", "section:<id>", ...]
    blockOrder: { type: [String], default: [] },
  },
  { timestamps: true, collection: 'category_landing_configs' }
);

categoryLandingConfigSchema.index({ categoryId: 1 }, { unique: true });

module.exports =
  mongoose.models.CategoryLandingConfig ||
  mongoose.model('CategoryLandingConfig', categoryLandingConfigSchema);
