/**
 * Short-lived cache for PUBLIC, shopper-independent GETs (storefront home, category tree,
 * header tabs, config, packages, deals). Switching tabs used to re-download and re-parse the
 * same data (twice in dev, because of StrictMode). Now:
 *  - an identical request made within TTL reuses the first one's result;
 *  - two identical requests made at the same time share ONE network call;
 *  - every caller gets its own copy, so one screen mutating/sorting a list cannot corrupt another.
 * Nothing user-specific (cart, orders, profile) is ever cached.
 */
const TTL_MS = 45 * 1000;
const MAX_ENTRIES = 40;

// Exact list endpoints only — never /categories/:id/products or anything with a shopper id.
const CACHEABLE = [
  /^\/storefront\/(home|config|header-tabs|you-popup|help-center|banners)$/,
  /^\/storefront\/[a-z_-]+\/home$/,
  /^\/categories$/,
  /^\/packages$/,
  /^\/deals$/,
  /^\/offers$/,
];

const store = new Map(); // key -> { at, promise }

const clone = (v) => {
  if (v === null || typeof v !== 'object') return v;
  try { return structuredClone(v); } catch { return v; }
};

const keyOf = (url, config) => {
  let lang = 'en';
  try { lang = localStorage.getItem('user_language') || 'en'; } catch { /* ignore */ }
  return `${lang}|${url}|${JSON.stringify(config?.params || {})}`;
};

export function withPublicCache(client) {
  const rawGet = client.get.bind(client);
  client.get = (url, config) => {
    const path = String(url).split('?')[0];
    if (!CACHEABLE.some((re) => re.test(path))) return rawGet(url, config);

    const key = keyOf(url, config);
    const hit = store.get(key);
    if (hit && Date.now() - hit.at < TTL_MS) return hit.promise.then(clone);

    const promise = rawGet(url, config);
    store.set(key, { at: Date.now(), promise });
    if (store.size > MAX_ENTRIES) store.delete(store.keys().next().value);
    promise.catch(() => { if (store.get(key)?.promise === promise) store.delete(key); }); // never cache a failure
    return promise.then(clone);
  };
  return client;
}

/** For screens that must see fresh data right away (e.g. after an admin edit in the same browser). */
export const clearPublicCache = () => store.clear();
