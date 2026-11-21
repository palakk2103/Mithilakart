const nodemailer = require('nodemailer');
const { logger } = require('../../utils/logger');

const PURPOSE_TEXT = {
  register: 'verify your email for your new Mithilakart account',
  login: 'log in to Mithilakart',
};

/**
 * Sends OTP emails over SMTP. Email OTPs were never delivered before this
 * provider existed: the OTP was created and stored, but only SMS had a sender.
 */
class SmtpEmailProvider {
  constructor(emailConfig) {
    this.from = emailConfig.from;
    this.transport = nodemailer.createTransport({
      host: emailConfig.host,
      port: emailConfig.port,
      secure: emailConfig.secure,
      auth: emailConfig.user ? { user: emailConfig.user, pass: emailConfig.password } : undefined,
    });
  }

  get providerName() { return 'smtp'; }

  isEnabled() {
    return true;
  }

  async send({ email, subject, body, html }) {
    const info = await this.transport.sendMail({ from: this.from, to: email, subject, text: body, html });
    logger.info({ email, messageId: info.messageId }, 'Email sent');
    return { success: true, messageId: info.messageId };
  }

  async sendOtp({ email, otp, purpose = 'login', expiresInMinutes = 5 }) {
    const action = PURPOSE_TEXT[purpose] || PURPOSE_TEXT.login;
    const body = `Your Mithilakart OTP is ${otp}. Use it to ${action}. `
      + `It expires in ${expiresInMinutes} minutes. Do not share it with anyone.`;
    const html = `<div style="font-family:Arial,sans-serif;max-width:420px;margin:auto;padding:24px">
<h2 style="color:#2E7D32;margin:0 0 12px">Mithilakart</h2>
<p>Use this code to ${action}:</p>
<p style="font-size:30px;letter-spacing:8px;font-weight:bold;margin:16px 0">${otp}</p>
<p style="color:#555">It expires in ${expiresInMinutes} minutes. Never share this code with anyone, including Mithilakart staff.</p>
</div>`;
    return this.send({ email, subject: `${otp} is your Mithilakart OTP`, body, html });
  }
}

module.exports = { SmtpEmailProvider };
