// Generates robots.txt and sitemap.xml from the single SITE_URL source of
// truth in src/config/siteConfig.js. Run automatically after `vite build`
// (see package.json "postbuild") so dist/ always matches the current
// SITE_URL — no risk of the static robots.txt drifting from siteConfig.js.
import { writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { SITE_URL } from '../src/config/siteConfig.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const distDir = join(__dirname, '..', 'dist');

if (!existsSync(distDir)) {
  console.error('[seo] dist/ not found — run `vite build` first.');
  process.exit(1);
}

const DISALLOWED_PATHS = [
  '/admin/',
  '/seller/',
  '/delivery/',
  '/checkout',
  '/cart',
  '/bag',
  '/wishlist',
  '/profile/',
  '/wallet',
  '/order-confirmation',
];

const robotsTxt = [
  'User-agent: *',
  'Allow: /',
  ...DISALLOWED_PATHS.map((p) => `Disallow: ${p}`),
  '',
  `Sitemap: ${SITE_URL}/sitemap.xml`,
  '',
].join('\n');

// Static, stable routes only — product/category detail pages are not yet
// individually addressable by URL (see docs/client-requirements gap matrix,
// "URL identity gap") so they cannot be listed here without linking to a
// URL that doesn't actually resolve to that specific item.
const STATIC_ROUTES = [
  { path: '/home', changefreq: 'daily', priority: '1.0' },
  { path: '/products', changefreq: 'daily', priority: '0.9' },
  { path: '/categories', changefreq: 'weekly', priority: '0.8' },
  { path: '/deals', changefreq: 'daily', priority: '0.8' },
  { path: '/quick-shop', changefreq: 'daily', priority: '0.8' },
  { path: '/fresh-grocery', changefreq: 'daily', priority: '0.8' },
  { path: '/mithilak', changefreq: 'weekly', priority: '0.7' },
  { path: '/toys', changefreq: 'weekly', priority: '0.6' },
  { path: '/beauty', changefreq: 'weekly', priority: '0.6' },
  { path: '/all-offers', changefreq: 'daily', priority: '0.7' },
  { path: '/terms', changefreq: 'yearly', priority: '0.3' },
  { path: '/privacy', changefreq: 'yearly', priority: '0.3' },
  { path: '/cancellation-returns', changefreq: 'yearly', priority: '0.3' },
  { path: '/shipping', changefreq: 'yearly', priority: '0.3' },
];

const today = new Date().toISOString().slice(0, 10);
const urlEntries = STATIC_ROUTES.map(
  ({ path, changefreq, priority }) => `  <url>
    <loc>${SITE_URL}${path}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`
).join('\n');

const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlEntries}
</urlset>
`;

writeFileSync(join(distDir, 'robots.txt'), robotsTxt, 'utf8');
writeFileSync(join(distDir, 'sitemap.xml'), sitemapXml, 'utf8');

console.log(`[seo] robots.txt and sitemap.xml written to dist/ (SITE_URL=${SITE_URL})`);
if (SITE_URL.includes('www.mithilakart.com')) {
  console.warn('[seo] SITE_URL is still the placeholder in src/config/siteConfig.js — confirm before deploying.');
}
