const { BaseService } = require('../../core/BaseService');
const { AppError } = require('../../utils/AppError');

class SellerNotificationService extends BaseService {
  constructor({ sellerNotificationRepository, userDeviceRepository = null }) {
    super();
    this.sellerNotificationRepository = sellerNotificationRepository;
    this.userDeviceRepository = userDeviceRepository;
  }

  async list(sellerId, query = {}) {
    const limit = Math.min(Number(query.limit) || 20, 100);
    return this.sellerNotificationRepository.findBySeller(sellerId, { limit });
  }

  async markRead(sellerId, notificationId) {
    const notification = await this.sellerNotificationRepository.findOne({
      _id: notificationId,
      sellerId,
    });
    if (!notification) throw AppError.notFound('Notification not found');
    return this.sellerNotificationRepository.updateById(notificationId, { isRead: true });
  }

  async markAllRead(sellerId) {
    await this.sellerNotificationRepository.markAllRead(sellerId);
    return { updated: true };
  }

  async registerDeviceToken(sellerId, deviceId, fcmToken, platform = 'web') {
    if (!this.userDeviceRepository) {
      throw AppError.internal('Device repository not configured for seller');
    }
    return this.userDeviceRepository.upsertDevice({
      userId: sellerId,
      portal: 'seller',
      deviceId,
      fcmToken,
      platform,
    });
  }

  async sendTestPush(sellerId, { title = 'Mithilakart Seller Alert', body = 'Push notification test for seller portal', data = {} } = {}) {
    if (!this.userDeviceRepository) {
      throw AppError.internal('Device repository not configured for seller');
    }
    const { getProvider } = require('../../core/providers.registry');
    const pushProvider = getProvider('push');
    const devices = await this.userDeviceRepository.find({ userId: sellerId, portal: 'seller' });
    if (!devices || devices.length === 0) {
      return {
        success: false,
        message: 'No registered devices found for seller',
        devicesFound: 0,
        results: [],
      };
    }
    const results = [];
    const staleTokens = [];
    for (const device of devices) {
      if (!device.fcmToken) {
        results.push({ deviceId: device.deviceId, platform: device.platform, success: false, error: 'missing_fcm_token' });
        continue;
      }
      const res = await pushProvider.sendToDevice({
        token: device.fcmToken,
        title,
        body,
        data: { ...data, portal: 'seller', test: 'true', sentAt: new Date().toISOString() },
      });
      results.push({ deviceId: device.deviceId, platform: device.platform, ...res });
      if (res?.invalidToken) staleTokens.push(device._id);
    }
    if (staleTokens.length) {
      await Promise.all(staleTokens.map((id) => this.userDeviceRepository.updateById(id, { fcmToken: null })));
    }
    return {
      success: results.some((r) => r.success),
      provider: pushProvider?.providerName || 'unknown',
      devicesFound: devices.length,
      results,
    };
  }
}

module.exports = { SellerNotificationService };
