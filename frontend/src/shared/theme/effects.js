/**
 * Seasonal / event effects. Everything is data the admin edits; nothing is tied to a date.
 * Renderers: EffectLayer.jsx (animation), SeasonalHero.jsx (illustrated banner).
 */
import { ICON_NAMES, SHAPE_NAMES } from './ThemeIcon';

export const EFFECT_TYPES = [
  { id: 'none', label: 'No effect', icon: 'leaf', hint: 'Plain app, no animation' },
  { id: 'snow', label: 'Winter snow', icon: 'snowflake', hint: 'Layered snowfall + icy glow', colors: ['#FFFFFF', '#CFE8FF', '#9CCBF2'] },
  { id: 'summer', label: 'Summer sun', icon: 'sun', hint: 'Sun beams, warm glow, rising light', colors: ['#FFE08A', '#FFC145', '#FF9F43'] },
  { id: 'rain', label: 'Monsoon rain', icon: 'rain', hint: 'Soft rain with cool mist', colors: ['#BBD3EE', '#8FB2DA', '#6C93C2'] },
  { id: 'diwali', label: 'Diwali lights', icon: 'diya', hint: 'Golden sparkles & glowing embers', colors: ['#FFD86B', '#FFB300', '#FF8A1F'] },
  { id: 'holi', label: 'Holi colours', icon: 'palette', hint: 'Bursting powder clouds', colors: ['#FF4FA3', '#7C4DFF', '#00B0FF', '#FFC400', '#2EC27E'] },
  { id: 'petals', label: 'Flower petals', icon: 'flower', hint: 'Fluttering marigold & rose petals', colors: ['#FFA62B', '#FF6F91', '#FFD166', '#F25C54'] },
  { id: 'confetti', label: 'Celebration', icon: 'party', hint: 'Tumbling confetti', colors: ['#FF9933', '#FFFFFF', '#138808', '#2563EB', '#E11D48'] },
  { id: 'stars', label: 'Night stars', icon: 'moon', hint: 'Twinkling stars, shooting star', colors: ['#FFE9A8', '#FFFFFF', '#F7C948'] },
  { id: 'custom', label: 'Custom event', icon: 'sparkle', hint: 'Pick your own shapes & colours', colors: ['#FF6B8A', '#4FD1C5', '#FFD166'] },
];

export const EFFECT_TAB_KEYS = ['mithilakart', 'mithilak', 'quickshop', 'freshgrocery'];

export const DEFAULT_EFFECTS = {
  type: 'none',
  intensity: 3, speed: 3, size: 3,
  ambient: true,
  tabs: [],
  colors: [],
  motion: 'fall',   // custom: fall | rise | float
  shapes: [],       // custom: names from SHAPE_NAMES
  banner: { enabled: false, icon: 'sparkle', text: '' },
  hero: { enabled: false, headline: '', subtext: '', ctaLabel: 'Shop now', ctaLink: '' },
  startsAt: null,
  endsAt: null,
};

const HEX = /^#[0-9a-fA-F]{6}$/;
export const typeInfo = (id) => EFFECT_TYPES.find((t) => t.id === id) || EFFECT_TYPES[0];

export function normalizeEffects(raw) {
  const e = { ...DEFAULT_EFFECTS, ...(raw || {}) };
  const clamp = (v, d) => Math.min(5, Math.max(1, Number.isFinite(Number(v)) ? Math.round(Number(v)) : d));
  const banner = { ...DEFAULT_EFFECTS.banner, ...(e.banner || {}) };
  const hero = { ...DEFAULT_EFFECTS.hero, ...(e.hero || {}) };
  return {
    ...e,
    type: EFFECT_TYPES.some((t) => t.id === e.type) ? e.type : 'none',
    intensity: clamp(e.intensity, 3),
    speed: clamp(e.speed, 3),
    size: clamp(e.size, 3),
    ambient: e.ambient !== false,
    tabs: Array.isArray(e.tabs) ? e.tabs.filter((t) => EFFECT_TAB_KEYS.includes(t)) : [],
    colors: Array.isArray(e.colors) ? e.colors.filter((c) => HEX.test(c || '')).slice(0, 5) : [],
    motion: ['fall', 'rise', 'float'].includes(e.motion) ? e.motion : 'fall',
    shapes: Array.isArray(e.shapes) ? e.shapes.filter((s) => SHAPE_NAMES.includes(s)).slice(0, 6) : [],
    banner: { ...banner, icon: ICON_NAMES.includes(banner.icon) ? banner.icon : 'sparkle', text: String(banner.text || '') },
    hero: {
      ...hero,
      headline: String(hero.headline || ''),
      subtext: String(hero.subtext || ''),
      ctaLabel: String(hero.ctaLabel || ''),
      // Only in-app paths are ever followed.
      ctaLink: /^\/[A-Za-z0-9\-_/?=&%.#]*$/.test(hero.ctaLink || '') ? hero.ctaLink : '',
    },
  };
}

export function effectsLive(effects, now = Date.now()) {
  const e = normalizeEffects(effects);
  if (e.type === 'none') return false;
  if (e.startsAt && now < Date.parse(e.startsAt)) return false;
  if (e.endsAt && now > Date.parse(e.endsAt)) return false;
  return true;
}

export function seeded(seed) {
  let a = seed >>> 0;
  return () => {
    a += 0x6D2B79F5;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
