import { useEffect, useState } from 'react';
import { getCategoryLanding } from '../../../services/storefrontApi';

// Tiny shared cache so the "before" and "after" slots (and quick chip switches)
// share one request. Short TTL keeps admin edits from lingering for customers.
const CACHE_TTL_MS = 30000;
const cache = new Map(); // key -> { at, promise }

const load = (categoryId, tab) => {
  const key = `${tab}:${categoryId}`;
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < CACHE_TTL_MS) return hit.promise;
  const promise = getCategoryLanding(categoryId, tab).catch((err) => {
    cache.delete(key);
    throw err;
  });
  cache.set(key, { at: Date.now(), promise });
  return promise;
};

export default function useCategoryLanding(categoryId, tab) {
  const [state, setState] = useState({ key: null, landing: null });
  const key = categoryId ? `${tab}:${categoryId}` : null;

  useEffect(() => {
    if (!key) return undefined;
    let cancelled = false;
    load(categoryId, tab)
      .then((data) => { if (!cancelled) setState({ key, landing: data }); })
      .catch(() => { if (!cancelled) setState({ key, landing: null }); });
    return () => { cancelled = true; };
  }, [key, categoryId, tab]);

  // Never show another category's content while a new one is loading.
  return state.key === key ? state.landing : null;
}
