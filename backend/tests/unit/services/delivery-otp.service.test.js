const { DeliveryOtpService } = require('../../../src/services/delivery/DeliveryOtpService');

describe('DeliveryOtpService', () => {
  it('creates and verifies pickup OTP once', async () => {
    const store = new Map();
    const redisClient = {
      set: jest.fn(async (key, value, _mode, ttl) => {
        store.set(key, { value, ttl });
      }),
      get: jest.fn(async (key) => store.get(key)?.value || null),
      del: jest.fn(async (key) => {
        store.delete(key);
      }),
    };

    const service = new DeliveryOtpService({ redisClient });
    const otp = await service.createOtp('assignment1', 'pickup');

    await expect(service.verifyOtp('assignment1', 'pickup', otp)).resolves.toBe(true);
    await expect(service.verifyOtp('assignment1', 'pickup', otp)).rejects.toMatchObject({
      statusCode: 410,
    });
  });
});
