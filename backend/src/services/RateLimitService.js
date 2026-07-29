const { AppError } = require('../utils/AppError');

class RateLimitService {
  constructor(redisClient) {
    this.redis = redisClient;
  }

  _buildKey(scope, ruleName, windowSeconds) {
    const bucket = Math.floor(Date.now() / (windowSeconds * 1000));
    return `rl:${ruleName}:${scope}:${bucket}`;
  }

  async consume(scope, rule) {
    const key = this._buildKey(scope, rule.name, rule.windowSeconds);
    const count = await this.redis.incr(key);

    if (count === 1) {
      await this.redis.expire(key, rule.windowSeconds);
    }

    const remaining = Math.max(0, rule.limit - count);
    const resetAt = Math.ceil(Date.now() / 1000) + rule.windowSeconds;

    if (count > rule.limit) {
      throw AppError.rateLimited('Too many requests', {
        limit: rule.limit,
        windowSeconds: rule.windowSeconds,
        retryAfterSeconds: rule.windowSeconds,
      });
    }

    return {
      limit: rule.limit,
      remaining,
      resetAt,
    };
  }
}

module.exports = {
  RateLimitService,
};
