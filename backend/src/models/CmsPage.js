const mongoose = require('mongoose');

const cmsPageSchema = new mongoose.Schema(
  {
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    title: { type: String, required: true, trim: true },
    content: { type: String, required: true },
    version: { type: Number, default: 1 },
    isPublished: { type: Boolean, default: true },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'AdminUser', default: null },
  },
  {
    timestamps: true,
    collection: 'cms_pages',
  }
);

module.exports = mongoose.models.CmsPage || mongoose.model('CmsPage', cmsPageSchema);
