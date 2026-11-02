import React, { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';

// Invisible trigger placed after a product list. Calls onVisible when it comes
// within `rootMargin` of the viewport; re-arms after each batch (via `disabled`
// toggling / `watch`) so a short list that still fits the screen keeps loading.
const InfiniteScrollSentinel = ({ onVisible, disabled = false, loadingMore = false, error = null, onRetry, watch, rootMargin = '600px' }) => {
  const { t } = useTranslation();
  const ref = useRef(null);
  const cbRef = useRef(onVisible);
  useEffect(() => { cbRef.current = onVisible; });

  useEffect(() => {
    if (disabled || !ref.current) return undefined;
    const observer = new IntersectionObserver(
      (entries) => { if (entries[0].isIntersecting) cbRef.current?.(); },
      { rootMargin }
    );
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [disabled, rootMargin, watch]);

  return (
    <div ref={ref} className="w-full flex justify-center py-4" aria-live="polite">
      {loadingMore && (
        <div className="w-6 h-6 rounded-full border-2 border-gray-300 border-t-gray-600 animate-spin" role="status" aria-label={t('auto.loadingMoreProducts2')} />
      )}
      {error && !loadingMore && (
        <button type="button" onClick={onRetry} className="text-xs font-semibold text-gray-600 underline">
          {t('auto.couldnTLoadMoreTap')}
        </button>
      )}
    </div>
  );
};

export default React.memo(InfiniteScrollSentinel);
