/**
 * AUTH-1 … AUTH-5: two-identity registration, login-only OTP, OTP purpose
 * scoping, server expiry, resend cooldown and the 5-wrong-attempts lock.
 */
process.env.ALLOW_DEFAULT_OTP = 'false'; // exercise the real limiter / lock, not the dev bypass

const { MemoryRedisClient } = require('../../../src/core/redis/MemoryRedisClient');
const { OtpService } = require('../../../src/services/OtpService');
const { CustomerAuthService, normalizePhone } = require('../../../src/services/auth/CustomerAuthService');

function makeUserRepository() {
  const users = [];
  return {
    users,
    async findByEmail(email) {
      return users.find((u) => u.email === email.toLowerCase()) || null;
    },
    async findByPhoneAnyCode(phone, countryCode) {
      const digits = String(countryCode).replace(/\D/g, '');
      return users.find((u) => u.phone === phone && [`+${digits}`, digits].includes(u.countryCode)) || null;
    },
    async createUser(data) {
      if (users.some((u) => u.email === data.email || (u.phone === data.phone && u.countryCode === data.countryCode))) {
        const err = new Error('dup'); err.code = 11000; throw err;
      }
      const user = { _id: { toString: () => `u${users.length + 1}` }, status: 'active', ...data, save: async () => {} };
      users.push(user);
      return user;
    },
  };
}

function setup() {
  const redis = new MemoryRedisClient();
  const outbox = { sms: [], email: [] };
  const sms = { isEnabled: () => true, sendOtp: async (m) => { outbox.sms.push(m); } };
  const email = { isEnabled: () => true, sendOtp: async (m) => { outbox.email.push(m); } };
  const config = { auth: { exposeOtpInDev: false }, sms: { enabled: true } };
  const otpService = new OtpService(redis, config, sms, email);
  const userRepository = makeUserRepository();
  const service = new CustomerAuthService({
    redisClient: redis,
    userRepository,
    otpService,
    tokenService: { issueTokenPair: async () => ({ accessToken: 'a', refreshToken: 'r' }) },
    sessionService: { trackDevice: async () => {} },
    config,
  });
  const lastSms = () => outbox.sms[outbox.sms.length - 1].otp;
  const lastEmail = () => outbox.email[outbox.email.length - 1].otp;
  return { redis, outbox, otpService, userRepository, service, lastSms, lastEmail };
}

const NEW_USER = { name: 'Asha Devi', countryCode: '+91', phone: '9876543210', email: 'Asha@Example.com' };

/** Moves the clock past the 30 s resend cooldown. */
function skipCooldown() {
  const now = Date.now();
  jest.spyOn(Date, 'now').mockReturnValue(now + 31_000);
}

afterEach(() => jest.restoreAllMocks());

describe('AUTH-1/2 registration with both identities', () => {
  it('creates the account only after mobile OTP and then email OTP are verified', async () => {
    const { service, userRepository, outbox, lastSms, lastEmail } = setup();

    const start = await service.registerStart(NEW_USER);
    expect(start.step).toBe('phone');
    expect(start.maskedPhone).toBe('+91 XXXXXX3210');
    expect(start.otp.expiresAt).toEqual(expect.any(String));
    expect(outbox.sms).toHaveLength(1);
    expect(outbox.email).toHaveLength(0);
    expect(userRepository.users).toHaveLength(0);

    const afterPhone = await service.registerVerifyPhone({ registrationId: start.registrationId, otp: lastSms() });
    expect(afterPhone).toMatchObject({ step: 'email', phoneVerified: true, emailVerified: false });
    expect(outbox.email).toHaveLength(1);
    expect(outbox.email[0]).toMatchObject({ email: 'asha@example.com', purpose: 'register' });
    expect(userRepository.users).toHaveLength(0);

    const done = await service.registerVerifyEmail({ registrationId: start.registrationId, otp: lastEmail() }, {});
    expect(done.isNewUser).toBe(true);
    expect(done.user).toMatchObject({ phoneVerified: true, emailVerified: true, email: 'asha@example.com' });
    expect(userRepository.users).toHaveLength(1);
  });

  it('refuses the email step before the mobile is verified', async () => {
    const { service } = setup();
    const start = await service.registerStart(NEW_USER);
    await expect(service.registerVerifyEmail({ registrationId: start.registrationId, otp: '123456' }, {}))
      .rejects.toMatchObject({ statusCode: 400 });
  });

  it('blocks a mobile number or email that is already registered', async () => {
    const { service, userRepository } = setup();
    await userRepository.createUser({ phone: '9876543210', countryCode: '91', email: 'old@example.com' });

    await expect(service.registerStart(NEW_USER)).rejects.toMatchObject({
      statusCode: 409,
      details: { fields: ['phone'], action: 'login' },
      message: expect.stringMatching(/mobile number is already registered/),
    });
    await expect(service.registerStart({ ...NEW_USER, phone: '9000000000', email: 'OLD@example.com' }))
      .rejects.toMatchObject({ statusCode: 409, details: { fields: ['email'] } });
  });

  it('a registration OTP cannot be used to log in (purpose scoping)', async () => {
    const { service, userRepository, lastSms } = setup();
    await userRepository.createUser({ name: 'X', phone: '9111111111', countryCode: '+91', email: 'x@example.com' });
    // A registration session for another number does not help; and a login OTP
    // for a registered number is not accepted by the registration step.
    await service.sendPhoneOtp({ countryCode: '+91', phone: '9111111111' });
    const loginOtp = lastSms();
    const start = await service.registerStart({ ...NEW_USER, phone: '9222222222', email: 'n@example.com' });
    await expect(service.registerVerifyPhone({ registrationId: start.registrationId, otp: loginOtp }))
      .rejects.toMatchObject({ statusCode: 401 });
  });

  it('an expired sign-up session says so', async () => {
    const { service } = setup();
    await expect(service.registerVerifyPhone({ registrationId: 'a'.repeat(32), otp: '123456' }))
      .rejects.toMatchObject({ statusCode: 410, message: expect.stringMatching(/sign-up session has expired/) });
  });
});

describe('AUTH-3/5 login', () => {
  it('logs a registered customer in with phone OTP, accepting "91" and spaces', async () => {
    const { service, userRepository, lastSms } = setup();
    await userRepository.createUser({ name: 'A', phone: '9876543210', countryCode: '+91', email: 'a@example.com' });

    const sent = await service.sendPhoneOtp({ countryCode: '91', phone: '98765 43210' });
    expect(sent.smsSent).toBe(true);
    const result = await service.verifyPhoneOtp({ countryCode: '+91', phone: '9876543210', otp: lastSms() }, {});
    expect(result.tokens.accessToken).toBe('a');
    expect(result.isNewUser).toBe(false);
  });

  it('logs in by email OTP and the email is actually sent', async () => {
    const { service, userRepository, outbox, lastEmail } = setup();
    await userRepository.createUser({ name: 'A', phone: '9876543210', countryCode: '+91', email: 'a@example.com' });
    await service.sendEmailOtp({ email: 'A@example.com' });
    expect(outbox.email).toHaveLength(1);
    await expect(service.verifyEmailOtp({ email: 'a@example.com', otp: lastEmail() }, {})).resolves.toMatchObject({ isNewUser: false });
  });

  it('answers the same for an unknown number, sends nothing and never creates an account', async () => {
    const { service, userRepository, outbox } = setup();
    const sent = await service.sendPhoneOtp({ countryCode: '+91', phone: '9333333333' });
    expect(sent).toMatchObject({ smsSent: true, message: expect.any(String), expiresAt: expect.any(String) });
    expect(outbox.sms).toHaveLength(0);

    await expect(service.verifyPhoneOtp({ countryCode: '+91', phone: '9333333333', otp: '111111' }, {}))
      .rejects.toMatchObject({ statusCode: 401, message: 'Incorrect OTP. 4 attempts remaining' });
    expect(userRepository.users).toHaveLength(0);
  });
});

describe('AUTH-4 OTP lifecycle', () => {
  it('returns the server expiry and a 30 s resend cooldown', async () => {
    const { otpService } = setup();
    const before = Date.now();
    const res = await otpService.createOtpSession('customer', '+91:9444444444', { phone: '9444444444' }, { purpose: 'login', resendCooldownSeconds: 30 });
    const expiresAt = new Date(res.expiresAt).getTime();
    expect(expiresAt - before).toBeGreaterThanOrEqual(299_000);
    expect(expiresAt - before).toBeLessThanOrEqual(301_000);
    expect(res.resendAfterSeconds).toBe(30);

    await expect(otpService.createOtpSession('customer', '+91:9444444444', { phone: '9444444444' }, { purpose: 'login', resendCooldownSeconds: 30 }))
      .rejects.toMatchObject({ statusCode: 429, details: { retryAfterSeconds: expect.any(Number) } });
  });

  it('after Resend the latest OTP works and the old one is reported as replaced', async () => {
    const { otpService, outbox } = setup();
    const opts = { purpose: 'login', resendCooldownSeconds: 30 };
    await otpService.createOtpSession('customer', '+91:9555555555', { phone: '9555555555' }, opts);
    const first = outbox.sms[0].otp;
    skipCooldown();
    await otpService.createOtpSession('customer', '+91:9555555555', { phone: '9555555555' }, opts);
    const second = outbox.sms[1].otp;

    if (first !== second) {
      await expect(otpService.verifyOtp('customer', '+91:9555555555', first, opts))
        .rejects.toMatchObject({ message: expect.stringMatching(/replaced when you tapped Resend/) });
    }
    await expect(otpService.verifyOtp('customer', '+91:9555555555', second, opts)).resolves.toBe(true);
  });

  it('locks sending and verifying after 5 wrong OTPs', async () => {
    const { otpService, outbox } = setup();
    await otpService.createOtpSession('customer', '+91:9666666666', { phone: '9666666666' }, { purpose: 'login' });
    const real = outbox.sms[0].otp;
    const wrong = real === '000000' ? '000001' : '000000';

    for (let i = 1; i <= 4; i += 1) {
      // eslint-disable-next-line no-await-in-loop
      await expect(otpService.verifyOtp('customer', '+91:9666666666', wrong, { purpose: 'login' }))
        .rejects.toMatchObject({ statusCode: 401, message: `Invalid OTP. ${5 - i} attempts remaining` });
    }
    await expect(otpService.verifyOtp('customer', '+91:9666666666', wrong, { purpose: 'login' }))
      .rejects.toMatchObject({ statusCode: 429, details: { locked: true } });
    await expect(otpService.verifyOtp('customer', '+91:9666666666', real, { purpose: 'login' }))
      .rejects.toMatchObject({ statusCode: 429 });
    await expect(otpService.createOtpSession('customer', '+91:9666666666', { phone: '9666666666' }, { purpose: 'login' }))
      .rejects.toMatchObject({ statusCode: 429 });
  });

  it('fails clearly when the email cannot be delivered', async () => {
    const redis = new MemoryRedisClient();
    const broken = { isEnabled: () => true, sendOtp: async () => { throw new Error('SMTP 535'); } };
    const otpService = new OtpService(redis, { auth: { exposeOtpInDev: false }, sms: {} }, null, broken);
    await expect(otpService.createOtpSession('customer', 'a@example.com', { email: 'a@example.com' }, { purpose: 'login' }))
      .rejects.toMatchObject({ statusCode: 503, message: expect.stringMatching(/could not send the OTP email/) });
    expect(await redis.get('otp:customer:login:a@example.com')).toBeNull();
  });

  it('fails clearly when no email provider is configured', async () => {
    const otpService = new OtpService(new MemoryRedisClient(), { auth: { exposeOtpInDev: false }, sms: {} }, null, { isEnabled: () => false });
    await expect(otpService.createOtpSession('customer', 'a@example.com', { email: 'a@example.com' }))
      .rejects.toMatchObject({ statusCode: 503 });
  });
});

describe('phone normalisation', () => {
  it.each([
    ['98765 43210', '9876543210'],
    ['09876543210', '9876543210'],
    ['919876543210', '9876543210'],
    ['+91-98765-43210', '9876543210'],
  ])('%s → %s', (input, out) => {
    expect(normalizePhone(input, '+91')).toBe(out);
  });
});
