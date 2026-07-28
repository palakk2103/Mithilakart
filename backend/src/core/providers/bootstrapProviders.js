const config = require('../../config');
const { registerProvider } = require('../providers.registry');
const { MockPaymentProvider } = require('./MockPaymentProvider');
const { RazorpayPaymentProvider } = require('./RazorpayPaymentProvider');
const { MockPushProvider, MockSmsProvider } = require('./MockNotificationProviders');
const { FcmPushProvider } = require('./FcmPushProvider');
const { SmsIndiaHubProvider } = require('./SmsIndiaHubProvider');
const { createShippingProvider } = require('./shipping/createShippingProvider');
const { logger } = require('../../utils/logger');

function bootstrapProviders() {
  const shippingProvider = createShippingProvider(config.shipping?.provider || process.env.SHIPPING_PROVIDER || 'mock');
  registerProvider('shipping', shippingProvider);
  logger.info(`Shipping provider: ${shippingProvider.displayName || shippingProvider.providerName || 'mock'} (e-commerce)`);

  const paymentProvider = String(process.env.PAYMENT_PROVIDER || '').toLowerCase();
  const useMockPayment = paymentProvider === 'mock' || (!config.razorpay?.enabled && paymentProvider !== 'razorpay');

  if (!useMockPayment && config.razorpay?.enabled) {
    registerProvider(
      'payment',
      new RazorpayPaymentProvider({
        keyId: config.razorpay.keyId,
        keySecret: config.razorpay.keySecret,
        webhookSecret: config.razorpay.webhookSecret,
      })
    );
    logger.info('Payment provider: Razorpay');
  } else {
    registerProvider('payment', new MockPaymentProvider());
    logger.warn('Payment provider: mock (set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET for live payments)');
  }

  if (config.fcm?.enabled) {
    try {
      registerProvider(
        'push',
        new FcmPushProvider({
          projectId: config.fcm.projectId,
          serviceAccountPath: config.fcm.serviceAccountPath,
        })
      );
      logger.info('Push provider: Firebase FCM');
    } catch (error) {
      registerProvider('push', new MockPushProvider());
      logger.error({ err: error }, 'FCM init failed — using mock push');
    }
  } else {
    registerProvider('push', new MockPushProvider());
    logger.warn('Push provider: mock (set FCM_PROJECT_ID and FCM_SERVICE_ACCOUNT_PATH for live push)');
  }

  if (config.sms?.enabled) {
    registerProvider('sms', new SmsIndiaHubProvider(config));
    logger.info('SMS provider: SMS India Hub');
  } else {
    registerProvider('sms', new MockSmsProvider());
    logger.warn('SMS provider: mock (configure SMS_PROVIDER=smsindiahub for live OTP SMS)');
  }
}

module.exports = {
  bootstrapProviders,
};
