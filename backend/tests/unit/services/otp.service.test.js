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
});
