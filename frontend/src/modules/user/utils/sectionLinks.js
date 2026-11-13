import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import useVendorStore from '../../../store/useVendorStore';

export const DEFAULT_VIEW_ALL_LINK = '/all-offers';

// URL slug -> homeSections store key(s) + page title. First non-empty list wins, which mirrors
// what the home page itself shows when a section has no products of its own.
export const SECTION_PAGES = {
  'trending-this-week': { title: 'Trending This Week', storeKeys: ['trendingThisWeek', 'stillLooking', 'topSelection'] },
  'top-selection': { title: 'Top Selection', storeKeys: ['topSelection'] },
  'best-quality-guaranteed': { title: 'Best Quality Guaranteed', storeKeys: ['bestQualityGuaranteed', 'bestQuality', 'topSelection'] },
};

// Store key (used by the section components) -> slug of its default "View All" page.
const DEFAULT_SECTION_SLUG = {
  trendingThisWeek: 'trending-this-week',
  topSelection: 'top-selection',
  bestQualityGuaranteed: 'best-quality-guaranteed',
};

// Admin-supplied links are either an internal path ("/category-products?category=Beauty")
// or an absolute http(s) URL. Anything else (javascript:, protocol-relative, ...) is ignored.
export const isSafeViewAllLink = (link) =>
  typeof link === 'string' && (/^\/(?!\/)\S*$/.test(link) || /^https?:\/\/\S+$/i.test(link));

/**
 * Returns a click handler for a home section's arrow / "View All" button.
 * `sectionStoreKey` is the key used in useVendorStore.homeSections (e.g. 'bestQualityGuaranteed').
 * Destination: link set in Admin > Home Sections, else that section's own products page,
 * else `fallback`.
 */
export const useSectionViewAll = (sectionStoreKey, fallback) => {
  const navigate = useNavigate();
  const link = useVendorStore((s) => s.homeSections?.sectionLinks?.[sectionStoreKey]);
  const slug = DEFAULT_SECTION_SLUG[sectionStoreKey];
  const defaultPath = fallback || (slug ? `/section/${slug}` : DEFAULT_VIEW_ALL_LINK);

  return useCallback(() => {
    if (!isSafeViewAllLink(link)) {
      navigate(defaultPath);
      return;
    }
    if (/^https?:\/\//i.test(link)) {
      window.location.assign(link);
      return;
    }
    navigate(link);
  }, [link, navigate, defaultPath]);
};
