const { BaseService } = require('../../core/BaseService');
const { queueManager } = require('../../queues/QueueManager');
const { getProvider } = require('../../core/providers.registry');
const { MockSmsProvider, MockEmailProvider } = require('../../core/providers/MockNotificationProviders');
const { eventBus } = require('../../events/EventBus');

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
    this.smsProvider = new MockSmsProvider();
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
      await this.smsProvider.send({ phone: user.phone, message: body });
    }

    if (prefs.emailEnabled !== false && user.email) {
      await this.emailProvider.send({ email: user.email, subject: title, body });
    }

    return { delivered: true };
  }

  async notifyDeliveryPartners({ orderId, orderNumber }) {
    if (!this.deliveryPartnerRepository) return null;

    const partners = await this.deliveryPartnerRepository.list({
      status: 'approved',
      isOnline: true,
    }, { limit: 100 });

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

  async notifySellerNewOrder({ sellerId, orderId, orderNumber }) {
    if (!this.sellerNotificationRepository || !sellerId) return null;

    const title = 'New order received';
    const body = `You have a new order ${orderNumber || ''}`.trim();

    await this.sellerNotificationRepository.create({
      sellerId,
      title,
      body,
      type: 'order',
      referenceId: orderId,
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
