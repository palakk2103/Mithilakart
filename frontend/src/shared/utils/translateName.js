import i18n from '../../i18n';

// Translates well-known static labels (category names, badges, delivery estimates...) using
// the "names" dictionary in the locale files. Unknown labels (e.g. text already translated by
// the backend) are returned untouched.
export const tName = (name) => {
  if (typeof name !== 'string') return name;
  const lng = (i18n.language || 'en').split('-')[0];
  if (lng === 'en') return name;
  const key = name.trim();
  const dict = i18n.getResource(lng, 'common', 'names');
  if (dict && dict[key]) return dict[key];
  // "17% OFF" / "Min. 38% Off"
  let m = key.match(/^(\d+)%\s*off$/i);
  if (m) return i18n.t('common.percentOff', { n: m[1] });
  // "29 mins" / "15-30 mins"
  m = key.match(/^(\d+(?:\s*-\s*\d+)?)\s*mins?$/i);
  if (m) return i18n.t('common.minsShort', { n: m[1] });
  return name;
};

export default tName;
