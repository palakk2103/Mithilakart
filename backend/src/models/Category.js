const mongoose = require('mongoose');
const { COMMERCE_FLOW_VALUES } = require('../constants/catalog');
const { MARKETPLACE_TAB_VALUES } = require('../constants/marketplace');

const categorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    description: { type: String, default: '' },
    parentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', default: null },
    imageUrl: { type: String, default: null },
    iconUrl: { type: String, default: null },
    sortOrder: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    commerceFlows: {
      type: [{ type: String, enum: COMMERCE_FLOW_VALUES }],
      default: ['standard'],
    },
    visibleTabs: {
      type: [{ type: String, enum: MARKETPLACE_TAB_VALUES }],
      default: ['mithilakart'],
    },
    deletedAt: { type: Date, default: null },
  },
  {
    timestamps: true,
    collection: 'categories',
  }
);

categorySchema.index({ parentId: 1, sortOrder: 1 });
categorySchema.index({ isActive: 1 });

module.exports = mongoose.models.Category || mongoose.model('Category', categorySchema);
