// Generates the illustrated (Mithila / Madhubani folk style) SVG images used by the
// Purohit & Ritual Services starter data:
//   public/purohit/rituals/<ritual-id>.svg   (400×500, 4:5 — ritual cards)
//   public/purohit/pandits/<pandit-id>.svg   (400×400 — pandit cards)
// Run:  node scripts/generate-purohit-art.mjs
// Admins can replace any of these from Admin → Purohit & Ritual Services.
import { writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'purohit');

const INK = '#2B1A12';
const C = {
  red: '#C0392B', deepRed: '#8E1B1B', ochre: '#E1A12B', gold: '#F4C542', cream: '#FBEBC8',
  green: '#2E7D4F', leaf: '#4CAF50', indigo: '#1F3A5F', pink: '#E86A7E', brown: '#7B4A2A',
  skin: '#C98B5B', water: '#2F6E9E', white: '#FFF8EC', saffron: '#F08A24',
};

/* ------------------------------ shared pieces ------------------------------ */

const svg = (w, h, body, defs = '') => `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">
<defs>
<radialGradient id="flame" cx="0.5" cy="0.7" r="0.6"><stop offset="0" stop-color="#FFF6B0"/><stop offset="0.45" stop-color="#FFC533"/><stop offset="1" stop-color="#F26B1D"/></radialGradient>
<linearGradient id="brass" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#F7D774"/><stop offset="0.5" stop-color="#D9A430"/><stop offset="1" stop-color="#A8701A"/></linearGradient>
<linearGradient id="silver" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#F4F4F4"/><stop offset="0.5" stop-color="#C9CED3"/><stop offset="1" stop-color="#8E959C"/></linearGradient>
${defs}
</defs>
${body}
</svg>
`;

// Madhubani double border with a band of triangles ("kachni" style).
const frame = (w, h, band, ink = INK) => {
  const o = 10; const i = 30; const step = 20;
  let tri = '';
  for (let x = o + 4; x + step <= w - o - 4; x += step) {
    tri += `<path d="M${x} ${o + 3} L${x + step / 2} ${i - 3} L${x + step} ${o + 3}Z"/>`;
    tri += `<path d="M${x} ${h - o - 3} L${x + step / 2} ${h - i + 3} L${x + step} ${h - o - 3}Z"/>`;
  }
  for (let y = i; y + step <= h - i; y += step) {
    tri += `<path d="M${o + 3} ${y} L${i - 3} ${y + step / 2} L${o + 3} ${y + step}Z"/>`;
    tri += `<path d="M${w - o - 3} ${y} L${w - i + 3} ${y + step / 2} L${w - o - 3} ${y + step}Z"/>`;
  }
  const corner = (x, y) => `<g transform="translate(${x} ${y})"><circle r="11" fill="${C.red}" stroke="${ink}" stroke-width="2"/><circle r="5" fill="${C.gold}" stroke="${ink}" stroke-width="1.5"/></g>`;
  return `<g>
<rect x="${o}" y="${o}" width="${w - 2 * o}" height="${h - 2 * o}" fill="none" stroke="${ink}" stroke-width="4"/>
<rect x="${i}" y="${i}" width="${w - 2 * i}" height="${h - 2 * i}" fill="none" stroke="${ink}" stroke-width="2.5"/>
<g fill="${band}" stroke="${ink}" stroke-width="1.2">${tri}</g>
${corner(o + 10, o + 10)}${corner(w - o - 10, o + 10)}${corner(o + 10, h - o - 10)}${corner(w - o - 10, h - o - 10)}
</g>`;
};

const leaf = (x, y, rot, len = 60, fill = C.green) => `<path transform="translate(${x} ${y}) rotate(${rot})" d="M0 0 C ${len * 0.18} ${-len * 0.33}, ${len * 0.18} ${-len * 0.66}, 0 ${-len} C ${-len * 0.18} ${-len * 0.66}, ${-len * 0.18} ${-len * 0.33}, 0 0Z" fill="${fill}" stroke="${INK}" stroke-width="2"/><path transform="translate(${x} ${y}) rotate(${rot})" d="M0 -4 L0 ${-len + 6}" stroke="${INK}" stroke-width="1"/>`;

const swastika = (x, y, s = 10, color = C.red) => `<path transform="translate(${x} ${y})" d="M0 ${-s} V${s} M${-s} 0 H${s} M0 ${-s} H${s * 0.8} M${s} 0 V${s * 0.8} M0 ${s} H${-s * 0.8} M${-s} 0 V${-s * 0.8}" stroke="${color}" stroke-width="${Math.max(2, s / 4)}" stroke-linecap="round" fill="none"/>`;

const flame = (x, y, s = 1) => `<path transform="translate(${x} ${y}) scale(${s})" d="M0 0 C 10 -8, 12 -22, 0 -38 C -12 -22, -10 -8, 0 0Z" fill="url(#flame)" stroke="${INK}" stroke-width="1.5"/>`;

const diya = (x, y, s = 1) => `<g transform="translate(${x} ${y}) scale(${s})">
${flame(0, -6, 0.8)}
<path d="M-24 -6 Q 0 22 24 -6 Q 30 -10 34 -12 Q 20 -2 18 -2 Z" fill="${C.ochre}" stroke="${INK}" stroke-width="2"/>
<path d="M-24 -6 H24" stroke="${INK}" stroke-width="2"/>
<path d="M-16 2 Q0 10 16 2" stroke="${C.deepRed}" stroke-width="2" fill="none"/>
</g>`;

const marigold = (x, y, r = 9) => {
  let petals = '';
  for (let a = 0; a < 360; a += 30) petals += `<ellipse cx="0" cy="${-r * 0.7}" rx="${r * 0.38}" ry="${r * 0.55}" transform="rotate(${a})" fill="${C.saffron}" stroke="${INK}" stroke-width="0.8"/>`;
  return `<g transform="translate(${x} ${y})">${petals}<circle r="${r * 0.4}" fill="${C.gold}" stroke="${INK}" stroke-width="0.8"/></g>`;
};

const kalash = (x, y, s = 1) => `<g transform="translate(${x} ${y}) scale(${s})">
${leaf(-10, -78, -55, 58)}${leaf(10, -78, 55, 58)}${leaf(-6, -82, -25, 62, C.leaf)}${leaf(6, -82, 25, 62, C.leaf)}${leaf(0, -84, 0, 60)}
<ellipse cx="0" cy="-104" rx="22" ry="26" fill="${C.brown}" stroke="${INK}" stroke-width="2.5"/>
<path d="M-14 -122 Q0 -136 14 -122" stroke="#5A3418" stroke-width="3" fill="none"/>
<path d="M-6 -126 L-2 -140 M4 -126 L6 -139" stroke="#5A3418" stroke-width="2"/>
<rect x="-30" y="-84" width="60" height="14" rx="5" fill="url(#brass)" stroke="${INK}" stroke-width="2.5"/>
<path d="M-24 -70 C -80 -50, -82 40, -36 62 L36 62 C 82 40, 80 -50, 24 -70Z" fill="url(#brass)" stroke="${INK}" stroke-width="3"/>
<path d="M-62 -24 Q 0 -10 62 -24" stroke="${C.red}" stroke-width="6" fill="none"/>
<path d="M-62 -24 Q 0 -10 62 -24" stroke="${C.gold}" stroke-width="1.5" fill="none" stroke-dasharray="4 4"/>
${swastika(0, 18, 13)}
<circle cx="-30" cy="18" r="3" fill="${C.red}"/><circle cx="30" cy="18" r="3" fill="${C.red}"/>
<ellipse cx="0" cy="66" rx="44" ry="8" fill="${C.ochre}" stroke="${INK}" stroke-width="2"/>
</g>`;

const bananaPlant = (x, y, flip = 1, h = 220) => `<g transform="translate(${x} ${y}) scale(${flip} 1)">
<path d="M-8 0 L-6 ${-h * 0.62} L6 ${-h * 0.62} L8 0Z" fill="#7FA650" stroke="${INK}" stroke-width="2"/>
<path d="M-4 -10 L-3 ${-h * 0.6} M2 -10 L2 ${-h * 0.6}" stroke="#5E8A3A" stroke-width="1.5"/>
<path d="M0 ${-h * 0.6} C 40 ${-h * 0.7}, 70 ${-h * 0.62}, 84 ${-h * 0.5} C 60 ${-h * 0.54}, 30 ${-h * 0.56}, 0 ${-h * 0.58}Z" fill="${C.leaf}" stroke="${INK}" stroke-width="2"/>
<path d="M0 ${-h * 0.62} C -30 ${-h * 0.78}, -50 ${-h * 0.8}, -66 ${-h * 0.7} C -44 ${-h * 0.7}, -22 ${-h * 0.66}, 0 ${-h * 0.6}Z" fill="${C.green}" stroke="${INK}" stroke-width="2"/>
<path d="M0 ${-h * 0.62} C 10 ${-h * 0.85}, 30 ${-h * 0.98}, 50 ${-h} C 36 ${-h * 0.9}, 18 ${-h * 0.75}, 2 ${-h * 0.6}Z" fill="${C.leaf}" stroke="${INK}" stroke-width="2"/>
<path d="M0 ${-h * 0.62} C -6 ${-h * 0.82}, -20 ${-h * 0.95}, -34 ${-h * 0.98} C -22 ${-h * 0.86}, -10 ${-h * 0.74}, -2 ${-h * 0.6}Z" fill="${C.green}" stroke="${INK}" stroke-width="2"/>
</g>`;

const havanKund = (x, y, s = 1) => `<g transform="translate(${x} ${y}) scale(${s})">
${flame(-22, -32, 1.3)}${flame(22, -32, 1.3)}${flame(0, -34, 2)}
<path d="M-28 -34 L-14 -48 M28 -34 L14 -48 M-6 -36 L4 -52" stroke="${C.brown}" stroke-width="5" stroke-linecap="round"/>
<rect x="-56" y="-34" width="112" height="22" fill="${C.red}" stroke="${INK}" stroke-width="2.5"/>
<rect x="-70" y="-12" width="140" height="22" fill="${C.ochre}" stroke="${INK}" stroke-width="2.5"/>
<rect x="-84" y="10" width="168" height="22" fill="${C.red}" stroke="${INK}" stroke-width="2.5"/>
<g fill="${C.gold}" stroke="${INK}" stroke-width="1">${[-40, -20, 0, 20, 40].map((d) => `<path d="M${d - 6} -23 L${d} -30 L${d + 6} -23 L${d} -16Z"/>`).join('')}</g>
<g fill="${C.white}">${[-60, -36, -12, 12, 36, 60].map((d) => `<circle cx="${d}" cy="21" r="3.5"/>`).join('')}</g>
</g>`;

const fish = (x, y, s = 1, flip = 1, body = C.red) => `<g transform="translate(${x} ${y}) scale(${s * flip} ${s})">
<path d="M-40 0 C -20 -22, 20 -22, 34 0 C 20 22, -20 22, -40 0Z" fill="${body}" stroke="${INK}" stroke-width="2.5"/>
<path d="M34 0 L56 -16 L50 0 L56 16Z" fill="${C.ochre}" stroke="${INK}" stroke-width="2.5"/>
<circle cx="-24" cy="-4" r="5" fill="${C.white}" stroke="${INK}" stroke-width="2"/><circle cx="-24" cy="-4" r="2" fill="${INK}"/>
<path d="M-10 -12 Q -4 0 -10 12 M2 -13 Q 8 0 2 13 M14 -11 Q 20 0 14 11" stroke="${INK}" stroke-width="1.5" fill="none"/>
<path d="M-12 -16 L-2 -26 L8 -16" fill="${C.gold}" stroke="${INK}" stroke-width="1.5"/>
</g>`;

const dots = (pts, color = C.white, r = 2.5) => pts.map(([x, y]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${color}"/>`).join('');

/* --------------------------------- rituals --------------------------------- */

const W = 400; const H = 500;
const bgRect = (fill) => `<rect width="${W}" height="${H}" fill="${fill}"/>`;
const sunburst = (cx, cy, r, fill, stroke = INK) => {
  let rays = '';
  for (let a = 0; a < 360; a += 20) rays += `<path transform="translate(${cx} ${cy}) rotate(${a})" d="M-6 ${-r - 2} L0 ${-r - 18} L6 ${-r - 2}Z" fill="${fill}" stroke="${stroke}" stroke-width="1.5"/>`;
  return `${rays}<circle cx="${cx}" cy="${cy}" r="${r}" fill="${fill}" stroke="${stroke}" stroke-width="2.5"/><circle cx="${cx}" cy="${cy}" r="${r * 0.6}" fill="none" stroke="${stroke}" stroke-width="1.5" stroke-dasharray="4 4"/>`;
};

const rituals = {
  'satyanarayan-puja': () => svg(W, H, `
${bgRect('#F7E3B5')}
<circle cx="200" cy="200" r="150" fill="#F3CF85" opacity="0.7"/>
${sunburst(200, 92, 34, C.gold)}
${bananaPlant(104, 372, 1, 240)}${bananaPlant(296, 372, -1, 240)}
<rect x="70" y="352" width="260" height="22" fill="${C.red}" stroke="${INK}" stroke-width="2.5"/>
<path d="M70 374 L80 420 M330 374 L320 420 M130 374 L134 410 M270 374 L266 410" stroke="${INK}" stroke-width="5"/>
<path d="M70 352 L330 352" stroke="${C.gold}" stroke-width="3" stroke-dasharray="8 5"/>
${kalash(200, 286, 1.05)}
${diya(110, 350, 0.9)}${diya(290, 350, 0.9)}
${marigold(150, 344, 8)}${marigold(250, 344, 8)}${marigold(170, 350, 6)}${marigold(230, 350, 6)}
${frame(W, H, C.ochre)}`),

  'vivah-puja': () => svg(W, H, `
${bgRect('#F9D9C8')}
<path d="M40 150 L200 70 L360 150Z" fill="${C.red}" stroke="${INK}" stroke-width="3"/>
<path d="M70 150 L200 92 L330 150" fill="none" stroke="${C.gold}" stroke-width="3" stroke-dasharray="6 5"/>
${fish(168, 122, 0.55, 1)}${fish(232, 122, 0.55, -1, C.indigo)}
<path d="M40 150 H360" stroke="${INK}" stroke-width="3"/>
${Array.from({ length: 13 }, (_, k) => { const x = 46 + k * 26; return `<path d="M${x} 150 q13 22 26 0" fill="${k % 2 ? C.gold : C.pink}" stroke="${INK}" stroke-width="1.5"/>${marigold(x + 13, 176, 5)}`; }).join('')}
<rect x="54" y="150" width="16" height="250" fill="#7FA650" stroke="${INK}" stroke-width="2.5"/>
<rect x="330" y="150" width="16" height="250" fill="#7FA650" stroke="${INK}" stroke-width="2.5"/>
${leaf(62, 220, -50, 50)}${leaf(62, 280, 50, 50, C.leaf)}${leaf(338, 220, 50, 50)}${leaf(338, 280, -50, 50, C.leaf)}
<path d="M110 196 C 104 250, 150 262, 150 214" fill="none" stroke="${C.saffron}" stroke-width="9" stroke-linecap="round" stroke-dasharray="1 10"/>
<path d="M290 196 C 296 250, 250 262, 250 214" fill="none" stroke="${C.pink}" stroke-width="9" stroke-linecap="round" stroke-dasharray="1 10"/>
${havanKund(200, 360, 1)}
${dots([[120, 330], [280, 330], [100, 380], [300, 380], [150, 300], [250, 300]], C.red, 4)}
${frame(W, H, C.pink)}`),

  'griha-pravesh': () => svg(W, H, `
${bgRect('#DCEFE2')}
${sunburst(318, 80, 22, C.gold)}
<path d="M80 190 L200 100 L320 190Z" fill="${C.red}" stroke="${INK}" stroke-width="3"/>
<path d="M104 182 L200 112 L296 182" fill="none" stroke="${C.gold}" stroke-width="2.5" stroke-dasharray="6 5"/>
<rect x="96" y="190" width="208" height="170" fill="${C.cream}" stroke="${INK}" stroke-width="3"/>
<path d="M96 210 H304" stroke="${C.ochre}" stroke-width="6"/>
${Array.from({ length: 9 }, (_, k) => `<circle cx="${112 + k * 22}" cy="${200}" r="4" fill="${C.red}"/>`).join('')}
<path d="M164 360 V270 Q 200 236 236 270 V360Z" fill="${C.indigo}" stroke="${INK}" stroke-width="3"/>
<path d="M200 250 V360" stroke="${INK}" stroke-width="2"/>
<circle cx="190" cy="314" r="3" fill="${C.gold}"/><circle cx="210" cy="314" r="3" fill="${C.gold}"/>
${Array.from({ length: 7 }, (_, k) => leaf(168 + k * 11, 240 - (k === 3 ? 6 : Math.abs(3 - k) * -2), 180, 26, k % 2 ? C.leaf : C.green)).join('')}
<path d="M160 240 Q200 226 240 240" stroke="${INK}" stroke-width="2" fill="none"/>
${swastika(200, 222, 9)}
<rect x="116" y="244" width="34" height="34" fill="${C.ochre}" stroke="${INK}" stroke-width="2.5"/><path d="M133 244 V278 M116 261 H150" stroke="${INK}" stroke-width="2"/>
<rect x="250" y="244" width="34" height="34" fill="${C.ochre}" stroke="${INK}" stroke-width="2.5"/><path d="M267 244 V278 M250 261 H284" stroke="${INK}" stroke-width="2"/>
${kalash(128, 386, 0.42)}${kalash(272, 386, 0.42)}
<ellipse cx="200" cy="410" rx="62" ry="20" fill="none" stroke="${C.red}" stroke-width="3"/>
<ellipse cx="200" cy="410" rx="40" ry="12" fill="none" stroke="${C.ochre}" stroke-width="3" stroke-dasharray="5 4"/>
${[[186, 400], [214, 380]].map(([x, y]) => `<g transform="translate(${x} ${y})"><ellipse rx="6" ry="10" fill="${C.red}"/>${dots([[-5, -12], [-1, -14], [3, -13], [6, -10]], C.red, 1.8)}</g>`).join('')}
${frame(W, H, C.green)}`),

  'sanskar-puja': () => svg(W, H, `
${bgRect('#FBE7C6')}
${sunburst(200, 96, 40, C.saffron)}
<ellipse cx="200" cy="216" rx="70" ry="56" fill="none" stroke="${C.gold}" stroke-width="5"/>
<ellipse cx="200" cy="216" rx="64" ry="50" fill="none" stroke="${C.white}" stroke-width="3"/>
<ellipse cx="200" cy="216" rx="58" ry="44" fill="none" stroke="${C.ochre}" stroke-width="3"/>
<circle cx="200" cy="272" r="9" fill="${C.gold}" stroke="${INK}" stroke-width="2"/>
<path d="M120 300 L96 196 M280 300 L304 196" stroke="${C.brown}" stroke-width="7" stroke-linecap="round"/>
${leaf(96, 196, -20, 40)}${leaf(304, 196, 20, 40)}
${havanKund(200, 380, 1.1)}
${marigold(96, 392, 10)}${marigold(304, 392, 10)}${marigold(76, 360, 7)}${marigold(324, 360, 7)}
${dots([[140, 320], [262, 320], [120, 344], [282, 344], [160, 300], [240, 300]], C.red, 3.5)}
${frame(W, H, C.saffron)}`),

  mundan: () => svg(W, H, `
${bgRect('#E3F1F4')}
<circle cx="200" cy="200" r="132" fill="#CFE6EC"/>
<circle cx="200" cy="200" r="132" fill="none" stroke="${C.indigo}" stroke-width="2" stroke-dasharray="6 6"/>
${Array.from({ length: 12 }, (_, k) => { const a = (k * 30 * Math.PI) / 180; return marigold(200 + Math.cos(a) * 118, 200 + Math.sin(a) * 118, 9); }).join('')}
<ellipse cx="140" cy="214" rx="12" ry="18" fill="${C.skin}" stroke="${INK}" stroke-width="2.5"/>
<ellipse cx="260" cy="214" rx="12" ry="18" fill="${C.skin}" stroke="${INK}" stroke-width="2.5"/>
<circle cx="200" cy="206" r="64" fill="#D9A06E" stroke="${INK}" stroke-width="3"/>
<path d="M200 142 C 192 120, 206 112, 214 124 C 206 122, 202 130, 204 142" fill="${INK}"/>
<path d="M176 200 Q186 192 194 200 M206 200 Q214 192 224 200" stroke="${INK}" stroke-width="3" fill="none" stroke-linecap="round"/>
<path d="M176 236 Q200 256 224 236" stroke="${INK}" stroke-width="3" fill="${C.deepRed}"/>
<circle cx="168" cy="224" r="8" fill="${C.pink}" opacity="0.6"/><circle cx="232" cy="224" r="8" fill="${C.pink}" opacity="0.6"/>
<circle cx="200" cy="172" r="6" fill="${C.red}"/>
<path d="M190 182 Q200 176 210 182" stroke="${C.gold}" stroke-width="3" fill="none"/>
<ellipse cx="200" cy="392" rx="120" ry="26" fill="url(#brass)" stroke="${INK}" stroke-width="3"/>
<ellipse cx="200" cy="388" rx="96" ry="16" fill="none" stroke="${INK}" stroke-width="1.5"/>
<g transform="translate(150 384) rotate(-20)"><circle cx="-12" cy="0" r="7" fill="none" stroke="${INK}" stroke-width="3"/><circle cx="-12" cy="14" r="7" fill="none" stroke="${INK}" stroke-width="3"/><path d="M-6 3 L34 12 M-6 11 L34 2" stroke="url(#silver)" stroke-width="5"/></g>
${kalash(250, 386, 0.3)}
${marigold(190, 386, 7)}
${frame(W, H, C.indigo)}`),

  annaprashan: () => svg(W, H, `
${bgRect('#FFF1D6')}
<circle cx="200" cy="190" r="140" fill="#FBE0A6"/>
<path d="M40 330 C 120 270, 300 260, 368 300 C 300 360, 120 380, 40 330Z" fill="${C.green}" stroke="${INK}" stroke-width="3"/>
<path d="M50 330 C 150 300, 280 292, 360 300" stroke="#1E5A36" stroke-width="2.5" fill="none"/>
${[90, 140, 190, 240, 290].map((x) => `<path d="M${x} ${318 - (x - 90) / 12} l 14 -20 M${x} ${318 - (x - 90) / 12} l 14 20" stroke="#1E5A36" stroke-width="1.5"/>`).join('')}
<path d="M110 250 Q 200 350 290 250Z" fill="url(#silver)" stroke="${INK}" stroke-width="3"/>
<ellipse cx="200" cy="250" rx="90" ry="20" fill="${C.white}" stroke="${INK}" stroke-width="3"/>
${dots([[170, 246], [196, 252], [222, 244], [240, 252], [182, 256], [210, 238]], C.saffron, 3)}
${dots([[160, 252], [230, 256], [205, 248]], '#7CB342', 3)}
<path d="M236 240 L300 170" stroke="url(#silver)" stroke-width="10" stroke-linecap="round"/>
<path d="M236 240 L300 170" stroke="${INK}" stroke-width="1.5" fill="none" opacity="0.6"/>
<ellipse cx="226" cy="250" rx="16" ry="8" fill="url(#silver)" stroke="${INK}" stroke-width="2"/>
<path d="M146 288 Q 200 300 254 288" stroke="${INK}" stroke-width="2" fill="none"/>
<rect x="176" y="300" width="48" height="12" rx="3" fill="url(#silver)" stroke="${INK}" stroke-width="2"/>
${diya(94, 400, 0.9)}${diya(306, 400, 0.9)}
${marigold(150, 410, 10)}${marigold(250, 410, 10)}${marigold(200, 418, 8)}
${sunburst(110, 100, 18, C.gold)}
${frame(W, H, C.ochre)}`),

  'pitri-karma': () => svg(W, H, `
<defs><linearGradient id="dawn" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#F6C27A"/><stop offset="1" stop-color="#FCE6C2"/></linearGradient></defs>
<rect width="${W}" height="${H}" fill="url(#dawn)"/>
<circle cx="200" cy="232" r="70" fill="${C.saffron}" stroke="${INK}" stroke-width="3"/>
<rect x="30" y="232" width="340" height="140" fill="${C.water}"/>
<path d="M30 232 H370" stroke="${INK}" stroke-width="3"/>
${[256, 282, 308, 334].map((y, k) => `<path d="M${40 + (k % 2) * 16} ${y} q 14 -8 28 0 t 28 0 t 28 0 t 28 0 t 28 0 t 28 0 t 28 0 t 28 0 t 28 0 t 28 0 t 28 0" stroke="#BFE0F5" stroke-width="2" fill="none"/>`).join('')}
${[[120, 290], [200, 268], [282, 300], [160, 330]].map(([x, y]) => `<g transform="translate(${x} ${y})"><path d="M-16 0 L16 0 L10 8 L-10 8Z" fill="${C.green}" stroke="${INK}" stroke-width="1.5"/>${flame(0, 0, 0.5)}<path d="M-6 14 L6 14 M-4 20 L4 20" stroke="${C.gold}" stroke-width="2" opacity="0.8"/></g>`).join('')}
<rect x="30" y="372" width="340" height="24" fill="#B9A58C" stroke="${INK}" stroke-width="2.5"/>
<rect x="30" y="396" width="340" height="24" fill="#A89279" stroke="${INK}" stroke-width="2.5"/>
<rect x="30" y="420" width="340" height="50" fill="#97806A" stroke="${INK}" stroke-width="2.5"/>
<path d="M120 384 C 150 360, 250 360, 280 384 C 250 398, 150 398, 120 384Z" fill="${C.leaf}" stroke="${INK}" stroke-width="2.5"/>
<circle cx="172" cy="378" r="11" fill="${C.white}" stroke="${INK}" stroke-width="2"/>
<circle cx="200" cy="374" r="11" fill="${C.white}" stroke="${INK}" stroke-width="2"/>
<circle cx="228" cy="378" r="11" fill="${C.white}" stroke="${INK}" stroke-width="2"/>
${[[110, 372, -30], [116, 372, -12], [122, 372, 6]].map(([x, y, r]) => `<path transform="translate(${x} ${y}) rotate(${r})" d="M0 0 C 2 -14, 2 -28, 0 -40" stroke="#6E8B3D" stroke-width="3" fill="none"/>`).join('')}
${diya(312, 386, 0.8)}
${[[90, 120], [140, 96], [270, 110], [320, 140]].map(([x, y]) => `<path d="M${x - 10} ${y} q 5 -6 10 0 q 5 -6 10 0" stroke="${INK}" stroke-width="2" fill="none"/>`).join('')}
${frame(W, H, C.indigo)}`),
};

/* --------------------------------- pandits --------------------------------- */

const pandit = ({ bg, ring, skin, hair, beard, moustache, glasses, tilak, kurta, scarf, mala }) => {
  const P = 400;
  const shade = skin.dark;
  const petals = Array.from({ length: 16 }, (_, k) => `<ellipse cx="0" cy="-150" rx="14" ry="30" transform="rotate(${k * 22.5})" fill="${ring}" opacity="0.55"/>`).join('');
  const hairCap = hair === 'none' ? '' : `<path d="M140 150 C 140 92, 260 92, 260 150 C 250 124, 150 124, 140 150Z" fill="${hair}"/>`;
  const shikha = `<path d="M206 98 C 214 76, 236 74, 232 92 C 226 84, 216 88, 214 100Z" fill="${hair === 'none' ? INK : hair}" stroke="${INK}" stroke-width="1.5"/>`;
  const tilakSvg = tilak === 'tripundra'
    ? `<path d="M176 136 Q200 130 224 136 M174 144 Q200 138 226 144 M176 152 Q200 146 224 152" stroke="#F5F1E6" stroke-width="4" fill="none" stroke-linecap="round"/><circle cx="200" cy="144" r="4.5" fill="${C.red}"/>`
    : tilak === 'vaishnav'
      ? `<path d="M188 124 L192 156 Q200 162 208 156 L212 124" stroke="#F5F1E6" stroke-width="4" fill="none" stroke-linecap="round"/><path d="M200 128 V156" stroke="${C.red}" stroke-width="4" stroke-linecap="round"/>`
      : `<path d="M200 126 V150" stroke="#F3D28A" stroke-width="6" stroke-linecap="round"/><circle cx="200" cy="152" r="5" fill="${C.red}"/>`;
  const beardSvg = beard
    ? `<path d="M150 186 C 150 250, 176 278, 200 280 C 224 278, 250 250, 250 186 C 240 214, 222 222, 200 222 C 178 222, 160 214, 150 186Z" fill="${beard}" stroke="${INK}" stroke-width="2"/>`
    : '';
  const moustacheSvg = moustache
    ? `<path d="M176 200 C 186 192, 196 194, 200 198 C 204 194, 214 192, 224 200 C 214 202, 206 204, 200 202 C 194 204, 186 202, 176 200Z" fill="${moustache}" stroke="${INK}" stroke-width="1.2"/>`
    : '';
  const glassesSvg = glasses
    ? `<circle cx="178" cy="172" r="15" fill="#FFFFFF" fill-opacity="0.18" stroke="${INK}" stroke-width="3"/><circle cx="222" cy="172" r="15" fill="#FFFFFF" fill-opacity="0.18" stroke="${INK}" stroke-width="3"/><path d="M193 170 Q200 166 207 170" stroke="${INK}" stroke-width="3" fill="none"/>`
    : '';
  const malaBeads = Array.from({ length: 19 }, (_, k) => {
    const t = Math.PI * (0.12 + (0.76 * k) / 18);
    return `<circle cx="${200 + Math.cos(t) * 74}" cy="${262 + Math.sin(t) * 72}" r="6" fill="${mala}" stroke="${INK}" stroke-width="1.2"/>`;
  }).join('');
  return svg(P, P, `
<rect width="${P}" height="${P}" fill="${bg}"/>
<g transform="translate(200 178)">${petals}<circle r="118" fill="${ring}" opacity="0.35"/><circle r="118" fill="none" stroke="${INK}" stroke-width="2" stroke-dasharray="3 6" opacity="0.6"/></g>
<path d="M60 400 C 60 300, 120 262, 200 262 C 280 262, 340 300, 340 400Z" fill="${kurta}" stroke="${INK}" stroke-width="3"/>
<path d="M118 290 C 170 300, 230 360, 262 400 L 220 400 C 196 366, 150 320, 104 308Z" fill="${scarf}" stroke="${INK}" stroke-width="2.5"/>
<path d="M122 300 C 172 314, 222 362, 246 396" stroke="${C.gold}" stroke-width="3" fill="none" stroke-dasharray="6 5"/>
<rect x="182" y="226" width="36" height="44" fill="${skin.base}" stroke="${INK}" stroke-width="2.5"/>
<path d="M182 246 Q200 258 218 246" fill="${shade}" opacity="0.5"/>
${malaBeads}
<circle cx="200" cy="336" r="9" fill="${mala}" stroke="${INK}" stroke-width="1.5"/>
<ellipse cx="146" cy="176" rx="11" ry="17" fill="${skin.base}" stroke="${INK}" stroke-width="2.5"/>
<ellipse cx="254" cy="176" rx="11" ry="17" fill="${skin.base}" stroke="${INK}" stroke-width="2.5"/>
<ellipse cx="200" cy="168" rx="56" ry="70" fill="${skin.base}" stroke="${INK}" stroke-width="3"/>
${hairCap}${shikha}
${tilakSvg}
<path d="M166 160 Q178 152 190 160 M210 160 Q222 152 234 160" stroke="${hair === 'none' || hair === '#D9D4CC' ? '#8C8279' : INK}" stroke-width="3.5" fill="none" stroke-linecap="round"/>
<ellipse cx="178" cy="174" rx="5" ry="4" fill="${INK}"/><ellipse cx="222" cy="174" rx="5" ry="4" fill="${INK}"/>
${glassesSvg}
<path d="M200 176 C 196 190, 194 194, 202 196" stroke="${shade}" stroke-width="2.5" fill="none" stroke-linecap="round"/>
${beardSvg}${moustacheSvg}
<path d="M186 212 Q200 222 214 212" stroke="${INK}" stroke-width="2.5" fill="none" stroke-linecap="round"/>
`);
};

const pandits = {
  'pandit-vikash-parashar': () => pandit({
    bg: '#E3F1EF', ring: '#8FC9C0', skin: { base: '#C98B5B', dark: '#9C6338' }, hair: '#2B1A12', beard: null, moustache: '#2B1A12',
    glasses: false, tilak: 'tripundra', kurta: '#FFF3DC', scarf: C.saffron, mala: '#6B3A1F',
  }),
  'pandit-vedic-acharya': () => pandit({
    bg: '#F6E2DA', ring: '#E5A48C', skin: { base: '#D9A06E', dark: '#A8703F' }, hair: '#D9D4CC', beard: '#EDEAE4', moustache: '#E2DED7',
    glasses: true, tilak: 'vaishnav', kurta: '#FFFFFF', scarf: '#C0392B', mala: '#7A4A26',
  }),
  'pandit-mishra': () => pandit({
    bg: '#E2E6F3', ring: '#9EAAD6', skin: { base: '#B97A4C', dark: '#8A552C' }, hair: '#2B1A12', beard: null, moustache: null,
    glasses: false, tilak: 'chandan', kurta: '#F9D976', scarf: '#8E1B1B', mala: '#5A3418',
  }),
};

/* ---------------------------------- write ---------------------------------- */

mkdirSync(join(root, 'rituals'), { recursive: true });
mkdirSync(join(root, 'pandits'), { recursive: true });
for (const [id, make] of Object.entries(rituals)) writeFileSync(join(root, 'rituals', `${id}.svg`), make());
for (const [id, make] of Object.entries(pandits)) writeFileSync(join(root, 'pandits', `${id}.svg`), make());
console.log(`[purohit-art] wrote ${Object.keys(rituals).length} ritual + ${Object.keys(pandits).length} pandit images to public/purohit/`);
