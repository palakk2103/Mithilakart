const { BaseController } = require('../../core/BaseController');
const { asyncHandler } = require('../../utils/asyncHandler');
const { ApiResponse } = require('../../utils/ApiResponse');

class TranslationController extends BaseController {
  constructor(translationService) {
    super(translationService);
    this.bindMethods(['translate']);
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
}

module.exports = {
  TranslationController,
};
