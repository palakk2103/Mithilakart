const { logger } = require('../../utils/logger');

class MockPushProvider {
  get providerName() { return 'mock-fcm'; }

  async send({ token, title, body, data = {} }) {
    logger.info({ token, title, body, data }, 'Mock push notification sent');
    return { success: true, messageId: `mock-push-${Date.now()}` };
  }

  async sendToDevice(payload) {
    return this.send(payload);
  }
}

class MockSmsProvider {
  get providerName() { return 'mock-sms'; }

  async send({ phone, message }) {
    logger.info({ phone, message }, 'Mock SMS sent');
    return { success: true };
  }

  async sendOtp({ phone, otp, countryCode, portal }) {
    logger.info({ phone, countryCode, otp, portal }, 'Mock SMS OTP sent');
    return { success: true };
  }

  isEnabled() {
    return false;
  }
}

class MockEmailProvider {
  get providerName() { return 'mock-email'; }

  async send({ email, subject, body }) {
    logger.info({ email, subject, body }, 'Mock email sent');
    return { success: true };
  }
}

module.exports = { MockPushProvider, MockSmsProvider, MockEmailProvider };
