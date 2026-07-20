import customerApi from '../api/client';
import { getDeviceId, onForegroundMessage, requestFcmToken } from './firebase';

const portalEndpoints = {
  customer: '/notifications/devices',
  delivery: '/delivery/devices',
};

export const registerPushToken = async (portal = 'customer') => {
  const token = await requestFcmToken();
  if (!token) return null;

  const endpoint = portalEndpoints[portal];
  if (!endpoint) return null;

  const deviceId = getDeviceId();
  const client = portal === 'delivery'
    ? (await import('../api/client')).deliveryApiClient
    : customerApi;

  return client.post(endpoint, {
    deviceId,
    fcmToken: token,
    platform: 'web',
  });
};

export const initPushNotifications = async (portal = 'customer', onNotify) => {
  try {
    await registerPushToken(portal);
    if (typeof onNotify === 'function') {
      await onForegroundMessage(onNotify);
    }
  } catch (error) {
    console.warn('Push notification setup skipped', error);
  }
};
