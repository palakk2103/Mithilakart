/**
 * Production readiness Pass 3 (2026-08-25) — otpSendLimitBypassPhones must be
 * inert in production no matter what the env var says.
 *
 * This is the decisive safety property of the E2E-only OTP send-limit bypass
 * added in OtpService.assertSendRateLimit: config/index.js hard-forces the
 * allowlist to an empty array under NODE_ENV=production, so even if a shared
 * .env file were mistakenly deployed with OTP_SEND_LIMIT_BYPASS_PHONES set
 * (e.g. a real customer's number, by accident or by an attacker who somehow
 * influenced the env), a production boot cannot honour it.
 */

const ORIGINAL_ENV = { ...process.env };

function loadConfigWithEnv(envOverrides) {
  let config;
  jest.isolateModules(() => {
    // eslint-disable-next-line global-require
    config = require('../../../src/config');
  });
  return config;
}

describe('production readiness Pass 3 — otpSendLimitBypassPhones production safety', () => {
  afterEach(() => {
    process.env = { ...ORIGINAL_ENV };
    jest.resetModules();
  });

  it('is forced empty under NODE_ENV=production even when the env var is set', () => {
    process.env.NODE_ENV = 'production';
    process.env.OTP_SEND_LIMIT_BYPASS_PHONES = '+91:9999999999,+91:1234567890';

    const config = loadConfigWithEnv();

    expect(config.auth.otpSendLimitBypassPhones).toEqual([]);
  });

  it('respects the env var under a non-production environment (development)', () => {
    process.env.NODE_ENV = 'development';
    process.env.OTP_SEND_LIMIT_BYPASS_PHONES = '+91:9999999999, +91:1234567890';

    const config = loadConfigWithEnv();

    expect(config.auth.otpSendLimitBypassPhones).toEqual(['+91:9999999999', '+91:1234567890']);
  });

  it('defaults to empty when the env var is unset, in any environment', () => {
    process.env.NODE_ENV = 'development';
    delete process.env.OTP_SEND_LIMIT_BYPASS_PHONES;

    const config = loadConfigWithEnv();

    expect(config.auth.otpSendLimitBypassPhones).toEqual([]);
  });

  it('ignores empty entries from stray commas', () => {
    process.env.NODE_ENV = 'development';
    process.env.OTP_SEND_LIMIT_BYPASS_PHONES = '+91:9999999999,,  ,+91:1234567890,';

    const config = loadConfigWithEnv();

    expect(config.auth.otpSendLimitBypassPhones).toEqual(['+91:9999999999', '+91:1234567890']);
  });
});
