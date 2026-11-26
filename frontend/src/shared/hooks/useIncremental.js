import { useEffect, useState } from 'react';

/**
 * Long lists render in steps: the first `step` items, then the next step each
 * time the shopper scrolls near the end (pair with <InfiniteScrollSentinel />).
 * Resets when the list itself changes (filter, tab).
 */
export default function useIncremental(list, step = 20, resetKey = '') {
  const [count, setCount] = useState(step);
  useEffect(() => { setCount(step); }, [resetKey, step]);
  const items = Array.isArray(list) ? list : [];
  return {
    visible: items.slice(0, count),
    hasMore: count < items.length,
    more: () => setCount((c) => Math.min(items.length, c + step)),
  };
}
