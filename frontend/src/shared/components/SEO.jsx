import { SITE_URL, SITE_NAME, DEFAULT_META_DESCRIPTION, DEFAULT_OG_IMAGE, TWITTER_HANDLE } from '../../config/siteConfig';

/**
 * Per-page SEO metadata. React 19 hoists <title>/<meta>/<link> rendered
 * anywhere in the tree to <head> automatically — no react-helmet needed.
 * Mount once per route with the values that page actually has; omit a
 * prop rather than pass a guessed value.
 *
 * `path` should be the route path only (e.g. "/category/beauty"), not a
 * full URL — canonical/OG URLs are built from SITE_URL + path.
 */
export default function SEO({
  title,
  description = DEFAULT_META_DESCRIPTION,
  path = '',
  image = DEFAULT_OG_IMAGE,
  noindex = false,
  type = 'website',
}) {
  const fullTitle = title ? `${title} | ${SITE_NAME}` : SITE_NAME;
  const url = `${SITE_URL}${path}`;

  return (
    <>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={url} />
      {noindex && <meta name="robots" content="noindex, nofollow" />}

      <meta property="og:type" content={type} />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={url} />
      <meta property="og:image" content={image} />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:site" content={TWITTER_HANDLE} />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />
    </>
  );
}
