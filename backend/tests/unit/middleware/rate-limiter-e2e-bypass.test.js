/**
 * Production readiness Pass 3 (2026-08-25) — E2E-only auth-login rate limit
 * bypass. Fixes the real blocker from Pass 2: the IP-scoped authLogin
 * limiter (10/15min) is shared across every seller/customer login made from
 * one loopback IP during an E2E run (plus any diagnostic curl calls made in
 * the same window), so a full suite could not complete without exhausting
 * it — previously worked around by disabling RATE_LIMIT_ENABLED entirely,
 * which is broader than necessary. This is the narrow replacement: a
 * request must present X-E2E-Test-Token matching config.rateLimitTestBypass.token,
 * and even then only the `authLogin` rule is skipped — public, authenticated,
 * admin, upload and reportExport limits are all still enforced.
 */
jest.mock('../../../src/config', () => ({
  rateLimit: { enabled: true },
  rateLimitTestBypass: { token: null },
}));

const config = require('../../../src/config');
const { isE2ELoginBypass } = require('../../../src/middleware/rateLimiter');

const authLoginRule = { name: 'auth_login', limit: 10, windowSeconds: 900 };
const publicRule = { name: 'public', limit: 100, windowSeconds: 60 };

describe('production readiness Pass 3 — E2E login rate-limit bypass', () => {
  afterEach(() => {
    config.rateLimitTestBypass.token = null;
  });

  it('is false when no token is configured, regardless of the header sent', () => {
    config.rateLimitTestBypass.token = null;
    const req = { headers: { 'x-e2e-test-token': 'anything' } };
    expect(isE2ELoginBypass(req, authLoginRule)).toBe(false);
  });

  it('is false when a token is configured but the header does not match', () => {
    config.rateLimitTestBypass.token = 'real-secret';
    const req = { headers: { 'x-e2e-test-token': 'wrong-guess' } };
    expect(isE2ELoginBypass(req, authLoginRule)).toBe(false);
  });

  it('is false when the header is entirely absent', () => {
    config.rateLimitTestBypass.token = 'real-secret';
    const req = { headers: {} };
    expect(isE2ELoginBypass(req, authLoginRule)).toBe(false);
  });

  it('is true only for the authLogin rule, even with a correct token', () => {
    config.rateLimitTestBypass.token = 'real-secret';
    const req = { headers: { 'x-e2e-test-token': 'real-secret' } };

    expect(isE2ELoginBypass(req, authLoginRule)).toBe(true);
    expect(isE2ELoginBypass(req, publicRule)).toBe(false);
  });

  it('is false when rule is null/undefined (skip-path requests)', () => {
    config.rateLimitTestBypass.token = 'real-secret';
    const req = { headers: { 'x-e2e-test-token': 'real-secret' } };
    expect(isE2ELoginBypass(req, null)).toBe(false);
    expect(isE2ELoginBypass(req, undefined)).toBe(false);
  });
});
