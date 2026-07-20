const { BaseService } = require('../../core/BaseService');
const { AppError } = require('../../utils/AppError');
const { PORTALS } = require('../../constants/portals');
const { SELLER_STATUS, KYC_STATUS } = require('../../constants/auth');

class SellerAuthService extends BaseService {
  constructor(dependencies) {
    super();
    this.sellerRepository = dependencies.sellerRepository;
    this.passwordService = dependencies.passwordService;
    this.tokenService = dependencies.tokenService;
    this.sessionService = dependencies.sessionService;
    this.otpService = dependencies.otpService || null;
  }

  _phoneIdentifier(countryCode, phone) {
    return `${countryCode}:${phone}`;
  }

  async sendPhoneOtp({ countryCode, phone }) {
    if (!this.otpService) {
      throw AppError.internal('OTP service unavailable');
    }

    return this.otpService.createOtpSession(
      PORTALS.SELLER,
      this._phoneIdentifier(countryCode, phone),
      { countryCode, phone }
    );
  }

  async register({ name, email, storeName, phone, countryCode = '+91', password, otp, deviceId }, sessionMeta) {
    if (!this.otpService) {
      throw AppError.internal('OTP service unavailable');
    }

    await this.otpService.verifyOtp(
      PORTALS.SELLER,
      this._phoneIdentifier(countryCode, phone),
      otp
    );

    const existingEmail = await this.sellerRepository.findByEmail(email);
    if (existingEmail) {
      throw AppError.conflict('Seller already registered with this email');
    }

    const existingPhone = await this.sellerRepository.findByPhone(phone, countryCode);
    if (existingPhone) {
      throw AppError.conflict('Seller already registered with this phone number');
    }

    const passwordHash = await this.passwordService.hash(password);
    const seller = await this.sellerRepository.create({
      name,
      email: email.toLowerCase(),
      storeName,
      phone,
      passwordHash,
      status: SELLER_STATUS.INACTIVE,
      kycStatus: KYC_STATUS.PENDING,
    });

    const tokens = await this.tokenService.issueTokenPair({
      portal: PORTALS.SELLER,
      subject: seller._id.toString(),
      role: 'seller',
      claims: { sellerId: seller._id.toString() },
      sessionMeta: { ...sessionMeta, deviceId },
    });

    await this.sessionService.trackDevice({
      userId: seller._id,
      portal: PORTALS.SELLER,
      deviceId,
      userAgent: sessionMeta.userAgent,
    });

    return {
      seller: this._serializeSeller(seller),
      tokens,
      message: 'Registration submitted. Await admin KYC approval before selling.',
    };
  }

  async login({ email, password, deviceId }, sessionMeta) {
    const seller = await this.sellerRepository.findByEmail(email);

    if (!seller) {
      throw AppError.unauthorized('Invalid email or password');
    }

    if (this.passwordService.isLocked(seller)) {
      throw AppError.rateLimited(
        `Account locked. Try again in ${this.passwordService.getLockoutRemainingMinutes(seller)} minutes`
      );
    }

    const passwordValid = await this.passwordService.compare(password, seller.passwordHash);

    if (!passwordValid) {
      const updated = await this.sellerRepository.incrementFailedAttempts(seller._id);

      if (this.passwordService.shouldLockAccount(updated.failedLoginAttempts)) {
        await this.sellerRepository.setLockUntil(
          seller._id,
          this.passwordService.getLockUntilDate()
        );
        throw AppError.rateLimited('Account locked due to multiple failed login attempts');
      }

      throw AppError.unauthorized('Invalid email or password');
    }

    if (seller.status !== SELLER_STATUS.ACTIVE) {
      throw AppError.forbidden('Seller account is not active');
    }

    if (seller.kycStatus !== KYC_STATUS.APPROVED) {
      throw AppError.forbidden('Seller KYC is not approved');
    }

    await this.sellerRepository.resetFailedAttempts(seller._id);

    const tokens = await this.tokenService.issueTokenPair({
      portal: PORTALS.SELLER,
      subject: seller._id.toString(),
      role: 'seller',
      claims: { sellerId: seller._id.toString() },
      sessionMeta: { ...sessionMeta, deviceId },
    });

    await this.sessionService.trackDevice({
      userId: seller._id,
      portal: PORTALS.SELLER,
      deviceId,
      userAgent: sessionMeta.userAgent,
    });

    return {
      seller: this._serializeSeller(seller),
      tokens,
    };
  }

  async refresh(refreshToken, sessionMeta) {
    const tokens = await this.tokenService.refreshTokens(refreshToken, PORTALS.SELLER, sessionMeta);
    return { tokens };
  }

  async logout({ refreshToken, accessToken }) {
    await this.tokenService.logout({
      portal: PORTALS.SELLER,
      refreshToken,
      accessToken,
    });
  }

  _serializeSeller(seller) {
    return {
      id: seller._id,
      name: seller.name,
      email: seller.email,
      storeName: seller.storeName,
      phone: seller.phone,
      status: seller.status,
      kycStatus: seller.kycStatus,
    };
  }
}

module.exports = {
  SellerAuthService,
};
