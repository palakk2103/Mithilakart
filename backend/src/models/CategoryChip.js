const mongoose = require('mongoose');
const { COMMERCE_FLOW_VALUES } = require('../constants/catalog');

const categoryChipSchema = new mongoose.Schema(
  {
    label: { type: String, required: true, trim: true },
    imageUrl: { type: String, default: null },
    categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', default: null },
    commerceFlow: { type: String, enum: COMMERCE_FLOW_VALUES, default: 'standard' },
    sortOrder: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    deletedAt: { type: Date, default: null },
  },
  {
    timestamps: true,
    collection: 'category_chips',
  }
);

categoryChipSchema.index({ commerceFlow: 1, isActive: 1, sortOrder: 1 });

module.exports = mongoose.models.CategoryChip || mongoose.model('CategoryChip', categoryChipSchema);
