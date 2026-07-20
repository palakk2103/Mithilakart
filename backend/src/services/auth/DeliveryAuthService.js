const { BaseService } = require('../../core/BaseService');
const { AppError } = require('../../utils/AppError');
const { PORTALS } = require('../../constants/portals');
const { DELIVERY_STATUS } = require('../../constants/auth');

class DeliveryAuthService extends BaseService {
  constructor(dependencies) {
    super();
    this.deliveryPartnerRepository = dependencies.deliveryPartnerRepository;
    this.otpService = dependencies.otpService;
    this.tokenService = dependencies.tokenService;
    this.sessionService = dependencies.sessionService;
  }

  _phoneIdentifier(countryCode, phone) {
    return `${countryCode}:${phone}`;
  }

  async sendOtp({ countryCode, phone }) {
    return this.otpService.createOtpSession(
      PORTALS.DELIVERY,
      this._phoneIdentifier(countryCode, phone),
      { countryCode, phone }
    );
  }

  async signup(payload) {
    const existing = await this.deliveryPartnerRepository.findByPhone(payload.phone, payload.countryCode);

    if (existing) {
      throw AppError.conflict('Delivery partner already registered with this phone number');
    }

    const partner = await this.deliveryPartnerRepository.create({
      name: payload.name,
      phone: payload.phone,
      countryCode: payload.countryCode,
      vehicleType: payload.vehicleType,
      documents: {
        aadharNumber: payload.aadharNumber,
        drivingLicenseNumber: payload.drivingLicenseNumber,
        vehicleRegistrationNumber: payload.vehicleRegistrationNumber,
      },
      status: DELIVERY_STATUS.PENDING,
    });

    return this._serializePartner(partner);
  }

  async verifyOtp({ countryCode, phone, otp, deviceId }, sessionMeta) {
    await this.otpService.verifyOtp(
      PORTALS.DELIVERY,
      this._phoneIdentifier(countryCode, phone),
      otp
    );

    const partner = await this.deliveryPartnerRepository.findByPhone(phone, countryCode);

    if (!partner) {
      throw AppError.notFound('Delivery partner not found. Complete signup first.');
    }

    if (partner.status === DELIVERY_STATUS.REJECTED) {
      throw AppError.forbidden('Delivery partner application was rejected');
    }

    if (partner.status === DELIVERY_STATUS.SUSPENDED) {
      throw AppError.forbidden('Delivery partner account is suspended');
    }

    if (partner.status !== DELIVERY_STATUS.APPROVED) {
      throw AppError.forbidden('Delivery partner account is pending approval');
    }

    const tokens = await this.tokenService.issueTokenPair({
      portal: PORTALS.DELIVERY,
      subject: partner._id.toString(),
      role: 'delivery',
      sessionMeta: { ...sessionMeta, deviceId },
    });

    await this.sessionService.trackDevice({
      userId: partner._id,
      portal: PORTALS.DELIVERY,
      deviceId,
      userAgent: sessionMeta.userAgent,
    });

    return {
      partner: this._serializePartner(partner),
      tokens,
    };
  }

  async refresh(refreshToken, sessionMeta) {
    const tokens = await this.tokenService.refreshTokens(refreshToken, PORTALS.DELIVERY, sessionMeta);
    return { tokens };
  }

  async logout({ refreshToken, accessToken }) {
    await this.tokenService.logout({
      portal: PORTALS.DELIVERY,
      refreshToken,
      accessToken,
    });
  }

  _serializePartner(partner) {
    return {
      id: partner._id,
      name: partner.name,
      phone: partner.phone,
      countryCode: partner.countryCode,
      vehicleType: partner.vehicleType,
      status: partner.status,
    };
  }
}

module.exports = {
  DeliveryAuthService,
};
