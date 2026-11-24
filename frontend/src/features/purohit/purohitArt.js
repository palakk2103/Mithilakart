/**
 * Generated placeholder artwork for the Purohit module (inline SVG data URIs).
 * Used for the starter sample data and as a fallback when an admin hasn't set an image,
 * so nothing depends on external image hosts. Admin-uploaded images replace these.
 */

const PALETTES = [
  ['#207C8A', '#0F4C55', '#F4B860'],
  ['#C2410C', '#7C2D12', '#FCD34D'],
  ['#9D174D', '#500724', '#FBCFE8'],
  ['#B45309', '#78350F', '#FDE68A'],
  ['#4D7C0F', '#1A2E05', '#D9F99D'],
  ['#6D28D9', '#2E1065', '#DDD6FE'],
  ['#0E7490', '#164E63', '#A5F3FC'],
  ['#BE123C', '#4C0519', '#FECDD3'],
];

// FNV-1a: spreads similar names (e.g. "… Puja") across palettes better than *31.
const hash = (str = '') => {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i += 1) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
};

const esc = (s = '') => String(s).replace(/[<>&"']/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&#39;' }[c]));

const toDataUri = (svg) => `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;

// Kalash + diya motif in a Mithila-style frame.
export const ritualArt = (name = 'Puja', paletteIndex) => {
  const idx = Number.isInteger(paletteIndex) ? paletteIndex : hash(name);
  const [a, b, c] = PALETTES[Math.abs(idx) % PALETTES.length];
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 500">
<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient>
<radialGradient id="glow" cx="0.5" cy="0.42" r="0.5"><stop offset="0" stop-color="${c}" stop-opacity="0.55"/><stop offset="1" stop-color="${c}" stop-opacity="0"/></radialGradient></defs>
<rect width="400" height="500" fill="url(#g)"/>
<rect width="400" height="500" fill="url(#glow)"/>
<rect x="14" y="14" width="372" height="472" rx="22" fill="none" stroke="${c}" stroke-opacity="0.6" stroke-width="3" stroke-dasharray="10 8"/>
<g fill="${c}" fill-opacity="0.85">
<circle cx="40" cy="40" r="9"/><circle cx="360" cy="40" r="9"/><circle cx="40" cy="460" r="9"/><circle cx="360" cy="460" r="9"/>
</g>
<g transform="translate(200 225) scale(1.1)">
<path d="M-26 -118 C-12 -150 12 -150 26 -118 C14 -124 -14 -124 -26 -118Z" fill="#4ADE80"/>
<path d="M-40 -112 C-30 -140 -12 -138 -6 -116Z M40 -112 C30 -140 12 -138 6 -116Z" fill="#22C55E"/>
<circle cx="0" cy="-124" r="17" fill="#F59E0B"/>
<rect x="-34" y="-108" width="68" height="18" rx="6" fill="${c}"/>
<path d="M-30 -90 C-92 -70 -92 40 -40 62 L40 62 C92 40 92 -70 30 -90Z" fill="${c}"/>
<path d="M-62 -20 L62 -20" stroke="${b}" stroke-width="6"/>
<path d="M-58 12 L58 12" stroke="${b}" stroke-width="3" stroke-dasharray="6 6"/>
<circle cx="0" cy="-2" r="11" fill="${a}"/>
<path d="M-70 92 C-70 72 70 72 70 92 C40 110 -40 110 -70 92Z" fill="#FBBF24"/>
<path d="M0 54 C10 66 10 76 0 82 C-10 76 -10 66 0 54Z" fill="#FDE047"/>
</g>
</svg>`;
  return toDataUri(svg);
};

// Simple portrait avatar with initials.
export const panditArt = (name = 'Pandit') => {
  const [a, b, c] = PALETTES[(hash(name) + 3) % PALETTES.length];
  const initials = String(name)
    .replace(/^(acharya|pandit|pt\.?|shri|sri|vedic)\s+/i, '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('') || 'P';
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400">
<defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${c}"/><stop offset="1" stop-color="#FFF7ED"/></linearGradient></defs>
<rect width="400" height="400" fill="url(#g)"/>
<circle cx="200" cy="160" r="72" fill="${a}"/>
<path d="M70 400 C70 290 130 250 200 250 C270 250 330 290 330 400Z" fill="${b}"/>
<path d="M150 262 L200 330 L250 262" fill="none" stroke="#F59E0B" stroke-width="10"/>
<rect x="188" y="110" width="24" height="6" rx="3" fill="#F59E0B"/>
<circle cx="200" cy="124" r="5" fill="#DC2626"/>
<text x="200" y="182" text-anchor="middle" font-family="Georgia, serif" font-size="46" font-weight="700" fill="#FFFFFF">${esc(initials)}</text>
</svg>`;
  return toDataUri(svg);
};
