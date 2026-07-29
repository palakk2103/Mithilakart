const { resolveRateLimitRule, RATE_LIMITS } = require('../../../src/constants/rateLimit');

describe('rate limit rules', () => {
  it('skips health and metrics endpoints', () => {
    expect(resolveRateLimitRule({ originalUrl: '/health', method: 'GET', headers: {} })).toBeNull();
    expect(resolveRateLimitRule({ originalUrl: '/metrics', method: 'GET', headers: {} })).toBeNull();
  });

  it('applies auth login limits', () => {
    const rule = resolveRateLimitRule({
      originalUrl: '/api/v1/seller/auth/login',
      method: 'POST',
      headers: {},
    });
    expect(rule).toEqual(RATE_LIMITS.authLogin);
  });

  it('applies admin limits for admin routes', () => {
    const rule = resolveRateLimitRule({
      originalUrl: '/api/v1/admin/dashboard/stats',
      method: 'GET',
      headers: {},
    });
    expect(rule).toEqual(RATE_LIMITS.admin);
  });

  it('applies authenticated limits when bearer token is present', () => {
    const rule = resolveRateLimitRule({
      originalUrl: '/api/v1/orders',
      method: 'GET',
      headers: { authorization: 'Bearer token' },
    });
    expect(rule).toEqual(RATE_LIMITS.authenticated);
  });

  it('defaults to public catalog limits', () => {
    const rule = resolveRateLimitRule({
      originalUrl: '/api/v1/storefront/home',
      method: 'GET',
      headers: {},
    });
    expect(rule).toEqual(RATE_LIMITS.public);
  });
});
