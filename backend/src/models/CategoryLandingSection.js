const mongoose = require('mongoose');

const LANDING_SECTION_TYPES = ['manual', 'best_sellers', 'new_arrivals', 'top_deals', 'category_products'];

const categoryLandingSectionSchema = new mongoose.Schema(
  {
    categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
    title: { type: String, required: true, trim: true },
    subtitle: { type: String, default: '', trim: true },
    sectionType: { type: String, enum: LANDING_SECTION_TYPES, default: 'manual' },
    productIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
    productLimit: { type: Number, default: 8, min: 1, max: 24 },
    imageUrl: { type: String, default: null },
    ctaText: { type: String, default: '' },
    ctaLink: { type: String, default: null },
    startDate: { type: Date, default: null },
    endDate: { type: Date, default: null },
    sortOrder: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true, collection: 'category_landing_sections' }
);

categoryLandingSectionSchema.index({ categoryId: 1, isActive: 1, sortOrder: 1 });

module.exports =
  mongoose.models.CategoryLandingSection ||
  mongoose.model('CategoryLandingSection', categoryLandingSectionSchema);
module.exports.LANDING_SECTION_TYPES = LANDING_SECTION_TYPES;
