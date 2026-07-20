const mongoose = require('mongoose');
const { COMMERCE_FLOW_VALUES, HOME_SECTION_KEYS } = require('../constants/catalog');

const homeSectionSchema = new mongoose.Schema(
  {
    sectionKey: { type: String, enum: HOME_SECTION_KEYS, required: true },
    title: { type: String, required: true, trim: true },
    productIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
    commerceFlow: { type: String, enum: COMMERCE_FLOW_VALUES, default: 'standard' },
    isActive: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 },
  },
  {
    timestamps: true,
    collection: 'home_sections',
  }
);

homeSectionSchema.index({ sectionKey: 1, commerceFlow: 1 }, { unique: true });

module.exports = mongoose.models.HomeSection || mongoose.model('HomeSection', homeSectionSchema);
