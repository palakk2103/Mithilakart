/**
 * "You" bottom-nav popup configuration (customer + admin API helpers).
 *
 * The backend owns the item registry (ids + routes) and the admin-managed
 * label/enabled/order. DEFAULT_YOU_POPUP_ITEMS below is ONLY a fallback used
 * when the API is unreachable and nothing has been cached yet.
 */
import customerApi, { adminApiClient } from '../shared/api/client';

export const DEFAULT_YOU_POPUP_ITEMS = [
  { id: 'orders', label: 'Orders', order: 1, route: '/profile/orders' },
  { id: 'buy_again', label: 'Buy Again', order: 2, route: '/buy-again' },
  { id: 'account', label: 'Account', order: 3, route: '/profile' },
  { id: 'wishlist', label: 'Wishlist', order: 4, route: '/wishlist' },
];

const CACHE_KEY = 'you_popup_config_v1';
const FRESH_MS = 30 * 1000;
let memory = { items: null, at: 0 };
let inflight = null;

// Only same-origin absolute app paths are ever navigated to.
const isSafeRoute = (r) => typeof r === 'string' && /^\/(?!\/)[\w\-./?=&%]*$/.test(r);

const sanitize = (items) => (Array.isArray(items)
  ? items
    .filter((i) => i && typeof i.id === 'string' && typeof i.label === 'string' && i.label.trim() && isSafeRoute(i.route))
    .map((i) => ({ id: i.id, label: i.label.trim(), order: Number(i.order) || 0, route: i.route }))
    .sort((a, b) => a.order - b.order)
  : null);

const readLocal = () => {
  try {
    return sanitize(JSON.parse(localStorage.getItem(CACHE_KEY)));
  } catch {
    return null;
  }
};

/** Synchronous best-known items (memory → last good response → defaults). */
export const getCachedYouPopupItems = () => memory.items || readLocal() || DEFAULT_YOU_POPUP_ITEMS;

/**
 * Fetches the latest config. Skips the network if the cache is <30s old unless
 * `force`. Concurrent calls share one request. Never throws: on failure it
 * returns the last good config (or defaults) so the popup is never empty-by-error.
 */
export const fetchYouPopupItems = async ({ force = false } = {}) => {
  if (!force && memory.items && Date.now() - memory.at < FRESH_MS) return memory.items;
  if (inflight) return inflight;
  inflight = (async () => {
    try {
      const res = await customerApi.get('/storefront/you-popup');
      const items = sanitize(res?.items);
      if (!items) throw new Error('Invalid you-popup payload');
      memory = { items, at: Date.now() };
      try { localStorage.setItem(CACHE_KEY, JSON.stringify(items)); } catch { /* storage unavailable */ }
      return items;
    } catch (err) {
      console.warn('You popup config unavailable, using cached/default:', err?.message || err);
      return getCachedYouPopupItems();
    } finally {
      inflight = null;
    }
  })();
  return inflight;
};

export const invalidateYouPopupCache = () => { memory = { items: null, at: 0 }; };

// ── Admin ────────────────────────────────────────────────────────────────────
export const getAdminYouPopup = async () => (await adminApiClient.get('/settings/you-popup'))?.items || [];

export const saveAdminYouPopup = async (items) => {
  const res = await adminApiClient.put('/settings/you-popup', {
    items: items.map(({ id, label, enabled, order }) => ({ id, label, enabled, order })),
  });
  invalidateYouPopupCache();
  return res?.items || [];
};
