const { RateLimitService } = require('../../../src/services/RateLimitService');
const { MemoryRedisClient } = require('../../../src/core/redis/MemoryRedisClient');
const { RATE_LIMITS } = require('../../../src/constants/rateLimit');

describe('RateLimitService', () => {
  let redis;
  let service;

  beforeEach(() => {
    redis = new MemoryRedisClient();
    service = new RateLimitService(redis);
  });

  it('allows requests within the configured limit', async () => {
    const rule = { ...RATE_LIMITS.public, name: 'test_public' };

    const first = await service.consume('ip:127.0.0.1', rule);
    expect(first.remaining).toBe(rule.limit - 1);

    const second = await service.consume('ip:127.0.0.1', rule);
    expect(second.remaining).toBe(rule.limit - 2);
  });

  it('throws when the limit is exceeded', async () => {
    const rule = { limit: 2, windowSeconds: 60, name: 'test_burst' };

    await service.consume('ip:1.2.3.4', rule);
    await service.consume('ip:1.2.3.4', rule);

    await expect(service.consume('ip:1.2.3.4', rule)).rejects.toMatchObject({
      statusCode: 429,
      details: expect.objectContaining({ limit: 2 }),
    });
  });
});
