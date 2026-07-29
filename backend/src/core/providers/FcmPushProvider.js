const fs = require('fs');
const path = require('path');
const { initializeApp, getApps, cert } = require('firebase-admin/app');
const { getMessaging } = require('firebase-admin/messaging');
const { PushNotificationProvider } = require('./index');
const { logger } = require('../../utils/logger');

class FcmPushProvider extends PushNotificationProvider {
  constructor({ projectId, serviceAccountPath = null }) {
    super();
    this.providerName = 'fcm';

    if (!getApps().length) {
      const options = { projectId };

      if (serviceAccountPath) {
        const resolved = path.isAbsolute(serviceAccountPath)
          ? serviceAccountPath
          : path.join(process.cwd(), serviceAccountPath);

        if (!fs.existsSync(resolved)) {
          throw new Error(`Firebase service account not found at ${resolved}`);
        }

        options.credential = cert(require(resolved));
      }

      this.app = initializeApp(options);
    } else {
      this.app = getApps()[0];
    }

    this.messaging = getMessaging(this.app);
    this.markConfigured();
  }

  async sendToDevice({ token, title, body, data = {} }) {
    if (!token) {
      return { success: false, error: 'missing_token' };
    }

    const stringData = Object.fromEntries(
      Object.entries(data).map(([key, value]) => [key, value == null ? '' : String(value)])
    );

    try {
      const messageId = await this.messaging.send({
        token,
        notification: { title, body },
        data: stringData,
        webpush: {
          notification: {
            title,
            body,
            sound: 'default',
            requireInteraction: true,
            badge: '/badge-icon.png',
            icon: '/app-icon.png',
            actions: [{ action: 'open', title: 'Open' }],
          },
        },
        android: {
          priority: 'high',
          notification: {
            sound: 'default',
            channelId: 'orders',
            priority: 'high',
          },
        },
        apns: {
          payload: {
            aps: {
              sound: 'default',
              badge: 1,
            },
          },
        },
      });

      return { success: true, messageId };
    } catch (error) {
      logger.warn({ err: error, token: `${token.slice(0, 8)}...` }, 'FCM send failed');
      return {
        success: false,
        error: error.code || error.message,
        invalidToken: error.code === 'messaging/registration-token-not-registered'
          || error.code === 'messaging/invalid-registration-token',
      };
    }
  }

  async send(payload) {
    return this.sendToDevice(payload);
  }
}

module.exports = {
  FcmPushProvider,
};
