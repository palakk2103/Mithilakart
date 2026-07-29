const config = require('../config');

function resolveCdnUrl(pathOrUrl) {
  if (!pathOrUrl) return pathOrUrl;
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;

  const base = config.cdn.baseUrl?.replace(/\/$/, '');
  if (!base) return pathOrUrl;

  const normalized = pathOrUrl.startsWith('/') ? pathOrUrl : `/${pathOrUrl}`;
  return `${base}${normalized}`;
}

module.exports = {
  resolveCdnUrl,
};
