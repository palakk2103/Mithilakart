/**
 * Admin-controlled colour theme for the four customer tabs.
 *
 * Every tab colour in the customer app is written as a CSS variable with the
 * built-in colour as fallback, e.g. `bg-[color:var(--qs-primary,#F26522)]`.
 * Nothing here runs → the app looks exactly as designed. When the admin saves
 * a theme (Diwali, Holi, …) we set those variables on <html> and every screen
 * recolours at once, without a rebuild.
 */
import { useSyncExternalStore } from 'react';

export const TAB_KEYS = ['mithilakart', 'mithilak', 'quickshop', 'freshgrocery'];

export const TAB_LABELS = {
  mithilakart: 'Mithilakart',
  mithilak: 'Mithilak',
  quickshop: 'Quick Shop',
  freshgrocery: 'Groceries & Fresh',
};

const VAR_PREFIX = { mithilakart: 'mk', mithilak: 'ml', quickshop: 'qs', freshgrocery: 'fg' };
const ROLES = ['primary', 'dark', 'accent', 'light'];

/** The colours the app was designed with — used whenever the admin sets none. */
export const DEFAULT_TAB_THEMES = {
  mithilakart: { primary: '#65B842', dark: '#3E5A44', accent: '#6FAE4A', light: '#F6F8F3' },
  mithilak: { primary: '#207C8A', dark: '#144F58', accent: '#2A9AAB', light: '#F5F9FA' },
  quickshop: { primary: '#F26522', dark: '#D45014', accent: '#FF7A00', light: '#FFF5EE' },
  freshgrocery: { primary: '#D9A21B', dark: '#C49218', accent: '#E8B53A', light: '#FFF8EE' },
};

const palette = (primary, dark, accent, light) => ({ primary, dark, accent, light });

/** Ready-made festival looks the admin can start from and then fine-tune. */
export const FESTIVAL_PRESETS = [
  { id: 'default', name: 'Original', icon: 'leaf', tabs: DEFAULT_TAB_THEMES },
  {
    id: 'diwali', name: 'Diwali', icon: 'diya',
    tabs: {
      mithilakart: palette('#B5302A', '#6E1A16', '#F4B400', '#FFF6E5'),
      mithilak: palette('#C2410C', '#7C2D12', '#F59E0B', '#FFF7ED'),
      quickshop: palette('#E11D48', '#9F1239', '#F59E0B', '#FFF1F2'),
      freshgrocery: palette('#D97706', '#92400E', '#FBBF24', '#FFFBEB'),
    },
  },
  {
    id: 'holi', name: 'Holi', icon: 'palette',
    tabs: {
      mithilakart: palette('#DB2777', '#9D174D', '#F59E0B', '#FDF2F8'),
      mithilak: palette('#7C3AED', '#4C1D95', '#EC4899', '#F5F3FF'),
      quickshop: palette('#0EA5E9', '#075985', '#F97316', '#F0F9FF'),
      freshgrocery: palette('#16A34A', '#14532D', '#EAB308', '#F0FDF4'),
    },
  },
  {
    id: 'chhath', name: 'Chhath Puja', icon: 'sun',
    tabs: {
      mithilakart: palette('#EA580C', '#9A3412', '#FACC15', '#FFF7ED'),
      mithilak: palette('#D97706', '#92400E', '#F43F5E', '#FFFBEB'),
      quickshop: palette('#F97316', '#C2410C', '#EAB308', '#FFF7ED'),
      freshgrocery: palette('#CA8A04', '#854D0E', '#F97316', '#FEFCE8'),
    },
  },
  {
    id: 'navratri', name: 'Navratri / Durga Puja', icon: 'flower',
    tabs: {
      mithilakart: palette('#BE123C', '#881337', '#F59E0B', '#FFF1F2'),
      mithilak: palette('#C026D3', '#86198F', '#F59E0B', '#FDF4FF'),
      quickshop: palette('#E11D48', '#9F1239', '#FB923C', '#FFF1F2'),
      freshgrocery: palette('#EA580C', '#9A3412', '#FACC15', '#FFF7ED'),
    },
  },
  {
    id: 'eid', name: 'Eid', icon: 'moon',
    tabs: {
      mithilakart: palette('#047857', '#064E3B', '#D4AF37', '#ECFDF5'),
      mithilak: palette('#0F766E', '#134E4A', '#D4AF37', '#F0FDFA'),
      quickshop: palette('#059669', '#065F46', '#F59E0B', '#ECFDF5'),
      freshgrocery: palette('#65A30D', '#3F6212', '#D4AF37', '#F7FEE7'),
    },
  },
  {
    id: 'christmas', name: 'Christmas & New Year', icon: 'snowflake',
    tabs: {
      mithilakart: palette('#B91C1C', '#7F1D1D', '#15803D', '#FEF2F2'),
      mithilak: palette('#15803D', '#14532D', '#DC2626', '#F0FDF4'),
      quickshop: palette('#DC2626', '#991B1B', '#16A34A', '#FEF2F2'),
      freshgrocery: palette('#166534', '#14532D', '#CA8A04', '#F0FDF4'),
    },
  },
  {
    id: 'national', name: 'Independence / Republic Day', icon: 'flag',
    tabs: {
      mithilakart: palette('#138808', '#0B5D05', '#FF9933', '#F0FFF0'),
      mithilak: palette('#1E3A8A', '#172554', '#FF9933', '#EFF6FF'),
      quickshop: palette('#FF9933', '#C2410C', '#138808', '#FFF7EE'),
      freshgrocery: palette('#138808', '#0B5D05', '#FF9933', '#F0FFF0'),
    },
  },
];


// ── Seasonal presets (colours + a matching animated effect) ────────────────
FESTIVAL_PRESETS.push(
  {
    id: 'winter', name: 'Winter', icon: 'snowflake',
    tabs: {
      mithilakart: palette('#2563A8', '#173F73', '#60A5FA', '#EFF6FF'),
      mithilak: palette('#0E7490', '#164E63', '#38BDF8', '#ECFEFF'),
      quickshop: palette('#4F46E5', '#312E81', '#818CF8', '#EEF2FF'),
      freshgrocery: palette('#0F766E', '#134E4A', '#5EEAD4', '#F0FDFA'),
    },
  },
  {
    id: 'summer', name: 'Summer', icon: 'sun',
    tabs: {
      mithilakart: palette('#F59E0B', '#B45309', '#FCD34D', '#FFFBEB'),
      mithilak: palette('#0891B2', '#155E75', '#22D3EE', '#ECFEFF'),
      quickshop: palette('#F97316', '#C2410C', '#FDBA74', '#FFF7ED'),
      freshgrocery: palette('#65A30D', '#3F6212', '#FACC15', '#F7FEE7'),
    },
  },
  {
    id: 'monsoon', name: 'Monsoon', icon: 'rain',
    tabs: {
      mithilakart: palette('#3B82A0', '#1E4D63', '#7DD3C0', '#F0F9FA'),
      mithilak: palette('#0F766E', '#134E4A', '#67E8F9', '#F0FDFA'),
      quickshop: palette('#475569', '#1E293B', '#60A5FA', '#F1F5F9'),
      freshgrocery: palette('#15803D', '#14532D', '#86EFAC', '#F0FDF4'),
    },
  },
  {
    id: 'spring', name: 'Basant / Spring', icon: 'flower',
    tabs: {
      mithilakart: palette('#CA8A04', '#854D0E', '#FDE047', '#FEFCE8'),
      mithilak: palette('#BE185D', '#831843', '#F9A8D4', '#FDF2F8'),
      quickshop: palette('#EA580C', '#9A3412', '#FDBA74', '#FFF7ED'),
      freshgrocery: palette('#4D7C0F', '#365314', '#BEF264', '#F7FEE7'),
    },
  },
);

/** One-colour looks: the same colour family across all four tabs. */
export const singleColourTabs = (primary) => Object.fromEntries(
  ['mithilakart', 'mithilak', 'quickshop', 'freshgrocery'].map((t) => [t, completePalette({ primary }, t)])
);

FESTIVAL_PRESETS.push({
  id: 'orange', name: 'Orange', icon: 'tag',
  tabs: {
    mithilakart: palette('#F26522', '#C2410C', '#FF8A3D', '#FFF5EE'),
    mithilak: palette('#F26522', '#C2410C', '#FF8A3D', '#FFF5EE'),
    quickshop: palette('#F26522', '#C2410C', '#FF8A3D', '#FFF5EE'),
    freshgrocery: palette('#F26522', '#C2410C', '#FF8A3D', '#FFF5EE'),
  },
});

const hero = (headline, subtext, ctaLabel = 'Shop now') => ({ enabled: true, headline, subtext, ctaLabel, ctaLink: '' });

/** The effect, pill and hero banner each preset brings (every value stays editable). */
export const PRESET_EFFECTS = {
  default: { type: 'none' },
  orange: { type: 'none' },
  diwali: { type: 'diwali', intensity: 4, banner: { enabled: true, icon: 'diya', text: 'Happy Diwali! Festive offers are live' }, hero: hero('Light up your Diwali', 'Gifts, sweets & festive essentials at the best prices', 'Shop festive') },
  holi: { type: 'holi', intensity: 3, banner: { enabled: true, icon: 'palette', text: 'Happy Holi! Colours of savings' }, hero: hero('Play Holi, save big', 'Colours, sweets & party picks delivered fast') },
  chhath: { type: 'petals', intensity: 3, colors: ['#FFA62B', '#FFD166', '#F25C54'], banner: { enabled: true, icon: 'sun', text: 'Chhath Puja special offers' }, hero: hero('Chhath Puja essentials', 'Everything for the pooja, in one place', 'Explore') },
  navratri: { type: 'petals', intensity: 4, banner: { enabled: true, icon: 'flower', text: 'Navratri / Durga Puja specials' }, hero: hero('Navratri & Durga Puja', 'Pooja needs, festive fashion & sweets', 'Shop now') },
  eid: { type: 'stars', intensity: 3, banner: { enabled: true, icon: 'moon', text: 'Eid Mubarak! Special offers inside' }, hero: hero('Eid Mubarak', 'Celebrate with festive deals and fresh treats', 'Shop Eid deals') },
  christmas: { type: 'snow', intensity: 4, banner: { enabled: true, icon: 'gift', text: 'Merry Christmas & Happy New Year!' }, hero: hero('Merry Christmas', 'Gifts, treats & party picks — up to 50% off', 'Shop gifts') },
  national: { type: 'confetti', intensity: 3, banner: { enabled: true, icon: 'flag', text: 'Celebrate with special offers' }, hero: hero('Celebrate the day', 'Special offers for every Indian home', 'Shop now') },
  winter: { type: 'snow', intensity: 4, banner: { enabled: true, icon: 'snowflake', text: 'Winter Sale — stay cosy, save more' }, hero: hero('Winter Sale is here', 'Warm picks & cosy essentials, up to 50% off', 'Shop winter') },
  summer: { type: 'summer', intensity: 3, banner: { enabled: true, icon: 'sun', text: 'Summer Sale — cool deals' }, hero: hero('Beat the heat', 'Cool drinks, fresh fruit & summer must-haves', 'Shop summer') },
  monsoon: { type: 'rain', intensity: 3, banner: { enabled: true, icon: 'rain', text: 'Monsoon offers on essentials' }, hero: hero('Monsoon Specials', 'Chai, snacks & rainy-day essentials', 'Shop now') },
  spring: { type: 'petals', intensity: 3, colors: ['#FFC83D', '#FF6F91', '#B7E34A'], banner: { enabled: true, icon: 'flower', text: 'Basant special offers' }, hero: hero('Welcome Basant', 'Fresh flowers, fashion & festive picks', 'Explore') },
};

const HEX = /^#[0-9a-fA-F]{6}$/;

function mix(hex, target, amount) {
  const a = parseInt(hex.slice(1), 16);
  const b = parseInt(target.slice(1), 16);
  const channel = (shift) => Math.round(((a >> shift) & 255) * (1 - amount) + ((b >> shift) & 255) * amount);
  return `#${[16, 8, 0].map((s) => channel(s).toString(16).padStart(2, '0')).join('')}`.toUpperCase();
}

/** Fills the shades the admin left blank from the main colour. */
export function completePalette(colours = {}, tab = 'mithilakart') {
  const primary = HEX.test(colours.primary || '') ? colours.primary : DEFAULT_TAB_THEMES[tab].primary;
  return {
    primary,
    dark: HEX.test(colours.dark || '') ? colours.dark : mix(primary, '#000000', 0.35),
    accent: HEX.test(colours.accent || '') ? colours.accent : mix(primary, '#FFFFFF', 0.2),
    light: HEX.test(colours.light || '') ? colours.light : mix(primary, '#FFFFFF', 0.92),
  };
}

/** WCAG relative luminance; used by the admin page to warn about unreadable text. */
export function contrastWithWhite(hex) {
  const lin = (v) => { const c = v / 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
  const n = parseInt(hex.slice(1), 16);
  const L = 0.2126 * lin((n >> 16) & 255) + 0.7152 * lin((n >> 8) & 255) + 0.0722 * lin(n & 255);
  return 1.05 / (L + 0.05);
}

// ── Active theme (shared with useTabTheme) ─────────────────────────────────
const CACHE_KEY = 'mk_tab_themes';
let current = null;
const listeners = new Set();

function writeVariables(themes) {
  if (typeof document === 'undefined') return;
  const style = document.documentElement.style;
  for (const tab of TAB_KEYS) {
    const custom = themes?.tabs?.[tab];
    const colours = custom ? completePalette(custom, tab) : null;
    for (const role of ROLES) {
      const name = `--${VAR_PREFIX[tab]}-${role}`;
      if (colours) style.setProperty(name, colours[role]);
      else style.removeProperty(name);
    }
  }
}

export function applyTabThemes(themes, { persist = true } = {}) {
  current = themes && themes.tabs ? themes : null;
  writeVariables(current);
  if (persist) {
    try {
      if (current) localStorage.setItem(CACHE_KEY, JSON.stringify(current));
      else localStorage.removeItem(CACHE_KEY);
    } catch {
      // storage unavailable — theme still applies for this visit
    }
  }
  listeners.forEach((fn) => fn());
}

/** Last theme seen, applied before the first paint so returning users get no colour flash. */
export function applyCachedTabThemes() {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (raw) applyTabThemes(JSON.parse(raw), { persist: false });
  } catch {
    // ignore corrupt cache
  }
}

/** The colours a tab is showing right now (admin theme or the defaults). */
export function resolvedTabColours(tab, themes = current) {
  const custom = themes?.tabs?.[tab];
  return custom ? completePalette(custom, tab) : DEFAULT_TAB_THEMES[tab];
}

const subscribe = (fn) => { listeners.add(fn); return () => listeners.delete(fn); };
const snapshot = () => current;

/** Re-renders when the admin theme changes. */
export function useActiveTabThemes() {
  return useSyncExternalStore(subscribe, snapshot, snapshot);
}
