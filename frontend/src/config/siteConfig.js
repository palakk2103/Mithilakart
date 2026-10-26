/**
 * Single source of truth for the production domain and site-wide SEO
 * defaults. robots.txt, sitemap.xml, canonical tags, and Open Graph
 * metadata all read from SITE_URL — swap this one value before go-live.
 *
 * TODO(seo): SITE_URL is a placeholder. Replace with the real production
 * domain before deploying — search engines will otherwise index/canonicalise
 * against a domain that isn't live.
 */
export const SITE_URL = 'https://www.mithilakart.com';

export const SITE_NAME = 'Mithilakart';

export const DEFAULT_META_DESCRIPTION =
  'Shop Mithilakart for quick commerce and everyday essentials — groceries, fashion, electronics, beauty, and authentic Mithila crafts, delivered fast.';

export const DEFAULT_OG_IMAGE = `${SITE_URL}/hero_banner.png`;

export const TWITTER_HANDLE = '@mithilakart';
