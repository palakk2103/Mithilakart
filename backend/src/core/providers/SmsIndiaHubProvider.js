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

  _gatewayCandidates(sms) {
    const primary = sms.gatewayUrl || 'https://cloud.smsindiahub.in/vendorsms/pushsms.aspx';
    const fallbacks = [
      'https://cloud.smsindiahub.in/vendorsms/pushsms.aspx',
      'https://cloud.smsindiahub.in/api/mt/SendSMS',
    ];
    return [primary, ...fallbacks.filter((u) => u !== primary)];
  }

  _buildUrl(gatewayUrl, sms, number, message) {
    const url = new URL(gatewayUrl);
    const isVendorPush = gatewayUrl.includes('vendorsms/pushsms');

    url.searchParams.set('APIKey', sms.apiKey);

    if (isVendorPush) {
      // Legacy transactional API — more reliable DLT handoff on SMS India Hub
      url.searchParams.set('msisdn', number);
      url.searchParams.set('sid', sms.senderId);
      url.searchParams.set('msg', message);
      url.searchParams.set('fl', '0');
      url.searchParams.set('gwid', sms.route || '2');
    } else {
      url.searchParams.set('senderid', sms.senderId);
      url.searchParams.set('channel', sms.channel || '2');
      url.searchParams.set('DCS', '0');
      url.searchParams.set('flashsms', '0');
      url.searchParams.set('number', number);
      url.searchParams.set('text', message);
      url.searchParams.set('route', sms.route || '1');
    }

    url.searchParams.set('EntityId', sms.entityId);
    url.searchParams.set('dlttemplateid', sms.dltTemplateId);
    url.searchParams.set('PEId', sms.entityId);

    return url;
  }

  _parseBody(body) {
    try {
      return JSON.parse(body);
    } catch {
      return null;
    }
  }

  _isSuccess(parsed) {
    if (!parsed) return false;
    const errorCode = parsed.ErrorCode ?? parsed.errorCode ?? null;
    return errorCode === '000' || errorCode === 0 || errorCode === '0';
  }

  async send({ countryCode, phone, message }) {
    const { sms } = this.config;
    const number = this._formatMobile(countryCode, phone);
    const gateways = this._gatewayCandidates(sms);
    let lastError = null;

    for (const gatewayUrl of gateways) {
      const url = this._buildUrl(gatewayUrl, sms, number, message);

      logger.info(
        {
          phone: number,
          gateway: gatewayUrl,
          senderid: sms.senderId,
          channel: sms.channel || (gatewayUrl.includes('vendorsms') ? 'gwid=2' : '2'),
          dltTemplateId: sms.dltTemplateId,
          textPreview: message.slice(0, 120),
        },
        'SMS India Hub request'
      );

      let response;
      let body;
      try {
        response = await fetch(url.toString(), {
          method: 'GET',
          headers: { Accept: 'application/json' },
        });
        body = await response.text();
      } catch (error) {
        lastError = error;
        logger.error({ err: error, gateway: gatewayUrl }, 'SMS India Hub network error');
        continue;
      }

      if (!response.ok) {
        lastError = new Error(`HTTP ${response.status}`);
        logger.error({ status: response.status, body, gateway: gatewayUrl }, 'SMS India Hub HTTP error');
        continue;
      }

      const parsed = this._parseBody(body);

      if (!this._isSuccess(parsed)) {
        const errorCode = parsed?.ErrorCode ?? parsed?.errorCode ?? 'unknown';
        const errorMessage = parsed?.ErrorMessage || parsed?.errorMessage || body.slice(0, 200);
        lastError = new Error(`SMS delivery failed: ${errorMessage}`);
        logger.error({ errorCode, errorMessage, phone: number, gateway: gatewayUrl }, 'SMS India Hub API error');

        // insufficient credits on this route — try next gateway
        if (String(errorCode) === '21') continue;
        throw lastError;
      }

      logger.info(
        {
          phone: number,
          jobId: parsed?.JobId,
          gateway: gatewayUrl,
          echoedMessage: Boolean(parsed?.MessageData?.[0]?.Message),
          body: body.slice(0, 240),
        },
        'SMS sent'
      );

      return {
        success: true,
        provider: this.providerName,
        response: body,
        jobId: parsed?.JobId || null,
        gateway: gatewayUrl,
      };
    }

    throw lastError || new Error('Failed to send SMS');
  }
}

module.exports = {
  SmsIndiaHubProvider,
};
