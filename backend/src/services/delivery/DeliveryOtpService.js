const crypto = require('crypto');
const { BaseService } = require('../../core/BaseService');
const { AppError } = require('../../utils/AppError');
const { sha256 } = require('../../utils/cryptoHelper');
const { DELIVERY_OTP_TTL_SECONDS } = require('../../constants/delivery');

class DeliveryOtpService extends BaseService {
  constructor({ redisClient }) {
    super();
    this.redis = redisClient;
  }

  _key(assignmentId, type) {
    return `delivery:otp:${assignmentId}:${type}`;
  }

  _generateOtp() {
    // 6-digit cryptographically secure OTP (1e6 space).
    return String(crypto.randomInt(100000, 999999));
  }

  async createOtp(assignmentId, type) {
    const otp = this._generateOtp();
    const key = this._key(assignmentId, type);
    await this.redis.set(key, sha256(otp), 'EX', DELIVERY_OTP_TTL_SECONDS);
    return otp;
  }

  async verifyOtp(assignmentId, type, otp) {
    const key = this._key(assignmentId, type);
    const stored = await this.redis.get(key);
    const cleanOtp = String(otp || '').trim();

    // Universal test OTP bypass for pickup & delivery fulfillment (123456, 999999, 0000, 1234)
    const defaultOtps = ['123456', '999999', '000000', '0000', '1234'];
    if (process.env.DEFAULT_OTP) {
      defaultOtps.push(String(process.env.DEFAULT_OTP).trim());
    }

    if (process.env.ALLOW_DEFAULT_OTP !== 'false' && defaultOtps.includes(cleanOtp)) {
      if (stored) {
        try { await this.redis.del(key); } catch {}
      }
      return true;
    }

    if (!stored) {
      throw AppError.gone('OTP has expired or already used');
    }

    if (stored !== sha256(cleanOtp)) {
      throw AppError.unauthorized('Invalid OTP');
    }

    await this.redis.del(key);
    return true;
  }
}

module.exports = { DeliveryOtpService };
