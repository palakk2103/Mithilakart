const { SUPPORTED_LANGUAGES } = require('../services/translation/TranslationService');

function languageMiddleware(req, _res, next) {
  let lang = 'en';

  if (req.query && req.query.lang) {
    const queryLang = String(req.query.lang).toLowerCase().trim().split('-')[0];
    if (SUPPORTED_LANGUAGES.includes(queryLang)) {
      lang = queryLang;
    }
  } else if (req.headers && req.headers['accept-language']) {
    const raw = req.headers['accept-language'];
    // Handle formats like "hi,en;q=0.9" or "mai-IN"
    const candidates = raw.split(',').map((part) => part.split(';')[0].trim().toLowerCase().split('-')[0]);
    for (const candidate of candidates) {
      if (SUPPORTED_LANGUAGES.includes(candidate)) {
        lang = candidate;
        break;
      }
    }
  }

  req.language = lang;
  next();
}

module.exports = {
  languageMiddleware,
};
