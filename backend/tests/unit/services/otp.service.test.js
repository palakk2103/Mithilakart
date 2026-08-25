const { MemoryRedisClient } = require('../../../src/core/redis/MemoryRedisClient');
const { OtpService } = require('../../../src/services/OtpService');

describe('OtpService', () => {
  let otpService;
  let redis;

  beforeEach(() => {
    redis = new MemoryRedisClient();
    otpService = new OtpService(redis, {
      auth: { exposeOtpInDev: true },
      sms: { enabled: false },
    }, { isEnabled: () => false, sendOtp: async () => ({ success: true }) });
  });

  it('creates and verifies OTP', async () => {
    const result = await otpService.createOtpSession('customer', '+91:9876543210');

    expect(result.devOtp).toMatch(/^\d{6}$/);

    await expect(
      otpService.verifyOtp('customer', '+91:9876543210', result.devOtp)
    ).resolves.toBe(true);
  });

  it('enforces send rate limit', async () => {
    for (let i = 0; i < 5; i += 1) {
      await otpService.createOtpSession('customer', '+91:9999999999');
    }

    await expect(
      otpService.createOtpSession('customer', '+91:9999999999')
    ).rejects.toMatchObject({ code: 'RATE_LIMITED' });
  });

  describe('production readiness Pass 3 — otpSendLimitBypassPhones', () => {
    it('an allowlisted identifier is exempt from the send-rate-limit entirely', async () => {
      const bypassRedis = new MemoryRedisClient();
      const bypassService = new OtpService(bypassRedis, {
        auth: { exposeOtpInDev: true, otpSendLimitBypassPhones: ['+91:9999999999'] },
        sms: { enabled: false },
      }, { isEnabled: () => false, sendOtp: async () => ({ success: true }) });

      // Real production limit is 5/hour — send well past that and confirm
      // none of them are throttled.
      for (let i = 0; i < 12; i += 1) {
        await expect(
          bypassService.createOtpSession('customer', '+91:9999999999')
        ).resolves.toMatchObject({ devOtp: expect.stringMatching(/^\d{6}$/) });
      }
    });

    it('a NON-allowlisted identifier still hits the real 5/hour limit even when the config exists', async () => {
      const bypassRedis = new MemoryRedisClient();
      const bypassService = new OtpService(bypassRedis, {
        auth: { exposeOtpInDev: true, otpSendLimitBypassPhones: ['+91:9999999999'] },
        sms: { enabled: false },
      }, { isEnabled: () => false, sendOtp: async () => ({ success: true }) });

      for (let i = 0; i < 5; i += 1) {
        await bypassService.createOtpSession('customer', '+91:1111111111');
      }

      await expect(
        bypassService.createOtpSession('customer', '+91:1111111111')
      ).rejects.toMatchObject({ code: 'RATE_LIMITED' });
    });

    it('an empty/unset allowlist changes nothing — real limit still applies to everyone', async () => {
      // This is the default `otpService` from beforeEach — no bypass config at all.
      for (let i = 0; i < 5; i += 1) {
        await otpService.createOtpSession('customer', '+91:2222222222');
      }

      await expect(
        otpService.createOtpSession('customer', '+91:2222222222')
      ).rejects.toMatchObject({ code: 'RATE_LIMITED' });
    });
  });
});
