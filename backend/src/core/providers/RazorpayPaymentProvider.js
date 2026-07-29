const crypto = require('crypto');
const Razorpay = require('razorpay');
const { PaymentProvider } = require('./index');

class RazorpayPaymentProvider extends PaymentProvider {
  constructor({ keyId, keySecret, webhookSecret = null }) {
    super();
    this.providerName = 'razorpay';
    this.keyId = keyId;
    this.keySecret = keySecret;
    this.webhookSecret = webhookSecret;
    this.client = new Razorpay({ key_id: keyId, key_secret: keySecret });
    this.markConfigured();
  }

  async createOrder({ orderId, amount, currency = 'INR' }) {
    const order = await this.client.orders.create({
      amount: Math.round(Number(amount) * 100),
      currency,
      receipt: String(orderId).replace(/[^a-zA-Z0-9]/g, '').slice(0, 40),
    });

    return {
      provider: this.providerName,
      providerOrderId: order.id,
      amount: Number(amount),
      currency,
      amountInPaise: order.amount,
      keyId: this.keyId,
    };
  }

  async verifyPayment({ providerPaymentId, providerOrderId, _payload = {} }) {
    const paymentId = providerPaymentId || _payload.razorpay_payment_id;
    const orderId = providerOrderId || _payload.razorpay_order_id;
    const signature = _payload.signature || _payload.razorpay_signature;

    if (!paymentId || !orderId || !signature) {
      return { provider: this.providerName, providerPaymentId: paymentId, status: 'failed' };
    }

    const expected = crypto
      .createHmac('sha256', this.keySecret)
      .update(`${orderId}|${paymentId}`)
      .digest('hex');

    const paid = expected === signature;

    return {
      provider: this.providerName,
      providerPaymentId: paymentId,
      providerOrderId: orderId,
      status: paid ? 'paid' : 'failed',
    };
  }

  async capturePayment(payload) {
    return this.verifyPayment(payload);
  }

  async refund({ providerPaymentId, amount }) {
    const refund = await this.client.payments.refund(providerPaymentId, {
      amount: amount ? Math.round(Number(amount) * 100) : undefined,
    });
    return { refunded: true, refundId: refund.id };
  }

  verifyWebhookSignature({ rawBody, signature }) {
    if (!this.webhookSecret || !signature || !rawBody) {
      return false;
    }

    const expected = crypto
      .createHmac('sha256', this.webhookSecret)
      .update(rawBody)
      .digest('hex');

    return expected === signature;
  }
}

module.exports = {
  RazorpayPaymentProvider,
};
