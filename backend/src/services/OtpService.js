const crypto = require('crypto');
const bcrypt = require('bcrypt');
const { OTP } = require('../constants/auth');
const { AppError } = require('../utils/AppError');
const { logger } = require('../utils/logger');
const { devAuthBypassAllowed } = require('../utils/devAuthBypass');

const DEFAULT_TEST_OTPS = ['123456', '999999', '000000', '1234'];

/**
 * OTP sessions, stored hashed in Redis and used once.
 *
 * AUTH-4 changes:
 * - `options.purpose` ('register' | 'login') scopes a session, so an OTP for
 *   registration can never be spent on login and the other way round.
 * - Responses carry the server's `expiresAt` and `resendAvailableAt`; the
 *   screens count down from those instead of a timer of their own (the old
 *   client timer said "expires in" but was really a 60 s resend timer).
 * - Resend replaces the previous OTP. Entering a replaced OTP now says so
 *   instead of a bare "invalid".
 * - After OTP.MAX_VERIFY_ATTEMPTS wrong codes the identifier is locked for
 *   OTP.LOCK_SECONDS (sending and verifying).
 * - Email OTPs are actually emailed (`delivery.email` + the email provider).
 * - If no channel delivered the code and nothing exposes it for testing, the
 *   send fails with a clear message instead of "succeeding" silently.
 */
class OtpService {
  constructor(redisClient, config, smsProvider = null, emailProvider = null) {
    this.redis = redisClient;
    this.config = config;
    this.smsProvider = smsProvider;
    this.emailProvider = emailProvider;
  }

  _otpKey(portal, identifier, purpose = null) {
    return purpose ? `otp:${portal}:${purpose}:${identifier}` : `otp:${portal}:${identifier}`;
  }

  _sendRateKey(portal, identifier) {
    return `otp:send:${portal}:${identifier}`;
  }

  _verifyRateKey(portal, identifier) {
    return `otp:verify:${portal}:${identifier}`;
  }

  _lockKey(portal, identifier) {
    return `otp:lock:${portal}:${identifier}`;
  }

  generateOtp() {
    return String(crypto.randomInt(100000, 1000000));
  }

  _parsePhone(identifier, delivery = {}) {
    if (delivery.phone) {
      return {
        countryCode: delivery.countryCode || '+91',
        phone: delivery.phone,
      };
    }

    if (identifier.includes(':')) {
      const [countryCode, phone] = identifier.split(':');
      return { countryCode, phone };
    }

    return null;
  }

  _testingBypass() {
    return Boolean(this.config?.auth?.exposeOtpInDev) || devAuthBypassAllowed();
  }

  async assertNotLocked(portal, identifier) {
    if (this._testingBypass()) return;
    const ttl = await this.redis.ttl(this._lockKey(portal, identifier));
    if (ttl > 0) {
      const minutes = Math.max(1, Math.ceil(ttl / 60));
      throw AppError.rateLimited(
        `Too many wrong OTP attempts. Please try again in ${minutes} minute${minutes === 1 ? '' : 's'}.`,
        { retryAfterSeconds: ttl, locked: true }
      );
    }
  }

  async assertSendRateLimit(portal, identifier) {
    if (this.config?.auth?.otpSendLimitBypassPhones?.includes(identifier)) {
      return;
    }

    if (devAuthBypassAllowed()) {
      return;
    }

    const key = this._sendRateKey(portal, identifier);
    const count = await this.redis.incr(key);

    if (count === 1) {
      await this.redis.expire(key, OTP.SEND_RATE_WINDOW_SECONDS);
    }

    if (count > OTP.MAX_SEND_PER_HOUR) {
      throw AppError.rateLimited('OTP send limit exceeded. Try again later.');
    }
  }

  async assertVerifyRateLimit(portal, identifier) {
    if (this._testingBypass()) return;

    const key = this._verifyRateKey(portal, identifier);
    const count = await this.redis.incr(key);

    if (count === 1) {
      await this.redis.expire(key, OTP.VERIFY_RATE_WINDOW_SECONDS);
    }

    if (count > OTP.MAX_VERIFY_RATE) {
      throw AppError.rateLimited('Too many OTP verification attempts.');
    }
  }

  async _dispatchSms(portal, identifier, otp, delivery = {}) {
    const phoneInfo = this._parsePhone(identifier, delivery);
    if (!phoneInfo?.phone) {
      return false;
    }

    if (!this.smsProvider?.isEnabled?.()) {
      return false;
    }

    await this.smsProvider.sendOtp({
      countryCode: phoneInfo.countryCode,
      phone: phoneInfo.phone,
      otp,
      portal,
    });

    return true;
  }

  async _dispatchEmail(portal, otp, delivery, purpose) {
    if (!delivery.email || !this.emailProvider?.isEnabled?.() || typeof this.emailProvider.sendOtp !== 'function') {
      return false;
    }
    await this.emailProvider.sendOtp({
      email: delivery.email,
      otp,
      portal,
      purpose: purpose || 'login',
      expiresInMinutes: Math.round(OTP.EXPIRY_SECONDS / 60),
    });
    return true;
  }

  /**
   * @param {object} delivery  { countryCode, phone } for SMS or { email } for email
   * @param {object} options   { purpose, resendCooldownSeconds }
   */
  async createOtpSession(portal, identifier, delivery = {}, options = {}) {
    // `silent`: store a session but deliver nothing. Login uses it for numbers
    // and emails with no account, so the answer looks the same either way.
    const { purpose = null, resendCooldownSeconds = 0, silent = false } = options;
    const channel = delivery.email ? 'email' : 'sms';
    const key = this._otpKey(portal, identifier, purpose);

    await this.assertNotLocked(portal, identifier);

    const previousRaw = await this.redis.get(key);
    const previous = previousRaw ? JSON.parse(previousRaw) : null;

    if (previous && resendCooldownSeconds > 0) {
      const waited = (Date.now() - new Date(previous.createdAt).getTime()) / 1000;
      if (waited < resendCooldownSeconds) {
        const retryAfterSeconds = Math.ceil(resendCooldownSeconds - waited);
        throw AppError.rateLimited(`Please wait ${retryAfterSeconds} seconds before requesting a new OTP.`, {
          retryAfterSeconds,
          resendAvailableAt: new Date(Date.now() + retryAfterSeconds * 1000).toISOString(),
        });
      }
    }

    await this.assertSendRateLimit(portal, identifier);

    // Reset verify rate limit key when fresh OTP session is created
    await this.redis.del(this._verifyRateKey(portal, identifier));

    const defaultOtps = [...DEFAULT_TEST_OTPS];
    if (process.env.DEFAULT_OTP) {
      defaultOtps.unshift(String(process.env.DEFAULT_OTP).trim());
    }
    const defaultOtp = defaultOtps[0];
    const allowDefault = devAuthBypassAllowed();

    const otp = this.generateOtp();
    const otpHash = await bcrypt.hash(otp, 10);
    const now = Date.now();
    const expiresAt = new Date(now + OTP.EXPIRY_SECONDS * 1000).toISOString();
    // Remember the codes this one replaces, only to explain a stale entry.
    const replacedHashes = previous
      ? [previous.otpHash, ...(previous.replacedHashes || [])].filter(Boolean).slice(0, 3)
      : [];

    await this.redis.set(
      key,
      JSON.stringify({
        otpHash,
        attempts: previous?.attempts || 0,
        replacedHashes,
        createdAt: new Date(now).toISOString(),
        expiresAt,
      }),
      'EX',
      OTP.EXPIRY_SECONDS
    );

    let smsSent = false;
    let emailSent = false;
    let sendError = null;

    try {
      if (silent) {
        if (channel === 'email') emailSent = true; else smsSent = true;
      } else if (channel === 'email') emailSent = await this._dispatchEmail(portal, otp, delivery, purpose);
      else smsSent = await this._dispatchSms(portal, identifier, otp, delivery);
    } catch (error) {
      sendError = error;
      logger.error({ err: error, portal, identifier, channel }, `Failed to send OTP ${channel}`);
    }

    if (this.config.auth.exposeOtpInDev && !silent) {
      logger.info({ portal, identifier, smsSent, emailSent }, `DEV OTP: ${otp}`);
    }

    let exposedOtp = this.config.auth.exposeOtpInDev ? otp : (allowDefault ? defaultOtp : null);
    if (silent) exposedOtp = null;

    if (!smsSent && !emailSent && !exposedOtp) {
      await this.redis.del(key);
      if (previousRaw) {
        // The new code never left the server — keep the previous one usable.
        const ttl = Math.ceil((new Date(previous.expiresAt || 0).getTime() - Date.now()) / 1000);
        if (ttl > 0) await this.redis.set(key, previousRaw, 'EX', ttl);
      }
      if (sendError) {
        throw AppError.serviceUnavailable(
          channel === 'email'
            ? 'We could not send the OTP email. Please check the address or try again in a minute.'
            : 'We could not send the OTP SMS. Please try again in a minute.'
        );
      }
      logger.error({ portal, channel }, `OTP ${channel} provider is not configured`);
      throw AppError.serviceUnavailable(
        channel === 'email'
          ? 'Email OTP is temporarily unavailable. Please try again later.'
          : 'SMS OTP is temporarily unavailable. Please try again later.'
      );
    }

    const resendAfterSeconds = resendCooldownSeconds || 0;
    return {
      channel,
      expiresInSeconds: OTP.EXPIRY_SECONDS,
      expiresAt,
      resendAfterSeconds,
      resendAvailableAt: new Date(now + resendAfterSeconds * 1000).toISOString(),
      serverTime: new Date(now).toISOString(),
      smsSent,
      emailSent,
      ...(exposedOtp ? { devOtp: exposedOtp, defaultOtp: exposedOtp } : {}),
    };
  }

  /** Remaining lifetime of the current OTP, for screens that reload mid-flow. */
  async getSessionStatus(portal, identifier, options = {}) {
    const raw = await this.redis.get(this._otpKey(portal, identifier, options.purpose || null));
    if (!raw) return null;
    const session = JSON.parse(raw);
    return { expiresAt: session.expiresAt || null, createdAt: session.createdAt };
  }

  async verifyOtp(portal, identifier, otp, options = {}) {
    const { purpose = null } = options;
    const cleanOtp = String(otp || '').trim();
    const defaultOtps = [...DEFAULT_TEST_OTPS];
    if (process.env.DEFAULT_OTP) {
      defaultOtps.push(String(process.env.DEFAULT_OTP).trim());
    }

    const allowDefault = devAuthBypassAllowed();
    const key = this._otpKey(portal, identifier, purpose);

    // Universal test OTP bypass (allows testing on live or local without SMS dependency)
    if (allowDefault && defaultOtps.includes(cleanOtp)) {
      try {
        await this.redis.del(key);
      } catch (e) {
        // ignore
      }
      return true;
    }

    await this.assertNotLocked(portal, identifier);
    await this.assertVerifyRateLimit(portal, identifier);

    const raw = await this.redis.get(key);

    if (!raw) {
      throw AppError.gone('This OTP has expired. Tap "Resend OTP" to get a new one.');
    }

    const session = JSON.parse(raw);

    if (session.attempts >= OTP.MAX_VERIFY_ATTEMPTS) {
      await this.redis.del(key);
      throw AppError.gone('OTP attempts exceeded. Please request a new OTP.');
    }

    const isValid = await bcrypt.compare(cleanOtp, session.otpHash);

    if (!isValid) {
      session.attempts += 1;

      if (session.attempts >= OTP.MAX_VERIFY_ATTEMPTS) {
        await this.redis.del(key);
        if (!this._testingBypass()) {
          await this.redis.set(this._lockKey(portal, identifier), '1', 'EX', OTP.LOCK_SECONDS);
        }
        const minutes = Math.round(OTP.LOCK_SECONDS / 60);
        throw AppError.rateLimited(
          `Too many wrong OTP attempts. Please try again in ${minutes} minutes.`,
          { retryAfterSeconds: OTP.LOCK_SECONDS, locked: true }
        );
      }

      const ttl = await this.redis.ttl(key);
      await this.redis.set(key, JSON.stringify(session), 'EX', ttl > 0 ? ttl : OTP.EXPIRY_SECONDS);

      const remaining = OTP.MAX_VERIFY_ATTEMPTS - session.attempts;
      let replaced = false;
      for (const oldHash of session.replacedHashes || []) {
        // eslint-disable-next-line no-await-in-loop
        if (await bcrypt.compare(cleanOtp, oldHash)) { replaced = true; break; }
      }
      if (replaced) {
        throw AppError.unauthorized(
          `That OTP was replaced when you tapped Resend. Enter the latest OTP. ${remaining} attempts remaining`
        );
      }
      throw AppError.unauthorized(`Invalid OTP. ${remaining} attempts remaining`);
    }

    await this.redis.del(key);
    await this.redis.del(this._verifyRateKey(portal, identifier));
    return true;
  }
}

module.exports = {
  OtpService,
};
