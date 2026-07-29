/**
 * Centralized Utility for Default Product Image and Image Error Handling
 * Used across Mithilakart application when product image is unavailable or fails to load.
 */

const rawSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300" viewBox="0 0 300 300">
  <rect width="300" height="300" fill="#f8fafc" rx="16"/>
  <rect x="1" y="1" width="298" height="298" fill="none" stroke="#e2e8f0" stroke-width="2" rx="15"/>
  <g transform="translate(115, 75)" fill="none" stroke="#94a3b8" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round">
    <rect x="5" y="25" width="60" height="50" rx="6"/>
    <path d="M20 25 V16 a10 10 0 0 1 20 0 v9"/>
  </g>
  <text x="150" y="180" font-size="18" font-family="system-ui, -apple-system, sans-serif" font-weight="800" fill="#475569" text-anchor="middle">Mithilakart</text>
  <text x="150" y="205" font-size="12" font-family="system-ui, -apple-system, sans-serif" font-weight="600" fill="#94a3b8" text-anchor="middle">No Image Available</text>
</svg>`;

export const DEFAULT_PRODUCT_IMAGE = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(rawSvg)}`;

/**
 * Image error handler to fallback to default product image
 * Prevents infinite loop by unsetting onerror handler.
 */
export const handleImageError = (e) => {
  if (e && e.target) {
    e.target.onerror = null;
    e.target.src = DEFAULT_PRODUCT_IMAGE;
  }
};

/**
 * Get product/category image URL or fallback to default dummy image.
 * Automatically resolves relative `/uploads/...` paths to backend URL.
 */
export const getImageUrl = (src) => {
  if (!src || typeof src !== 'string' || src.trim() === '' || src === 'undefined' || src === 'null') {
    return DEFAULT_PRODUCT_IMAGE;
  }
  const clean = src.trim();
  if (clean.startsWith('/uploads')) {
    const backendOrigin = import.meta.env.VITE_API_BASE_URL
      ? import.meta.env.VITE_API_BASE_URL.replace(/\/api\/v1\/?$/, '')
      : 'http://localhost:5000';
    return `${backendOrigin}${clean}`;
  }
  return clean;
};

export const getProductImage = getImageUrl;

export default DEFAULT_PRODUCT_IMAGE;
