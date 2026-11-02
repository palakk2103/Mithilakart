const { BaseController } = require('../../core/BaseController');
const { asyncHandler } = require('../../utils/asyncHandler');
const { ApiResponse } = require('../../utils/ApiResponse');

class TranslationController extends BaseController {
  constructor(translationService) {
    super(translationService);
    this.bindMethods(['translate', 'translateBatch']);
  }

  translate = asyncHandler(async (req, res) => {
    const { text, targetLanguage, sourceLanguage = 'en' } = req.body;
    const translatedText = await this.service.translateText(text, targetLanguage, sourceLanguage);
    return ApiResponse.success(res, {
      sourceText: text,
      translatedText,
      sourceLanguage,
      targetLanguage,
    });
  });

  translateBatch = asyncHandler(async (req, res) => {
    const { texts, targetLanguage, sourceLanguage = 'en' } = req.body;
    const translations = new Array(texts.length);
    let cursor = 0;
    const worker = async () => {
      while (cursor < texts.length) {
        const i = cursor;
        cursor += 1;
        translations[i] = await this.service.translateText(texts[i], targetLanguage, sourceLanguage);
      }
    };
    await Promise.all(Array.from({ length: Math.min(5, texts.length) }, worker));
    return ApiResponse.success(res, { translations, sourceLanguage, targetLanguage });
  });
}

module.exports = {
  TranslationController,
};
