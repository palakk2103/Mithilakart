const mongoose = require('mongoose');
const { COMMERCE_FLOW_VALUES } = require('../constants/catalog');

const bannerSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    imageUrl: { type: String, required: true },
    linkUrl: { type: String, default: null },
    // Optional category-landing fields. categoryId null = global flow banner (legacy behaviour).
    categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', default: null },
    mobileImageUrl: { type: String, default: null },
    subtitle: { type: String, default: '' },
    ctaText: { type: String, default: '' },
    commerceFlow: { type: String, enum: COMMERCE_FLOW_VALUES, default: 'standard' },
    startDate: { type: Date, default: null },
    endDate: { type: Date, default: null },
    sortOrder: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    deletedAt: { type: Date, default: null },
  },
  {
    timestamps: true,
    collection: 'banners',
  }
);

bannerSchema.index({ commerceFlow: 1, isActive: 1, sortOrder: 1 });
bannerSchema.index({ categoryId: 1, isActive: 1, sortOrder: 1 });

module.exports = mongoose.models.Banner || mongoose.model('Banner', bannerSchema);
