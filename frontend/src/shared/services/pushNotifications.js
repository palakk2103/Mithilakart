import customerApi from '../api/client';
import { getDeviceId, onForegroundMessage, requestFcmToken } from './firebase';

const portalEndpoints = {
  customer: '/notifications/devices',
  delivery: '/delivery/devices',
  seller: '/seller/devices',
};

const testPushEndpoints = {
  customer: '/notifications/test-push',
  delivery: '/delivery/devices/test-push',
  seller: '/seller/notifications/test-push',
};

export const detectPlatform = () => {
  if (typeof window === 'undefined') return 'web';
  if (window.__MITHILAKART_APP_PLATFORM__) return window.__MITHILAKART_APP_PLATFORM__;
  const stored = localStorage.getItem('mk_platform');
  if (stored) return stored;
  if (window.ReactNativeWebView || window.Capacitor || window.isNativeApp) return 'app';
  return 'web';
};

const getClientForPortal = async (portal) => {
  if (portal === 'delivery') {
    return (await import('../api/client')).deliveryApiClient;
  }
  if (portal === 'seller') {
    return (await import('../api/client')).sellerApiClient;
  }
  return customerApi;
};

export const registerPushToken = async (portal = 'customer', platform = null) => {
  const token = await requestFcmToken();
  if (!token) return null;

  const endpoint = portalEndpoints[portal];
  if (!endpoint) return null;

  const deviceId = getDeviceId();
  const effectivePlatform = platform || detectPlatform();
  const client = await getClientForPortal(portal);

  return client.post(endpoint, {
    deviceId,
    fcmToken: token,
    platform: effectivePlatform,
  }, { skipAuthLogout: true });
};

export const initPushNotifications = async (portal = 'customer', onNotify, platform = null) => {
  try {
    await registerPushToken(portal, platform);
    if (typeof onNotify === 'function') {
      await onForegroundMessage(onNotify);
    }
  } catch (error) {
    console.warn('Push notification setup skipped', error);
  }
};

export const sendTestPush = async (portal = 'customer', payload = {}) => {
  const endpoint = testPushEndpoints[portal];
  if (!endpoint) throw new Error(`Unsupported portal: ${portal}`);
  const client = await getClientForPortal(portal);
  return client.post(endpoint, payload);
};

