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
});
