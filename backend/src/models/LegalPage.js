const mongoose = require('mongoose');
const { LEGAL_PAGE_TYPE_VALUES } = require('../constants/catalog');

const legalPageSchema = new mongoose.Schema(
  {
    type: { type: String, enum: LEGAL_PAGE_TYPE_VALUES, required: true, unique: true },
    title: { type: String, required: true, trim: true },
    content: { type: String, required: true },
    version: { type: Number, default: 1 },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'AdminUser', default: null },
  },
  {
    timestamps: true,
    collection: 'legal_pages',
  }
);

module.exports = mongoose.models.LegalPage || mongoose.model('LegalPage', legalPageSchema);
