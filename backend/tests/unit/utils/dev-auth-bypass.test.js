const { devAuthBypassAllowed } = require('../../../src/utils/devAuthBypass');

describe('devAuthBypassAllowed — test auth shortcuts must never reach production', () => {
  const saved = { env: process.env.NODE_ENV, flag: process.env.ALLOW_DEFAULT_OTP };
  afterEach(() => {
    process.env.NODE_ENV = saved.env;
    if (saved.flag === undefined) delete process.env.ALLOW_DEFAULT_OTP; else process.env.ALLOW_DEFAULT_OTP = saved.flag;
  });

  it('is OFF in production even when ALLOW_DEFAULT_OTP is unset or "true"', () => {
    process.env.NODE_ENV = 'production';
    delete process.env.ALLOW_DEFAULT_OTP;
    expect(devAuthBypassAllowed()).toBe(false);
    process.env.ALLOW_DEFAULT_OTP = 'true';
    expect(devAuthBypassAllowed()).toBe(false);
  });

  it('is OFF outside production when explicitly disabled', () => {
    process.env.NODE_ENV = 'development';
    process.env.ALLOW_DEFAULT_OTP = 'false';
    expect(devAuthBypassAllowed()).toBe(false);
  });

  it('is ON only for non-production with the flag unset', () => {
    process.env.NODE_ENV = 'development';
    delete process.env.ALLOW_DEFAULT_OTP;
    expect(devAuthBypassAllowed()).toBe(true);
  });
});
