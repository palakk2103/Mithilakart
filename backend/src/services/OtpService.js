const crypto = require('crypto');
const bcrypt = require('bcrypt');
const { OTP } = require('../constants/auth');
const { AppError } = require('../utils/AppError');
const { logger } = require('../utils/logger');

class OtpService {
  constructor(redisClient, config, smsProvider = null) {
    this.redis = redisClient;
    this.config = config;
    this.smsProvider = smsProvider;
  }

  _otpKey(portal, identifier) {
    return `otp:${portal}:${identifier}`;
  }

  _sendRateKey(portal, identifier) {
    return `otp:send:${portal}:${identifier}`;
  }

  _verifyRateKey(portal, identifier) {
    return `otp:verify:${portal}:${identifier}`;
  }

  generateOtp() {
    return String(crypto.randomInt(100000, 999999));
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

  async assertSendRateLimit(portal, identifier) {
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
    if (this.config?.auth?.exposeOtpInDev) return;

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

  async createOtpSession(portal, identifier, delivery = {}) {
    await this.assertSendRateLimit(portal, identifier);

    // Reset verify rate limit key when fresh OTP session is created
    await this.redis.del(this._verifyRateKey(portal, identifier));

    const otp = this.generateOtp();
    const otpHash = await bcrypt.hash(otp, 10);
    const key = this._otpKey(portal, identifier);

    await this.redis.set(
      key,
      JSON.stringify({
        otpHash,
        attempts: 0,
        createdAt: new Date().toISOString(),
      }),
      'EX',
      OTP.EXPIRY_SECONDS
    );

    let smsSent = false;

    try {
      smsSent = await this._dispatchSms(portal, identifier, otp, delivery);
    } catch (error) {
      logger.error({ err: error, portal, identifier }, 'Failed to send OTP SMS');

      if (this.config.sms?.enabled && !this.config.auth.exposeOtpInDev) {
        await this.redis.del(key);
        throw AppError.internal('Unable to send OTP SMS. Please try again.');
      }
    }

    if (this.config.auth.exposeOtpInDev) {
      logger.info({ portal, identifier, smsSent }, `DEV OTP: ${otp}`);
    }

    return {
      expiresInSeconds: OTP.EXPIRY_SECONDS,
      smsSent,
      ...(this.config.auth.exposeOtpInDev ? { devOtp: otp } : {}),
    };
  }

  async verifyOtp(portal, identifier, otp) {
    await this.assertVerifyRateLimit(portal, identifier);

    const key = this._otpKey(portal, identifier);
    const raw = await this.redis.get(key);

    if (!raw) {
      throw AppError.gone('OTP expired or not found');
    }

    const session = JSON.parse(raw);

    if (session.attempts >= OTP.MAX_VERIFY_ATTEMPTS) {
      await this.redis.del(key);
      throw AppError.gone('OTP attempts exceeded');
    }

    const isValid = await bcrypt.compare(String(otp), session.otpHash);

    if (!isValid) {
      session.attempts += 1;
      const ttl = await this.redis.ttl(key);
      await this.redis.set(key, JSON.stringify(session), 'EX', ttl > 0 ? ttl : OTP.EXPIRY_SECONDS);
      throw AppError.unauthorized(`Invalid OTP. ${OTP.MAX_VERIFY_ATTEMPTS - session.attempts} attempts remaining`);
    }

    await this.redis.del(key);
    return true;
  }
}

module.exports = {
  OtpService,
};
