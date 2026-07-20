class CacheService {
  constructor(redisClient) {
    this.redis = redisClient;
  }

  async get(key) {
    const raw = await this.redis.get(key);
    if (!raw) return null;

    try {
      return JSON.parse(raw);
    } catch (_error) {
      return raw;
    }
  }

  async set(key, value, ttlSeconds) {
    const payload = typeof value === 'string' ? value : JSON.stringify(value);
    await this.redis.set(key, payload, 'EX', ttlSeconds);
  }

  async del(key) {
    await this.redis.del(key);
  }

  async delByPattern(pattern) {
    if (typeof this.redis.keys === 'function') {
      const keys = await this.redis.keys(pattern);
      if (!keys.length) return 0;
      return this.redis.del(...keys);
    }

    if (typeof this.redis.scanStream === 'function') {
      const keys = [];
      await new Promise((resolve, reject) => {
        const stream = this.redis.scanStream({ match: pattern, count: 100 });
        stream.on('data', (batch) => keys.push(...batch));
        stream.on('end', resolve);
        stream.on('error', reject);
      });
      if (!keys.length) return 0;
      return this.redis.del(...keys);
    }

    return 0;
  }
}

module.exports = {
  CacheService,
};
