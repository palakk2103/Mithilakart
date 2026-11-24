const crypto = require('crypto');
const { BaseService } = require('../../core/BaseService');
const { AppError } = require('../../utils/AppError');
const { PORTALS } = require('../../constants/portals');
const { USER_STATUS, OTP } = require('../../constants/auth');
const { eventBus } = require('../../events/EventBus');

const alreadyRegistered = (message, details) => new AppError(message, 'ALREADY_REGISTERED', 409, details);

const REGISTRATION_TTL_SECONDS = 30 * 60;
const PURPOSE = { REGISTER: 'register', LOGIN: 'login' };

const LOGIN_SENT_MESSAGE = 'OTP sent. Please enter the 6-digit code.';
/** Login is for existing customers only; the app offers "Register" on this code. */
const notRegistered = (message, field) => new AppError(message, 'NOT_REGISTERED', 404, { field, action: 'register' });
const blockedAccount = () => AppError.forbidden('This account is not active. Please contact Mithilakart support.');
/** Verify failures on login never say whether the account exists. */
const LOGIN_FAILED_MESSAGE = 'Incorrect or expired OTP. New to Mithilakart? Register first.';

function normalizeCountryCode(countryCode) {
  const digits = String(countryCode || '+91').replace(/\D/g, '') || '91';
  return `+${digits}`;
}

/** Digits only; drops a leading 0 or a repeated country code ("91 98765 43210"). */
function normalizePhone(phone, countryCode = '+91') {
  let digits = String(phone || '').replace(/\D/g, '');
  const cc = countryCode.replace(/\D/g, '');
  if (digits.length > 10 && digits.startsWith(cc) && digits.length - cc.length >= 8) digits = digits.slice(cc.length);
  if (digits.length === 11 && digits.startsWith('0')) digits = digits.slice(1);
  return digits;
}

function maskPhone(countryCode, phone) {
  const tail = phone.slice(-4);
  return `${countryCode} ${'X'.repeat(Math.max(0, phone.length - 4))}${tail}`;
}

function maskEmail(email) {
  const [local, domain] = email.split('@');
  const shown = local.slice(0, Math.min(2, local.length));
  return `${shown}${'*'.repeat(Math.max(1, local.length - shown.length))}@${domain}`;
}

const sleep = (ms) => new Promise((resolve) => { setTimeout(resolve, ms); });

/**
 * Customer sign-up and login (AUTH-1 … AUTH-5).
 *
 * Registration: one account, two verified identities. `registerStart` checks
 * the mobile number and email are both unused and sends the mobile OTP; once it
 * is verified the email OTP goes out; the account is created only after the
 * email OTP is verified too.
 *
 * Login: OTP to a registered mobile number or email. Login never creates
 * accounts. An unknown number/email is told to register (client requirement;
 * sign-up already reveals the same thing). The auth rate limit and the small
 * random delay keep that answer from being harvested quickly.
 */
class CustomerAuthService extends BaseService {
  constructor(dependencies) {
    super();
    this.userRepository = dependencies.userRepository;
    this.otpService = dependencies.otpService;
    this.tokenService = dependencies.tokenService;
    this.sessionService = dependencies.sessionService;
    this.config = dependencies.config;
    this.cartMergeService = dependencies.cartMergeService || null;
    this.redis = dependencies.redisClient || dependencies.otpService?.redis || null;
  }

  _phoneIdentifier(countryCode, phone) {
    return `${countryCode}:${phone}`;
  }

  _otpOptions(purpose, extra = {}) {
    return { purpose, resendCooldownSeconds: OTP.RESEND_COOLDOWN_SECONDS, ...extra };
  }

  // ─── Login ────────────────────────────────────────────────────────────────

  async sendPhoneOtp({ countryCode: rawCode, phone: rawPhone }) {
    const countryCode = normalizeCountryCode(rawCode);
    const phone = normalizePhone(rawPhone, countryCode);
    const user = await this.userRepository.findByPhoneAnyCode(phone, countryCode);
    const identifier = this._phoneIdentifier(countryCode, phone);

    if (!user) {
      await sleep(200 + crypto.randomInt(400));
      throw notRegistered('This mobile number is not registered with Mithilakart. Please register to continue.', 'phone');
    }
    if (user.status !== USER_STATUS.ACTIVE) throw blockedAccount();
    const result = await this.otpService.createOtpSession(
      PORTALS.CUSTOMER,
      identifier,
      { countryCode, phone },
      this._otpOptions(PURPOSE.LOGIN)
    );
    return { ...result, sentTo: maskPhone(countryCode, phone), message: LOGIN_SENT_MESSAGE };
  }

  async sendEmailOtp({ email: rawEmail }) {
    const email = String(rawEmail).trim().toLowerCase();
    const user = await this.userRepository.findByEmail(email);

    if (!user) {
      await sleep(200 + crypto.randomInt(400));
      throw notRegistered('This email is not registered with Mithilakart. Please register to continue.', 'email');
    }
    if (user.status !== USER_STATUS.ACTIVE) throw blockedAccount();
    const result = await this.otpService.createOtpSession(
      PORTALS.CUSTOMER,
      email,
      { email },
      this._otpOptions(PURPOSE.LOGIN)
    );
    return { ...result, sentTo: maskEmail(email), message: LOGIN_SENT_MESSAGE };
  }

  async verifyPhoneOtp({ countryCode: rawCode, phone: rawPhone, otp, deviceId }, sessionMeta) {
    const countryCode = normalizeCountryCode(rawCode);
    const phone = normalizePhone(rawPhone, countryCode);
    await this._verifyLoginOtp(this._phoneIdentifier(countryCode, phone), otp);

    const user = await this.userRepository.findByPhoneAnyCode(phone, countryCode);
    if (!user || user.status !== USER_STATUS.ACTIVE) throw AppError.unauthorized(LOGIN_FAILED_MESSAGE);

    if (!user.phoneVerifiedAt) user.phoneVerifiedAt = new Date();
    if (!user.authProvider) user.authProvider = 'phone'; // imported/legacy rows
    user.isVerified = true;
    await user.save();
    return this._completeLogin(user, sessionMeta, deviceId, false);
  }

  async verifyEmailOtp({ email: rawEmail, otp, deviceId }, sessionMeta) {
    const email = String(rawEmail).trim().toLowerCase();
    await this._verifyLoginOtp(email, otp);

    const user = await this.userRepository.findByEmail(email);
    if (!user || user.status !== USER_STATUS.ACTIVE) throw AppError.unauthorized(LOGIN_FAILED_MESSAGE);

    if (!user.emailVerifiedAt) user.emailVerifiedAt = new Date();
    if (!user.authProvider) user.authProvider = 'email'; // imported/legacy rows
    user.isVerified = true;
    await user.save();
    return this._completeLogin(user, sessionMeta, deviceId, false);
  }

  async _verifyLoginOtp(identifier, otp) {
    try {
      await this.otpService.verifyOtp(PORTALS.CUSTOMER, identifier, otp, { purpose: PURPOSE.LOGIN });
    } catch (error) {
      // Lockouts and rate limits keep their own message; the rest stay generic.
      if (error?.statusCode === 429) throw error;
      if (/replaced when you tapped Resend/.test(error?.message || '')) throw error;
      const remaining = /(\d+) attempts remaining/.exec(error?.message || '');
      throw AppError.unauthorized(remaining ? `Incorrect OTP. ${remaining[1]} attempts remaining` : LOGIN_FAILED_MESSAGE);
    }
  }

  // ─── Registration ─────────────────────────────────────────────────────────

  _registrationKey(id) {
    return `reg:${PORTALS.CUSTOMER}:${id}`;
  }

  async _loadRegistration(registrationId) {
    if (!/^[a-f0-9]{32}$/.test(String(registrationId || ''))) {
      throw AppError.gone('Your sign-up session has expired. Please start again.');
    }
    const raw = await this.redis.get(this._registrationKey(registrationId));
    if (!raw) throw AppError.gone('Your sign-up session has expired. Please start again.');
    return JSON.parse(raw);
  }

  async _saveRegistration(registrationId, data) {
    const ttl = await this.redis.ttl(this._registrationKey(registrationId));
    await this.redis.set(
      this._registrationKey(registrationId),
      JSON.stringify(data),
      'EX',
      ttl > 0 ? ttl : REGISTRATION_TTL_SECONDS
    );
  }

  async _assertUnregistered({ countryCode, phone, email }) {
    const [byPhone, byEmail] = await Promise.all([
      this.userRepository.findByPhoneAnyCode(phone, countryCode),
      this.userRepository.findByEmail(email),
    ]);
    const fields = [];
    if (byPhone) fields.push('phone');
    if (byEmail) fields.push('email');
    if (!fields.length) return;

    let message = 'This mobile number is already registered. Please log in instead.';
    if (fields.length === 2) message = 'This mobile number and email are already registered. Please log in instead.';
    else if (fields[0] === 'email') message = 'This email is already registered. Please log in instead.';
    throw alreadyRegistered(message, { fields, action: 'login' });
  }

  _registrationView(registrationId, reg, extra = {}) {
    return {
      registrationId,
      step: reg.emailVerifiedAt ? 'done' : reg.phoneVerifiedAt ? 'email' : 'phone',
      phoneVerified: Boolean(reg.phoneVerifiedAt),
      emailVerified: Boolean(reg.emailVerifiedAt),
      maskedPhone: maskPhone(reg.countryCode, reg.phone),
      maskedEmail: maskEmail(reg.email),
      ...extra,
    };
  }

  async registerStart({ name, countryCode: rawCode, phone: rawPhone, email: rawEmail }) {
    const countryCode = normalizeCountryCode(rawCode);
    const phone = normalizePhone(rawPhone, countryCode);
    const email = String(rawEmail).trim().toLowerCase();
    await this._assertUnregistered({ countryCode, phone, email });

    const registrationId = crypto.randomBytes(16).toString('hex');
    const reg = {
      name: String(name).trim(),
      countryCode,
      phone,
      email,
      phoneVerifiedAt: null,
      emailVerifiedAt: null,
      createdAt: new Date().toISOString(),
    };
    await this.redis.set(this._registrationKey(registrationId), JSON.stringify(reg), 'EX', REGISTRATION_TTL_SECONDS);

    try {
      const otp = await this.otpService.createOtpSession(
        PORTALS.CUSTOMER,
        this._phoneIdentifier(countryCode, phone),
        { countryCode, phone },
        this._otpOptions(PURPOSE.REGISTER)
      );
      return this._registrationView(registrationId, reg, { otp });
    } catch (error) {
      await this.redis.del(this._registrationKey(registrationId));
      throw error;
    }
  }

  async _sendRegistrationEmailOtp(reg) {
    return this.otpService.createOtpSession(PORTALS.CUSTOMER, reg.email, { email: reg.email }, this._otpOptions(PURPOSE.REGISTER));
  }

  async registerVerifyPhone({ registrationId, otp }) {
    const reg = await this._loadRegistration(registrationId);
    if (!reg.phoneVerifiedAt) {
      await this.otpService.verifyOtp(
        PORTALS.CUSTOMER,
        this._phoneIdentifier(reg.countryCode, reg.phone),
        otp,
        { purpose: PURPOSE.REGISTER }
      );
      reg.phoneVerifiedAt = new Date().toISOString();
      await this._saveRegistration(registrationId, reg);
    }

    // Mobile is verified either way; a failed email send must not undo it.
    try {
      const emailOtp = await this._sendRegistrationEmailOtp(reg);
      return this._registrationView(registrationId, reg, { otp: emailOtp });
    } catch (error) {
      return this._registrationView(registrationId, reg, {
        otp: null,
        emailOtpError: error?.message || 'We could not send the email OTP. Tap Resend OTP.',
        retryAfterSeconds: error?.details?.retryAfterSeconds || 0,
      });
    }
  }

  async registerVerifyEmail({ registrationId, otp, deviceId }, sessionMeta) {
    const reg = await this._loadRegistration(registrationId);
    if (!reg.phoneVerifiedAt) throw AppError.badRequest('Verify your mobile number first.');

    await this.otpService.verifyOtp(PORTALS.CUSTOMER, reg.email, otp, { purpose: PURPOSE.REGISTER });
    reg.emailVerifiedAt = new Date().toISOString();

    // Someone may have registered the same number/email in the meantime.
    await this._assertUnregistered(reg);

    let user;
    try {
      user = await this.userRepository.createUser({
        name: reg.name,
        phone: reg.phone,
        countryCode: reg.countryCode,
        email: reg.email,
        authProvider: 'phone',
        isVerified: true,
        phoneVerifiedAt: new Date(reg.phoneVerifiedAt),
        emailVerifiedAt: new Date(reg.emailVerifiedAt),
        status: USER_STATUS.ACTIVE,
      });
    } catch (error) {
      if (error?.code === 11000) {
        throw alreadyRegistered('This mobile number or email is already registered. Please log in instead.', { action: 'login' });
      }
      throw error;
    }

    await this.redis.del(this._registrationKey(registrationId));
    eventBus.publish('user.registered', { userId: user._id, portal: PORTALS.CUSTOMER });
    return this._completeLogin(user, sessionMeta, deviceId, true);
  }

  async registerResend({ registrationId, channel }) {
    const reg = await this._loadRegistration(registrationId);
    if (channel === 'email') {
      if (!reg.phoneVerifiedAt) throw AppError.badRequest('Verify your mobile number first.');
      const otp = await this._sendRegistrationEmailOtp(reg);
      return this._registrationView(registrationId, reg, { otp });
    }
    if (reg.phoneVerifiedAt) throw AppError.badRequest('Your mobile number is already verified.');
    const otp = await this.otpService.createOtpSession(
      PORTALS.CUSTOMER,
      this._phoneIdentifier(reg.countryCode, reg.phone),
      { countryCode: reg.countryCode, phone: reg.phone },
      this._otpOptions(PURPOSE.REGISTER)
    );
    return this._registrationView(registrationId, reg, { otp });
  }

  // ─── Sessions ─────────────────────────────────────────────────────────────

  async _completeLogin(user, sessionMeta = {}, deviceId, isNewUser) {
    eventBus.publish('user.logged_in', { userId: user._id, portal: PORTALS.CUSTOMER });

    if (this.cartMergeService?.mergeGuestIntoCustomer && sessionMeta?.sessionId) {
      try {
        await this.cartMergeService.mergeGuestIntoCustomer({
          guestSessionId: sessionMeta.sessionId,
          customerId: user._id.toString(),
          commerceFlow: 'standard',
        });
      } catch (mergeErr) {
        // Non-blocking: cart merge error should never prevent the user from logging in
      }
    }

    const tokens = await this.tokenService.issueTokenPair({
      portal: PORTALS.CUSTOMER,
      subject: user._id.toString(),
      role: 'customer',
      sessionMeta: { ...sessionMeta, deviceId },
    });

    await this.sessionService.trackDevice({
      userId: user._id,
      portal: PORTALS.CUSTOMER,
      deviceId,
      userAgent: sessionMeta?.userAgent,
    });

    return {
      user: this._serializeUser(user),
      tokens,
      isNewUser,
    };
  }

  async refresh(refreshToken, sessionMeta) {
    const tokens = await this.tokenService.refreshTokens(refreshToken, PORTALS.CUSTOMER, sessionMeta);
    return { tokens };
  }

  async logout({ refreshToken, accessToken }) {
    await this.tokenService.logout({
      portal: PORTALS.CUSTOMER,
      refreshToken,
      accessToken,
    });
  }

  /** AUTH-5: sign out everywhere (every refresh token of this customer). */
  async logoutAll({ userId, accessToken }) {
    await this.tokenService.revokeAllSessions(userId, PORTALS.CUSTOMER);
    if (accessToken) {
      await this.tokenService.logout({ portal: PORTALS.CUSTOMER, accessToken });
    }
  }

  _serializeUser(user) {
    return {
      id: user._id,
      customerId: user.customerId || null,
      name: user.name,
      email: user.email,
      phone: user.phone,
      countryCode: user.countryCode,
      gender: user.gender,
      dob: user.dob,
      avatarUrl: user.avatarUrl,
      authProvider: user.authProvider,
      locale: user.locale,
      status: user.status,
      phoneVerified: Boolean(user.phoneVerifiedAt),
      emailVerified: Boolean(user.emailVerifiedAt),
    };
  }
}

module.exports = {
  CustomerAuthService,
  normalizePhone,
  normalizeCountryCode,
  maskEmail,
  maskPhone,
};
