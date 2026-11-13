/**
 * Public storefront settings the admin controls (support email, helpline,
 * tab theme). Loaded once by <PublicConfigLoader/>; screens read it with
 * usePublicConfig() so admin edits show without a rebuild.
 */
import { useEffect, useSyncExternalStore } from 'react';
import { customerApi } from '../api/client';
import { applyCachedTabThemes, applyTabThemes } from '../theme/tabThemes';

const CACHE_KEY = 'mk_public_config';
const REFRESH_AFTER_MS = 2 * 60 * 1000;

function readCache() {
  try {
    return JSON.parse(localStorage.getItem(CACHE_KEY) || 'null');
  } catch {
    return null;
  }
}

let config = readCache();
let lastFetch = 0;
const listeners = new Set();

// Before the first render: returning visitors see the admin theme immediately.
applyCachedTabThemes();

export async function refreshPublicConfig({ force = false } = {}) {
  if (!force && Date.now() - lastFetch < REFRESH_AFTER_MS) return config;
  lastFetch = Date.now();
  try {
    const data = await customerApi.get('/storefront/config');
    if (!data) return config;
    config = data;
    try { localStorage.setItem(CACHE_KEY, JSON.stringify(data)); } catch { /* ignore */ }
    applyTabThemes(data.tabThemes || null);
    listeners.forEach((fn) => fn());
  } catch {
    // offline / API down: keep the last known settings
  }
  return config;
}

const subscribe = (fn) => { listeners.add(fn); return () => listeners.delete(fn); };
const snapshot = () => config;

export function usePublicConfig() {
  return useSyncExternalStore(subscribe, snapshot, snapshot) || {};
}

/** Support contact with the original values as fallback. */
export function useSupportContact() {
  const cfg = usePublicConfig();
  return {
    email: cfg.supportEmail || 'support@mithilakart.com',
    phone: cfg.helpline || '+91 1800-123-4567',
  };
}

/** Mount once near the app root. */
export function PublicConfigLoader() {
  useEffect(() => {
    refreshPublicConfig({ force: true });
    const onFocus = () => refreshPublicConfig();
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, []);
  return null;
}
