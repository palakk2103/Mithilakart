const mongoose = require('mongoose');

const translationCacheSchema = new mongoose.Schema(
  {
    hash: { type: String, required: true, unique: true, index: true },
    sourceText: { type: String, required: true },
    from: { type: String, default: 'en' },
    to: { type: String, required: true },
    translatedText: { type: String, required: true },
  },
  {
    timestamps: true,
    collection: 'translation_cache',
  }
);

translationCacheSchema.index({ from: 1, to: 1 });

module.exports = mongoose.models.TranslationCache || mongoose.model('TranslationCache', translationCacheSchema);
