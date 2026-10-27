const crypto = require('crypto');
const { translate, isSupported } = require('google-translate-api-x');
const TranslationCache = require('../../models/TranslationCache');

const SUPPORTED_LANGUAGES = ['en', 'hi', 'mai'];
const DEFAULT_TIMEOUT_MS = 6000;
const REDIS_TTL_SECONDS = 7 * 24 * 3600; // 7 days

class TranslationService {
  constructor(cacheService = null, logger = console) {
    this.cacheService = cacheService;
    this.logger = logger;
    this.inFlight = new Map();
  }

  isLanguageSupported(code) {
    if (!code || typeof code !== 'string') return false;
    const normalized = code.toLowerCase().trim();
    return SUPPORTED_LANGUAGES.includes(normalized);
  }

  getHash(text, from, to) {
    return crypto
      .createHash('sha256')
      .update(`${from}:${to}:${text.trim()}`)
      .digest('hex');
  }

  /**
   * Translates a single string safely with two-tier caching and deduplication.
   */
  async translateText(text, targetLang, sourceLang = 'en') {
    if (!text || typeof text !== 'string' || !text.trim()) {
      return text;
    }

    const trimmed = text.trim();
    const to = (targetLang || 'en').toLowerCase().trim();
    const from = (sourceLang || 'en').toLowerCase().trim();

    if (to === from) {
      return trimmed;
    }

    if (!this.isLanguageSupported(to)) {
      this.logger.warn?.({ targetLang: to }, 'Unsupported target language requested for translation');
      return trimmed;
    }

    const hash = this.getHash(trimmed, from, to);
    const inFlightKey = `${hash}`;

    // 1. In-flight request deduplication
    if (this.inFlight.has(inFlightKey)) {
      return this.inFlight.get(inFlightKey);
    }

    const task = (async () => {
      // 2. Check Redis L1 cache
      if (this.cacheService) {
        try {
          const cached = await this.cacheService.get(`cache:trans:${hash}`);
          if (cached) {
            return cached;
          }
        } catch (err) {
          this.logger.warn?.({ err: err.message }, 'Redis translation cache read failed');
        }
      }

      // 3. Check MongoDB L2 cache
      try {
        const dbCached = await TranslationCache.findOne({ hash }).lean();
        if (dbCached && dbCached.translatedText) {
          // Populate Redis for subsequent hits
          if (this.cacheService) {
            this.cacheService.set(`cache:trans:${hash}`, dbCached.translatedText, REDIS_TTL_SECONDS).catch(() => {});
          }
          return dbCached.translatedText;
        }
      } catch (err) {
        this.logger.warn?.({ err: err.message }, 'MongoDB translation cache read failed');
      }

      // 4. Fetch from provider with timeout
      let translatedResult = null;
      try {
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error(`Translation provider timeout after ${DEFAULT_TIMEOUT_MS}ms`)), DEFAULT_TIMEOUT_MS)
        );

        const apiPromise = translate(trimmed, { from, to });
        const res = await Promise.race([apiPromise, timeoutPromise]);
        translatedResult = res?.text || trimmed;
      } catch (err) {
        this.logger.error?.({ err: err.message, from, to }, 'Translation provider call failed, falling back to source text');
        return trimmed;
      }

      // 5. Store in MongoDB and Redis
      if (translatedResult && translatedResult !== trimmed) {
        TranslationCache.updateOne(
          { hash },
          {
            $set: {
              hash,
              sourceText: trimmed,
              from,
              to,
              translatedText: translatedResult,
            },
          },
          { upsert: true }
        ).catch((err) => {
          this.logger.warn?.({ err: err.message }, 'Failed to persist translation in MongoDB');
        });

        if (this.cacheService) {
          this.cacheService.set(`cache:trans:${hash}`, translatedResult, REDIS_TTL_SECONDS).catch(() => {});
        }
      }

      return translatedResult;
    })();

    this.inFlight.set(inFlightKey, task);
    try {
      return await task;
    } finally {
      this.inFlight.delete(inFlightKey);
    }
  }

  /**
   * Translates an object with multiple text fields into the requested languages.
   * Example fields: { title: 'Madhubani Painting', description: 'Art of Bihar' }
   * Returns: {
   *   en: { title: '...', description: '...' },
   *   hi: { title: '...', description: '...' },
   *   mai: { title: '...', description: '...' }
   * }
   */
  async translateFields(fields = {}, targetLanguages = ['hi', 'mai'], sourceLang = 'en') {
    const result = {
      [sourceLang]: { ...fields },
    };

    const keys = Object.keys(fields).filter((k) => typeof fields[k] === 'string' && fields[k].trim());
    if (!keys.length) {
      return result;
    }

    for (const lang of targetLanguages) {
      if (lang === sourceLang || !this.isLanguageSupported(lang)) {
        continue;
      }

      result[lang] = {};
      await Promise.all(
        keys.map(async (key) => {
          try {
            const val = fields[key];
            const translated = await this.translateText(val, lang, sourceLang);
            result[lang][key] = translated;
          } catch (err) {
            result[lang][key] = fields[key];
          }
        })
      );
    }

    return result;
  }
}

module.exports = {
  TranslationService,
  SUPPORTED_LANGUAGES,
};
