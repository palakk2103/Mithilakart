const express = require('express');
const Joi = require('joi');
const { validateBody } = require('../../middleware/validate');
const { SUPPORTED_LANGUAGES } = require('../../services/translation/TranslationService');

const translateSchema = Joi.object({
  text: Joi.string().trim().max(2000).required(),
  targetLanguage: Joi.string().valid(...SUPPORTED_LANGUAGES).required(),
  sourceLanguage: Joi.string().valid(...SUPPORTED_LANGUAGES).default('en'),
});

function createTranslationRoutes(translationController) {
  const router = express.Router();

  router.post('/translate', validateBody(translateSchema), translationController.translate);

  return router;
}

module.exports = {
  createTranslationRoutes,
};
