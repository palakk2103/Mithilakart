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
    return String(Math.floor(1000 + Math.random() * 9000));
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
    if (!stored) {
      throw AppError.gone('OTP has expired or already used');
    }

    if (stored !== sha256(String(otp))) {
      throw AppError.unauthorized('Invalid OTP');
    }

    await this.redis.del(key);
    return true;
  }
}

module.exports = { DeliveryOtpService };
