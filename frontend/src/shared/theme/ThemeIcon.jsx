/**
 * Hand-drawn vector icons for the theme system. They replace system emojis, which look
 * different (and cheap) on every phone. Stroke icons are for UI (admin, banner), and the
 * filled SHAPES are what the "Custom event" effect rains down.
 */

const STROKE = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.7, strokeLinecap: 'round', strokeLinejoin: 'round' };

const ICONS = {
  leaf: <><path d="M5 19c0-9.5 5.5-14 15-14 0 9.5-5 14-15 14z" /><path d="M5 19l8.5-8.5" /></>,
  snowflake: <>{[0, 60, 120].map((r) => <path key={r} transform={`rotate(${r} 12 12)`} d="M12 2.5v19M12 6.5l-2.6-2.4M12 6.5l2.6-2.4M12 17.5l-2.6 2.4M12 17.5l2.6 2.4" />)}</>,
  sun: <><circle cx="12" cy="12" r="4.2" />{Array.from({ length: 8 }).map((_, i) => <path key={i} transform={`rotate(${i * 45} 12 12)`} d="M12 2.8v2.6" />)}</>,
  rain: <><path d="M7.5 14.5a4 4 0 010-8 5.2 5.2 0 019.9 1.3 3.4 3.4 0 01-.4 6.7H7.5z" /><path d="M8.5 17.5l-1 2.5M12.5 17.5l-1 2.5M16.5 17.5l-1 2.5" /></>,
  diya: <><path d="M3 13.5h18a9 9 0 01-9 6.5 9 9 0 01-9-6.5z" /><path d="M12 3c2.3 2.4 3.2 4 3.2 5.5A3.2 3.2 0 0112 11.7a3.2 3.2 0 01-3.2-3.2C8.8 7 9.7 5.4 12 3z" /></>,
  palette: <><path d="M12 3a9 9 0 100 18c1.4 0 2.1-.9 2.1-1.9 0-1.4-1.2-1.7-1.2-3 0-1 .8-1.7 1.9-1.7H17a4 4 0 004-4c0-4.2-4-7.4-9-7.4z" /><circle cx="7.6" cy="11" r=".9" fill="currentColor" /><circle cx="10" cy="7.2" r=".9" fill="currentColor" /><circle cx="14.6" cy="7.2" r=".9" fill="currentColor" /></>,
  flower: <><circle cx="12" cy="12" r="2.2" />{[0, 72, 144, 216, 288].map((r) => <ellipse key={r} transform={`rotate(${r} 12 12)`} cx="12" cy="6.2" rx="2.6" ry="3.6" />)}</>,
  party: <><path d="M4 20l4.2-11.2 7 7L4 20z" /><path d="M13 5.5l.7-2M17.2 8.5l2-.8M15 3.2v0M19.5 13l2 .5M11.5 9.5l1.7-1.7" /></>,
  moon: <path d="M20.5 13.2A8.6 8.6 0 1110.8 3.5a6.7 6.7 0 009.7 9.7z" />,
  sparkle: <><path d="M12 3c.7 4.7 3.3 7.3 8 8-4.7.7-7.3 3.3-8 8-.7-4.7-3.3-7.3-8-8 4.7-.7 7.3-3.3 8-8z" /></>,
  gift: <><rect x="3.5" y="9" width="17" height="11" rx="1.5" /><path d="M3 9h18M12 9v11" /><path d="M12 9C9 9 7.5 7.6 7.5 6.2 7.5 4.8 9 4.2 10.2 5c1 .7 1.8 2.2 1.8 4zM12 9c3 0 4.5-1.4 4.5-2.8 0-1.4-1.5-2-2.7-1.2-1 .7-1.8 2.2-1.8 4z" /></>,
  tag: <><path d="M3.5 12.2V4.5a1 1 0 011-1h7.7a1 1 0 01.7.3l7.6 7.6a1 1 0 010 1.4l-7.7 7.7a1 1 0 01-1.4 0L3.8 12.9a1 1 0 01-.3-.7z" /><circle cx="8" cy="8" r="1.4" /></>,
  flag: <><path d="M5 21V3.5" /><path d="M5 4.5c4-2 6 2 10 0 1.4-.7 3-.7 4 0v8c-1-.7-2.600-.7-4 0-4 2-6-2-10 0" /></>,
  heart: <path d="M12 20.5S3.5 15 3.5 9.2A4.7 4.7 0 0112 7a4.7 4.7 0 018.5 2.200C20.500 15 12 20.500 12 20.500z" />,
  star: <path d="M12 3.2l2.6 5.500 6 .8-4.400 4.200 1.100 6-5.300-2.900-5.300 2.900 1.100-6L3.400 9.500l6-.8z" />,
  balloon: <><path d="M12 3.5c3.300 0 5.500 2.600 5.500 5.700 0 3.500-2.800 6-5.500 7-2.700-1-5.500-3.500-5.500-7C6.500 6.100 8.700 3.500 12 3.500z" /><path d="M12 16.200l-1 1.300h2zM12 17.500c-1 1.500 1 2.500 0 4" /></>,
  drop: <path d="M12 3.200c3.600 4.200 5.800 7 5.800 10a5.800 5.800 0 01-11.600 0c0-3 2.200-5.800 5.800-10z" />,
  diamond: <path d="M12 3.500l7.500 8.500L12 20.500 4.500 12z" />,
};

export const ICON_NAMES = ['leaf', 'snowflake', 'sun', 'rain', 'diya', 'palette', 'flower', 'party', 'moon', 'sparkle', 'gift', 'tag', 'flag'];
export const SHAPE_NAMES = ['heart', 'star', 'sparkle', 'balloon', 'gift', 'drop', 'diamond', 'leaf', 'flower', 'snowflake'];

export const ThemeIcon = ({ name, size = 20, className = '', style }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} className={className} style={style} {...STROKE} aria-hidden="true">
    {ICONS[name] || ICONS.sparkle}
  </svg>
);

/** Filled version of a shape in a given colour — used as a falling particle. */
export const ThemeShape = ({ name, color = '#fff' }) => (
  <svg viewBox="0 0 24 24" width="100%" height="100%" aria-hidden="true"
    fill={['snowflake'].includes(name) ? 'none' : color} stroke={color} strokeWidth={name === 'snowflake' ? 1.8 : 0.6} strokeLinecap="round" strokeLinejoin="round">
    {ICONS[name] || ICONS.sparkle}
  </svg>
);

export default ThemeIcon;
