import { initializeApp, getApps } from 'firebase/app';
import { getMessaging, getToken, isSupported, onMessage } from 'firebase/messaging';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

export const getFirebaseApp = () => {
  if (!firebaseConfig.apiKey) return null;
  return getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
};

export const isPushSupported = () => isSupported();

export const requestFcmToken = async () => {
  const supported = await isPushSupported();
  if (!supported || !firebaseConfig.apiKey) return null;

  const app = getFirebaseApp();
  if (!app) return null;

  if (typeof window === 'undefined' || !('Notification' in window)) return null;
  if (Notification.permission === 'denied') return null;

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') return null;

  const messaging = getMessaging(app);
  const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY;

  const token = await getToken(messaging, vapidKey ? { vapidKey } : undefined);
  return token || null;
};

export const onForegroundMessage = async (callback) => {
  const supported = await isPushSupported();
  if (!supported) return () => {};

  const app = getFirebaseApp();
  if (!app) return () => {};

  const messaging = getMessaging(app);
  return onMessage(messaging, callback);
};

export const getDeviceId = () => {
  const key = 'mk_device_id';
  let id = localStorage.getItem(key);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(key, id);
  }
  return id;
};
