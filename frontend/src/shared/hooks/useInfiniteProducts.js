import { useState, useEffect, useRef, useCallback } from 'react';

const DEFAULT_BATCH = 36;
const EMPTY = [];

/**
 * Scroll-driven batch loader (no pagination UI).
 *
 * fetchPage(page, limit) -> Promise<{ items: any[], hasMore?: boolean, total?: number }>
 * Pass `deps` that should reset the list (category, query, tab, sort...).
 * Stale responses are ignored via a request token, duplicates are dropped by key.
 */
export default function useInfiniteProducts(fetchPage, deps = [], { limit = DEFAULT_BATCH, getKey = (p) => p.id } = {}) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true); // first batch
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [hasMore, setHasMore] = useState(false);

  const pageRef = useRef(0);
  const tokenRef = useRef(0);
  const busyRef = useRef(false);
  const hasMoreRef = useRef(false);
  const seenRef = useRef(new Set());
  const fetchRef = useRef(fetchPage);
  const keyRef = useRef(getKey);
  // Keep latest callbacks without re-creating loadNext; runs before the reset effect below.
  useEffect(() => {
    fetchRef.current = fetchPage;
    keyRef.current = getKey;
  });

  const loadNext = useCallback(async () => {
    if (busyRef.current) return;
    if (pageRef.current > 0 && !hasMoreRef.current) return;
    busyRef.current = true;
    const token = tokenRef.current;
    const page = pageRef.current + 1;
    const first = page === 1;
    if (first) setLoading(true); else setLoadingMore(true);
    setError(null);
    try {
      const res = await fetchRef.current(page, limit);
      if (token !== tokenRef.current) return; // superseded by a reset
      const fresh = [];
      for (const it of res.items || []) {
        const k = keyRef.current(it);
        if (k == null || !seenRef.current.has(k)) {
          if (k != null) seenRef.current.add(k);
          fresh.push(it);
        }
      }
      pageRef.current = page;
      const more = typeof res.hasMore === 'boolean' ? res.hasMore : (res.items || []).length >= limit;
      hasMoreRef.current = more;
      setHasMore(more);
      setItems((prev) => (first ? fresh : prev.concat(fresh)));
    } catch (err) {
      if (token !== tokenRef.current) return;
      setError(err?.message || 'Failed to load products');
    } finally {
      if (token === tokenRef.current) {
        busyRef.current = false;
        setLoading(false);
        setLoadingMore(false);
      }
    }
  }, [limit]);

  // Deps the current `items` belong to. While `deps` have changed but the reset
  // effect has not run yet, the previous list must not be shown for the new key.
  const settledDepsRef = useRef(null);
  const isStale = !settledDepsRef.current
    || settledDepsRef.current.length !== deps.length
    || settledDepsRef.current.some((d, i) => !Object.is(d, deps[i]));

  useEffect(() => {
    settledDepsRef.current = deps;
    tokenRef.current += 1;
    busyRef.current = false;
    pageRef.current = 0;
    hasMoreRef.current = false;
    seenRef.current = new Set();
    setItems([]);
    setHasMore(false);
    setLoadingMore(false);
    loadNext();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return {
    items: isStale ? EMPTY : items,
    loading: isStale ? true : loading,
    loadingMore,
    error,
    hasMore,
    loadMore: loadNext,
    retry: loadNext,
  };
}
