const {
  StorageProvider,
  EmailProvider,
  SmsProvider,
  PushNotificationProvider,
  CacheProvider,
  ShippingProvider,
  AnalyticsProvider,
  MediaProvider,
} = require('./providers');
const { MockPaymentProvider } = require('./providers/MockPaymentProvider');

const providers = {
  payment: new MockPaymentProvider(),
  storage: new StorageProvider(),
  email: new EmailProvider(),
  sms: new SmsProvider(),
  push: new PushNotificationProvider(),
  cache: new CacheProvider(),
  shipping: new ShippingProvider(),
  analytics: new AnalyticsProvider(),
  media: new MediaProvider(),
};

function getProvider(name) {
  const provider = providers[name];

  if (!provider) {
    throw new Error(`Unknown provider: ${name}`);
  }

  return provider;
}

function registerProvider(name, instance) {
  providers[name] = instance;
}

module.exports = {
  providers,
  getProvider,
  registerProvider,
};
