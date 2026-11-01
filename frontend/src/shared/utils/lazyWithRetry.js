import { lazy } from 'react';

// React.lazy wrapper that retries a failed dynamic import once, then forces a
// single page reload (stale chunk after a deploy). A sessionStorage flag stops
// reload loops; if it still fails the error reaches the nearest ErrorBoundary.
const RELOAD_KEY = 'lazy-chunk-reloaded';

export default function lazyWithRetry(factory) {
  return lazy(async () => {
    try {
      const mod = await factory();
      try { sessionStorage.removeItem(RELOAD_KEY); } catch { /* ignore */ }
      return mod;
    } catch (firstError) {
      try {
        return await factory();
      } catch (error) {
        let alreadyReloaded = true;
        try {
          alreadyReloaded = sessionStorage.getItem(RELOAD_KEY) === '1';
          if (!alreadyReloaded) sessionStorage.setItem(RELOAD_KEY, '1');
        } catch {
          // storage unavailable: don't reload
        }
        if (!alreadyReloaded) {
          window.location.reload();
          return new Promise(() => {});
        }
        throw error || firstError;
      }
    }
  });
}
