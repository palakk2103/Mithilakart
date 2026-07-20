const { BaseService } = require('../../core/BaseService');
const { AppError } = require('../../utils/AppError');
const { PORTALS } = require('../../constants/portals');
const { USER_STATUS } = require('../../constants/auth');
const { eventBus } = require('../../events/EventBus');

class CustomerAuthService extends BaseService {
  constructor(dependencies) {
    super();
    this.userRepository = dependencies.userRepository;
    this.otpService = dependencies.otpService;
    this.tokenService = dependencies.tokenService;
    this.sessionService = dependencies.sessionService;
    this.config = dependencies.config;
    this.cartMergeService = dependencies.cartMergeService || null;
  }

  _phoneIdentifier(countryCode, phone) {
    return `${countryCode}:${phone}`;
  }

  async sendPhoneOtp({ countryCode, phone }) {
    return this.otpService.createOtpSession(
      PORTALS.CUSTOMER,
      this._phoneIdentifier(countryCode, phone),
      { countryCode, phone }
    );
  }

  async sendEmailOtp({ email }) {
    return this.otpService.createOtpSession(
      PORTALS.CUSTOMER,
      email.toLowerCase()
    );
  }

  async verifyPhoneOtp({ countryCode, phone, otp, name, deviceId }, sessionMeta) {
    await this.otpService.verifyOtp(
      PORTALS.CUSTOMER,
      this._phoneIdentifier(countryCode, phone),
      otp
    );

    let user = await this.userRepository.findByPhone(phone, countryCode);
    let isNewUser = false;

    if (!user) {
      user = await this.userRepository.createUser({
        phone,
        countryCode,
        name: name || null,
        authProvider: 'phone',
        isVerified: true,
        status: USER_STATUS.ACTIVE,
      });
      isNewUser = true;
      eventBus.publish('user.registered', { userId: user._id, portal: PORTALS.CUSTOMER });
    } else {
      if (user.status !== USER_STATUS.ACTIVE) {
        throw AppError.forbidden('Account is not active');
      }

      user.isVerified = true;
      await user.save();
    }

    eventBus.publish('user.logged_in', { userId: user._id, portal: PORTALS.CUSTOMER });

    // Phase 3: merge guest cart into customer cart on successful login.
    if (this.cartMergeService?.mergeGuestIntoCustomer && sessionMeta?.sessionId) {
      await this.cartMergeService.mergeGuestIntoCustomer({
        guestSessionId: sessionMeta.sessionId,
        customerId: user._id.toString(),
        commerceFlow: 'standard',
      });
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
      userAgent: sessionMeta.userAgent,
    });

    return {
      user: this._serializeUser(user),
      tokens,
      isNewUser,
    };
  }

  async verifyEmailOtp({ email, otp, name, deviceId }, sessionMeta) {
    const normalizedEmail = email.toLowerCase();
    await this.otpService.verifyOtp(PORTALS.CUSTOMER, normalizedEmail, otp);

    let user = await this.userRepository.findByEmail(normalizedEmail);
    let isNewUser = false;

    if (!user) {
      user = await this.userRepository.createUser({
        email: normalizedEmail,
        name: name || null,
        authProvider: 'email',
        isVerified: true,
        status: USER_STATUS.ACTIVE,
      });
      isNewUser = true;
      eventBus.publish('user.registered', { userId: user._id, portal: PORTALS.CUSTOMER });
    } else {
      if (user.status !== USER_STATUS.ACTIVE) {
        throw AppError.forbidden('Account is not active');
      }

      user.isVerified = true;
      await user.save();
    }

    eventBus.publish('user.logged_in', { userId: user._id, portal: PORTALS.CUSTOMER });

    // Phase 3: merge guest cart into customer cart on successful login.
    if (this.cartMergeService?.mergeGuestIntoCustomer && sessionMeta?.sessionId) {
      await this.cartMergeService.mergeGuestIntoCustomer({
        guestSessionId: sessionMeta.sessionId,
        customerId: user._id.toString(),
        commerceFlow: 'standard',
      });
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
      userAgent: sessionMeta.userAgent,
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

  _serializeUser(user) {
    return {
      id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      countryCode: user.countryCode,
      authProvider: user.authProvider,
      locale: user.locale,
      status: user.status,
    };
  }
}

module.exports = {
  CustomerAuthService,
};
