class BaseProvider {
  constructor(name) {
    this.name = name;
    this.isConfigured = false;
  }

  ensureConfigured() {
    if (!this.isConfigured) {
      throw new Error(`${this.name} provider is not configured`);
    }
  }

  markConfigured() {
    this.isConfigured = true;
  }
}

class PaymentProvider extends BaseProvider {
  constructor() {
    super('Payment');
  }

  async createOrder(_payload) {
    this.ensureConfigured();
    throw new Error('PaymentProvider.createOrder is not implemented');
  }

  async verifyPayment(_payload) {
    this.ensureConfigured();
    throw new Error('PaymentProvider.verifyPayment is not implemented');
  }

  async capturePayment(_payload) {
    this.ensureConfigured();
    throw new Error('PaymentProvider.capturePayment is not implemented');
  }

  async refund(_payload) {
    this.ensureConfigured();
    throw new Error('PaymentProvider.refund is not implemented');
  }

  async verifyWebhookSignature(_payload) {
    this.ensureConfigured();
    throw new Error('PaymentProvider.verifyWebhookSignature is not implemented');
  }
}

class StorageProvider extends BaseProvider {
  constructor() {
    super('Storage');
  }

  async getPresignedUploadUrl(_payload) {
    this.ensureConfigured();
    throw new Error('StorageProvider.getPresignedUploadUrl is not implemented');
  }

  async confirmUpload(_payload) {
    this.ensureConfigured();
    throw new Error('StorageProvider.confirmUpload is not implemented');
  }

  async deleteObject(_payload) {
    this.ensureConfigured();
    throw new Error('StorageProvider.deleteObject is not implemented');
  }

  async getPublicUrl(_payload) {
    this.ensureConfigured();
    throw new Error('StorageProvider.getPublicUrl is not implemented');
  }
}

class EmailProvider extends BaseProvider {
  constructor() {
    super('Email');
  }

  async send(_payload) {
    this.ensureConfigured();
    throw new Error('EmailProvider.send is not implemented');
  }

  async sendTemplate(_payload) {
    this.ensureConfigured();
    throw new Error('EmailProvider.sendTemplate is not implemented');
  }
}

class SmsProvider extends BaseProvider {
  constructor() {
    super('SMS');
  }

  async send(_payload) {
    this.ensureConfigured();
    throw new Error('SmsProvider.send is not implemented');
  }

  async sendOtp(_payload) {
    this.ensureConfigured();
    throw new Error('SmsProvider.sendOtp is not implemented');
  }
}

class PushNotificationProvider extends BaseProvider {
  constructor() {
    super('PushNotification');
  }

  async sendToDevice(_payload) {
    this.ensureConfigured();
    throw new Error('PushNotificationProvider.sendToDevice is not implemented');
  }

  async sendToTopic(_payload) {
    this.ensureConfigured();
    throw new Error('PushNotificationProvider.sendToTopic is not implemented');
  }
}

class CacheProvider extends BaseProvider {
  constructor() {
    super('Cache');
  }

  async get(_key) {
    this.ensureConfigured();
    throw new Error('CacheProvider.get is not implemented');
  }

  async set(_key, _value, _ttlSeconds) {
    this.ensureConfigured();
    throw new Error('CacheProvider.set is not implemented');
  }

  async del(_key) {
    this.ensureConfigured();
    throw new Error('CacheProvider.del is not implemented');
  }

  async exists(_key) {
    this.ensureConfigured();
    throw new Error('CacheProvider.exists is not implemented');
  }
}

class ShippingProvider extends BaseProvider {
  constructor() {
    super('Shipping');
  }

  async createShipment(_payload) {
    this.ensureConfigured();
    throw new Error('ShippingProvider.createShipment is not implemented');
  }

  async trackShipment(_payload) {
    this.ensureConfigured();
    throw new Error('ShippingProvider.trackShipment is not implemented');
  }

  async cancelShipment(_payload) {
    this.ensureConfigured();
    throw new Error('ShippingProvider.cancelShipment is not implemented');
  }
}

class AnalyticsProvider extends BaseProvider {
  constructor() {
    super('Analytics');
  }

  async trackEvent(_payload) {
    this.ensureConfigured();
    throw new Error('AnalyticsProvider.trackEvent is not implemented');
  }

  async identifyUser(_payload) {
    this.ensureConfigured();
    throw new Error('AnalyticsProvider.identifyUser is not implemented');
  }
}

class MediaProvider extends BaseProvider {
  constructor() {
    super('Media');
  }

  async upload(_payload) {
    this.ensureConfigured();
    throw new Error('MediaProvider.upload is not implemented');
  }

  async transform(_payload) {
    this.ensureConfigured();
    throw new Error('MediaProvider.transform is not implemented');
  }

  async delete(_payload) {
    this.ensureConfigured();
    throw new Error('MediaProvider.delete is not implemented');
  }
}

module.exports = {
  BaseProvider,
  PaymentProvider,
  StorageProvider,
  EmailProvider,
  SmsProvider,
  PushNotificationProvider,
  CacheProvider,
  ShippingProvider,
  AnalyticsProvider,
  MediaProvider,
};
