const config = require('../config');
const { getRedisClient } = require('../config/redis');
const { RateLimitService } = require('../services/RateLimitService');
const { resolveRateLimitRule } = require('../constants/rateLimit');
const { AppError } = require('../utils/AppError');

function getClientIp(req) {
  return req.ip || req.headers['x-forwarded-for']?.split(',')[0]?.trim() || 'unknown';
}

function getRateLimitScope(req) {
  const userId = req.user?.id || req.user?._id;
  if (userId) {
    return `user:${userId}`;
  }
  return `ip:${getClientIp(req)}`;
}

function createRateLimiterMiddleware(options = {}) {
  const { enabled = config.rateLimit.enabled } = options;

  return async (req, res, next) => {
    if (!enabled) {
      return next();
    }

    const rule = resolveRateLimitRule(req);
    if (!rule) {
      return next();
    }

    const redis = getRedisClient();
    if (!redis) {
      return next();
    }

    try {
      const service = new RateLimitService(redis);
      const meta = await service.consume(getRateLimitScope(req), rule);

      res.setHeader('X-RateLimit-Limit', String(meta.limit));
      res.setHeader('X-RateLimit-Remaining', String(meta.remaining));
      res.setHeader('X-RateLimit-Reset', String(meta.resetAt));

      return next();
    } catch (error) {
      if (error instanceof AppError && error.statusCode === 429) {
        res.setHeader('Retry-After', String(error.details?.retryAfterSeconds || rule.windowSeconds));
        return next(error);
      }
      return next(error);
    }
  };
}

module.exports = {
  createRateLimiterMiddleware,
  getRateLimitScope,
};
