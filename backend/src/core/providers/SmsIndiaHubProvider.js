const { SmsProvider } = require('./index');
const { logger } = require('../../utils/logger');

class SmsIndiaHubProvider extends SmsProvider {
  constructor(config) {
    super();
    this.providerName = 'smsindiahub';
    this.config = config;
    this.markConfigured();
  }

  isEnabled() {
    return Boolean(this.config.sms?.enabled);
  }

  _formatMobile(countryCode, phone) {
    const digits = String(phone).replace(/\D/g, '');
    const code = String(countryCode || '+91').replace(/\D/g, '');
    if (digits.startsWith(code)) {
      return digits;
    }
    return `${code}${digits}`;
  }

  _buildOtpMessage(otp) {
    const template = this.config.sms.otpTemplate
      || 'Welcome to ##var## Powered by IIDMTB. Use OTP ##var## to verify your login.';
    const brand = this.config.sms.otpBrandName || 'Mithilakart';

    let replaced = 0;
    return template.replace(/##var##/g, () => {
      replaced += 1;
      return replaced === 1 ? brand : String(otp);
    });
  }

  async sendOtp({ countryCode, phone, otp, portal = 'customer' }) {
    return this.send({
      countryCode,
      phone,
      message: this._buildOtpMessage(otp),
      portal,
    });
  }

  async send({ countryCode, phone, message }) {
    const { sms } = this.config;

    const url = new URL(sms.gatewayUrl);
    url.searchParams.set('APIKey', sms.apiKey);
    url.searchParams.set('senderid', sms.senderId);
    url.searchParams.set('channel', sms.channel || 'Trans');
    url.searchParams.set('DCS', '0');
    url.searchParams.set('flashsms', '0');
    url.searchParams.set('number', this._formatMobile(countryCode, phone));
    url.searchParams.set('text', message);
    // SMS India Hub cloud API uses route + PEId; also send EntityId/dlttemplateid for compatibility
    url.searchParams.set('route', sms.dltTemplateId);
    url.searchParams.set('PEId', sms.entityId);
    url.searchParams.set('EntityId', sms.entityId);
    url.searchParams.set('dlttemplateid', sms.dltTemplateId);

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: { Accept: 'application/json' },
    });

    const body = await response.text();

    if (!response.ok) {
      logger.error({ status: response.status, body }, 'SMS India Hub HTTP error');
      throw new Error('Failed to send SMS');
    }

    let parsed;
    try {
      parsed = JSON.parse(body);
    } catch {
      parsed = null;
    }

    const errorCode = parsed?.ErrorCode ?? parsed?.errorCode ?? null;
    if (errorCode && errorCode !== '000' && errorCode !== 0 && errorCode !== '0') {
      const errorMessage = parsed?.ErrorMessage || parsed?.errorMessage || body.slice(0, 200);
      logger.error({ errorCode, errorMessage, phone: this._formatMobile(countryCode, phone) }, 'SMS India Hub API error');
      throw new Error(`SMS delivery failed: ${errorMessage}`);
    }

    logger.info({ phone: this._formatMobile(countryCode, phone), body: body.slice(0, 200) }, 'SMS sent');

    return { success: true, provider: this.providerName, response: body };
  }
}

module.exports = {
  SmsIndiaHubProvider,
};
