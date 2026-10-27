import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * ScrollToTop
 * Automatically resets the scroll position of the window/document to top (0, 0)
 * whenever the route pathname, search parameters, or hash changes.
 */
const ScrollToTop = () => {
  const { pathname, search, hash } = useLocation();

  useEffect(() => {
    // If a specific hash anchor exists (e.g., #reviews), scroll to it
    if (hash) {
      const id = hash.replace('#', '');
      const element = document.getElementById(id);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
        return;
      }
    }

    // Disable automatic browser scroll restoration to prevent landing at previous scroll offset
    if (typeof window !== 'undefined' && 'scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }

    const resetWindowScroll = () => {
      window.scrollTo(0, 0);
      if (document.documentElement) {
        document.documentElement.scrollTop = 0;
      }
      if (document.body) {
        document.body.scrollTop = 0;
      }
    };

    // 1. Immediate reset
    resetWindowScroll();

    // 2. Immediate microtask / animation frame
    const rafId = requestAnimationFrame(() => {
      resetWindowScroll();
    });

    // 3. Small timeout for components with dynamic or asynchronous content loading
    const timer = setTimeout(() => {
      resetWindowScroll();
    }, 60);

    return () => {
      cancelAnimationFrame(rafId);
      clearTimeout(timer);
    };
  }, [pathname, search, hash]);

  return null;
};

export default ScrollToTop;
