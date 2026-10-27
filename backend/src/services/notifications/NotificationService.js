const { BaseService } = require('../../core/BaseService');
const { queueManager } = require('../../queues/QueueManager');
const { getProvider } = require('../../core/providers.registry');
const { MockEmailProvider } = require('../../core/providers/MockNotificationProviders');
const { eventBus } = require('../../events/EventBus');
const { logger } = require('../../utils/logger');

class NotificationService extends BaseService {
  constructor({
    userNotificationRepository,
    notificationTemplateRepository,
    userRepository,
    userDeviceRepository,
    deliveryPartnerRepository = null,
    sellerNotificationRepository = null,
  }) {
    super();
    this.userNotificationRepository = userNotificationRepository;
    this.notificationTemplateRepository = notificationTemplateRepository;
    this.userRepository = userRepository;
    this.userDeviceRepository = userDeviceRepository;
    this.deliveryPartnerRepository = deliveryPartnerRepository;
    this.sellerNotificationRepository = sellerNotificationRepository;
    this.pushProvider = getProvider('push');
    this.smsProvider = getProvider('sms');
    this.emailProvider = new MockEmailProvider();
    this._registerListeners();
  }

  _registerListeners() {
    eventBus.subscribe('order.status_changed', (event) => {
      this.enqueueOrderStatusNotification(event.payload).catch(() => {});
    });

    eventBus.subscribe('delivery.order_available', (event) => {
      this.notifyDeliveryPartners(event.payload).catch(() => {});
    });

    eventBus.subscribe('order.placed', (event) => {
      this.notifySellerNewOrder(event.payload).catch(() => {});
    });

    eventBus.subscribe('delivery.otp_created', (event) => {
      this.notifyCustomerDeliveryOtp(event.payload).catch(() => {});
    });
  }

  async enqueueOrderStatusNotification({ userId, orderId, status, orderNumber }) {
    return queueManager.addJob('notifications', 'order-status', {
      userId,
      orderId,
      status,
      orderNumber,
    });
  }

  async _sendPushToPortal({ userId, portal, title, body, data = {} }) {
    const devices = await this.userDeviceRepository.find({ userId, portal });
    const staleTokens = [];

    for (const device of devices) {
      if (!device.fcmToken) continue;

      const result = await this.pushProvider.sendToDevice({
        token: device.fcmToken,
        title,
        body,
        data,
      });

      if (result?.invalidToken) {
        staleTokens.push(device._id);
      }
    }

    if (staleTokens.length) {
      await Promise.all(
        staleTokens.map((id) => this.userDeviceRepository.updateById(id, { fcmToken: null }))
      );
    }
  }

  async dispatch(payload) {
    const user = await this.userRepository.findById(payload.userId);
    if (!user) return null;

    const locale = user.locale || 'en';
    const template = await this.notificationTemplateRepository.findByKeyAndLocale(
      'order.status_changed',
      locale
    ) || await this.notificationTemplateRepository.findByKeyAndLocale('order.status_changed', 'en');

    const title = template?.subject || 'Order Update';
    const body = (template?.body || 'Your order {{orderNumber}} is now {{status}}')
      .replace('{{orderNumber}}', payload.orderNumber || '')
      .replace('{{status}}', payload.status || '');

    const prefs = user.notificationPreferences || {};

    await this.userNotificationRepository.create({
      userId: user._id,
      title,
      body,
      channel: 'in_app',
      referenceType: 'order',
      referenceId: payload.orderId,
    });

    if (prefs.pushEnabled !== false) {
      await this._sendPushToPortal({
        userId: user._id,
        portal: 'customer',
        title,
        body,
        data: payload,
      });
    }

    if (prefs.smsEnabled !== false && user.phone) {
      await this.smsProvider.send({ phone: user.phone, message: body }).catch((err) => {
        logger.warn({ err }, 'SMS send failed in dispatch');
      });
    }

    if (prefs.emailEnabled !== false && user.email) {
      await this.emailProvider.send({ email: user.email, subject: title, body }).catch((err) => {
        logger.warn({ err }, 'Email send failed in dispatch');
      });
    }

    return { delivered: true };
  }

  async notifyDeliveryPartners({ orderId, orderNumber, partnerIds = null }) {
    if (!this.deliveryPartnerRepository) return null;

    let partners;
    if (Array.isArray(partnerIds) && partnerIds.length > 0) {
      // Only notify nearby partners identified by DeliveryOrderService
      partners = await this.deliveryPartnerRepository.find({
        _id: { $in: partnerIds },
        deletedAt: null,
      });
    } else {
      // Fallback: notify all online approved partners
      partners = await this.deliveryPartnerRepository.list({
        status: 'approved',
        isOnline: true,
      }, { limit: 100 });
    }

    const title = 'New delivery available';
    const body = `Order ${orderNumber || orderId} is ready for pickup`;

    for (const partner of partners) {
      await this._sendPushToPortal({
        userId: partner._id,
        portal: 'delivery',
        title,
        body,
        data: { orderId: String(orderId), orderNumber: orderNumber || '', type: 'delivery_available' },
      });
    }

    return { notified: partners.length };
  }

  async notifyCustomerDeliveryOtp({ userId, orderId, orderNumber, otp, phone = null }) {
    if (!userId || !otp) return null;

    const user = await this.userRepository.findById(userId);
    const targetPhone = phone || user?.phone;
    const title = 'Delivery OTP';
    const body = `Your Mithilakart delivery OTP is ${otp}. Share this with the delivery partner to complete order ${orderNumber || ''}.`.trim();

    await this.userNotificationRepository.create({
      userId,
      title,
      body,
      channel: 'in_app',
      referenceType: 'order',
      referenceId: orderId,
    });

    const prefs = user?.notificationPreferences || {};

    if (prefs.pushEnabled !== false) {
      await this._sendPushToPortal({
        userId,
        portal: 'customer',
        title,
        body,
        data: { orderId: String(orderId), orderNumber: orderNumber || '', type: 'delivery_otp' },
      });
    }

    if (prefs.smsEnabled !== false && targetPhone) {
      await this.smsProvider.send({ phone: targetPhone, message: body }).catch((err) => {
        logger.warn({ err }, 'SMS send failed in notifyCustomerDeliveryOtp');
      });
    }

    return { delivered: true };
  }

  async notifySellerNewOrder({ sellerId, orderId, orderNumber }) {
    if (!this.sellerNotificationRepository || !sellerId) return null;

    const title = 'New order received';
    const body = `You have a new order ${orderNumber || ''}`.trim();

    await this.sellerNotificationRepository.create({
      sellerId,
      title,
      message: body,
      type: 'order',
      metadata: { orderId: String(orderId), orderNumber: orderNumber || '' },
    });

    await this._sendPushToPortal({
      userId: sellerId,
      portal: 'seller',
      title,
      body,
      data: { orderId: String(orderId), type: 'new_order' },
    });

    return { delivered: true };
  }

  async listForUser(userId, query = {}) {
    const page = Number(query.page) || 1;
    const limit = Math.min(Number(query.limit) || 20, 100);
    const skip = (page - 1) * limit;

    const [items, unreadCount] = await Promise.all([
      this.userNotificationRepository.findByUser(userId, { sort: '-createdAt', skip, limit }),
      this.userNotificationRepository.countUnread(userId),
    ]);

    return { items, unreadCount, page, limit };
  }

  async markRead(userId, notificationId) {
    const note = await this.userNotificationRepository.findOne({ _id: notificationId, userId });
    if (!note) return null;
    return this.userNotificationRepository.updateById(notificationId, { isRead: true, readAt: new Date() });
  }

  async markAllRead(userId) {
    await this.userNotificationRepository.markAllRead(userId);
    return { success: true };
  }

  async updatePreferences(userId, preferences) {
    return this.userRepository.updateById(userId, {
      notificationPreferences: preferences,
    });
  }

  async registerDeviceToken(userId, portal, deviceId, fcmToken, platform = 'web') {
    return this.userDeviceRepository.upsertDevice({
      userId,
      portal,
      deviceId,
      fcmToken,
      platform,
    });
  }

  async sendTestPushToUser(userId, portal = 'customer', { title = 'Mithilakart Test Notification', body = 'Your push notifications are working properly!', data = {} } = {}) {
    const devices = await this.userDeviceRepository.find({ userId, portal });
    if (!devices || devices.length === 0) {
      return {
        success: false,
        message: 'No registered devices found for this user and portal',
        devicesFound: 0,
        results: [],
      };
    }

    const results = [];
    const staleTokens = [];

    for (const device of devices) {
      if (!device.fcmToken) {
        results.push({
          deviceId: device.deviceId,
          platform: device.platform,
          success: false,
          error: 'missing_fcm_token',
        });
        continue;
      }

      const res = await this.pushProvider.sendToDevice({
        token: device.fcmToken,
        title,
        body,
        data: {
          ...data,
          portal,
          test: 'true',
          sentAt: new Date().toISOString(),
        },
      });

      results.push({
        deviceId: device.deviceId,
        platform: device.platform,
        ...res,
      });

      if (res?.invalidToken) {
        staleTokens.push(device._id);
      }
    }

    if (staleTokens.length) {
      await Promise.all(
        staleTokens.map((id) => this.userDeviceRepository.updateById(id, { fcmToken: null }))
      );
    }

    const anySuccess = results.some((r) => r.success);
    return {
      success: anySuccess,
      provider: this.pushProvider?.providerName || 'unknown',
      devicesFound: devices.length,
      results,
    };
  }

  async sendDirectPush({
    fcmToken,
    title = 'Mithilakart Push Notification',
    body = 'This is a test notification from Mithilakart backend',
    data = {},
    platform = 'app',
    deviceId = null,
    saveToDb = false,
    portal = 'customer',
    userId = null,
  }) {
    let savedDevice = null;
    if (saveToDb && deviceId) {
      const mongoose = require('mongoose');
      const targetUserId = userId && mongoose.Types.ObjectId.isValid(userId)
        ? new mongoose.Types.ObjectId(userId)
        : new mongoose.Types.ObjectId();

      savedDevice = await this.userDeviceRepository.upsertDevice({
        userId: targetUserId,
        portal: ['customer', 'seller', 'delivery', 'admin'].includes(portal) ? portal : 'customer',
        deviceId,
        fcmToken,
        platform: platform || 'app',
      });
    }

    const pushResult = await this.pushProvider.sendToDevice({
      token: fcmToken,
      title,
      body,
      data: {
        ...data,
        portal,
        platform: platform || 'app',
        source: 'postman_direct_test',
        sentAt: new Date().toISOString(),
      },
    });

    return {
      success: !!pushResult?.success,
      provider: this.pushProvider?.providerName || 'unknown',
      pushResult,
      deviceSaved: !!savedDevice,
      savedDevice,
    };
  }

  async broadcast({ title, body, userIds = null }) {
    const filter = userIds ? { _id: { $in: userIds }, deletedAt: null } : { deletedAt: null, status: 'active' };
    const users = await this.userRepository.find(filter, { limit: 500 });

    for (const user of users) {
      await this.userNotificationRepository.create({
        userId: user._id,
        title,
        body,
        channel: 'in_app',
      });
    }

    return { sent: users.length };
  }

  async listTemplates() {
    return this.notificationTemplateRepository.find({ deletedAt: null });
  }

  async upsertTemplate(data) {
    const existing = await this.notificationTemplateRepository.findOne({
      key: data.key,
      locale: data.locale || 'en',
      deletedAt: null,
    });

    if (existing) {
      return this.notificationTemplateRepository.updateById(existing._id, data);
    }

    return this.notificationTemplateRepository.create(data);
  }
}

module.exports = { NotificationService };
