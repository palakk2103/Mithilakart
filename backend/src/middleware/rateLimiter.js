const config = require('../config');
const { getRedisClient } = require('../config/redis');
const { MemoryRedisClient } = require('../core/redis/MemoryRedisClient');
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

/**
 * Production readiness Pass 3 (2026-08-25): true only when the request
 * carries a matching E2E test token AND the rule being evaluated is
 * `authLogin`. Deliberately narrow — this never touches the public,
 * authenticated, admin, upload, or reportExport limiters, only the one that
 * an E2E suite realistically exhausts by sharing one loopback IP across many
 * real seller/customer logins in a single run. config.rateLimitTestBypass.token
 * is hard-null in production, so this is unconditionally false there.
 */
function isE2ELoginBypass(req, rule) {
  const token = config.rateLimitTestBypass?.token;
  if (!token || rule?.name !== 'auth_login') return false;
  return req.headers['x-e2e-test-token'] === token;
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

    if (isE2ELoginBypass(req, rule)) {
      return next();
    }

    let redis = getRedisClient();
    if (!redis) {
      redis = new MemoryRedisClient();
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
  isE2ELoginBypass,
};
