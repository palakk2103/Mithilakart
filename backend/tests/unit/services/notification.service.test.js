const { NotificationService } = require('../../../src/services/notifications/NotificationService');

describe('NotificationService', () => {
  it('creates in-app notification on dispatch', async () => {
    const user = {
      _id: 'user1',
      locale: 'en',
      notificationPreferences: { pushEnabled: false, smsEnabled: false, emailEnabled: false },
    };

    const userRepository = { findById: jest.fn().mockResolvedValue(user) };
    const notificationTemplateRepository = {
      findByKeyAndLocale: jest.fn().mockResolvedValue({
        subject: 'Order Update',
        body: 'Your order {{orderNumber}} is now {{status}}',
      }),
    };
    const userNotificationRepository = { create: jest.fn().mockResolvedValue({ _id: 'n1' }) };
    const userDeviceRepository = { find: jest.fn().mockResolvedValue([]) };

    const service = new NotificationService({
      userNotificationRepository,
      notificationTemplateRepository,
      userRepository,
      userDeviceRepository,
    });

    await service.dispatch({
      userId: 'user1',
      orderId: 'order1',
      orderNumber: 'MK-1',
      status: 'confirmed',
    });

    expect(userNotificationRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'user1',
        title: 'Order Update',
        channel: 'in_app',
      })
    );
  });

  it('registers device with platform: "app" in userDeviceRepository', async () => {
    const userDeviceRepository = {
      upsertDevice: jest.fn().mockResolvedValue({
        userId: 'user1',
        portal: 'customer',
        deviceId: 'device-app-1',
        fcmToken: 'token-123',
        platform: 'app',
      }),
    };

    const service = new NotificationService({
      userNotificationRepository: {},
      notificationTemplateRepository: {},
      userRepository: {},
      userDeviceRepository,
    });

    const res = await service.registerDeviceToken('user1', 'customer', 'device-app-1', 'token-123', 'app');

    expect(userDeviceRepository.upsertDevice).toHaveBeenCalledWith({
      userId: 'user1',
      portal: 'customer',
      deviceId: 'device-app-1',
      fcmToken: 'token-123',
      platform: 'app',
    });
    expect(res.platform).toBe('app');
  });

  it('sends test push to registered user devices and cleans up invalid tokens', async () => {
    const userDeviceRepository = {
      find: jest.fn().mockResolvedValue([
        { _id: 'd1', deviceId: 'dev-1', platform: 'app', fcmToken: 'token-valid' },
        { _id: 'd2', deviceId: 'dev-2', platform: 'app', fcmToken: 'token-invalid' },
      ]),
      updateById: jest.fn().mockResolvedValue({}),
    };

    const mockPush = {
      providerName: 'mock-fcm',
      sendToDevice: jest.fn()
        .mockResolvedValueOnce({ success: true, messageId: 'msg-1' })
        .mockResolvedValueOnce({ success: false, error: 'invalid', invalidToken: true }),
    };

    const service = new NotificationService({
      userNotificationRepository: {},
      notificationTemplateRepository: {},
      userRepository: {},
      userDeviceRepository,
    });
    service.pushProvider = mockPush;

    const res = await service.sendTestPushToUser('user1', 'customer', {
      title: 'Test',
      body: 'Hello',
    });

    expect(res.devicesFound).toBe(2);
    expect(res.results.length).toBe(2);
    expect(userDeviceRepository.updateById).toHaveBeenCalledWith('d2', { fcmToken: null });
  });
});
