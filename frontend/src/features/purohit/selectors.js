import { useMemo } from 'react';
import { useShallow } from 'zustand/react/shallow';
import usePurohitStore from './usePurohitStore';
import { ritualArt, panditArt } from './purohitArt';
import { POSTER_ASSETS } from './purohitSeed';

export const ritualImage = (ritual) => ritual?.image || ritualArt(ritual?.name || 'Puja', ritual?.artPalette);
export const panditImage = (pandit) => pandit?.image || panditArt(pandit?.name || 'Pandit');

/** Qualifications are stored one per line (older data: comma separated). */
export const qualificationList = (text = '') => {
  const raw = String(text || '').trim();
  if (!raw) return [];
  const parts = raw.includes('\n') ? raw.split('\n') : raw.split(',');
  return parts.map((x) => x.trim()).filter(Boolean);
};

/** Two-line ritual badge on the poster; defaults to the ritual name split on its last word. */
export const badgeLines = (service, ritual) => {
  const l1 = String(service?.badgeLine1 || '').trim();
  const l2 = String(service?.badgeLine2 || '').trim();
  if (l1 || l2) return [l1, l2];
  const words = String(ritual?.name || '').trim().split(/\s+/).filter(Boolean);
  if (words.length < 2) return [words[0] || '', ''];
  return [words.slice(0, -1).join(' '), words[words.length - 1]];
};

/** Poster images. Template: card → ritual → section setting → built-in template. */
export const posterTemplate = ({ service, ritual } = {}, settings = {}) => (
  service?.templateImage || ritual?.posterTemplateImage || settings?.posterTemplateImage || POSTER_ASSETS.template
);
export const posterImages = (listing, settings) => ({
  photo: panditImage(listing.pandit),
  template: posterTemplate(listing, settings),
});

export const formatINR =(value) => `₹${Math.round(Number(value) || 0).toLocaleString('en-IN')}`;

export const experienceLabel = (years) => {
  const n = Number(years) || 0;
  if (!n) return '';
  return `${n}+ yrs exp`;
};

const byOrder = (key) => (a, b) => (a[key] ?? 0) - (b[key] ?? 0);

/** Raw catalogue slices (stable references — derive with useMemo, never inside the selector). */
export const usePurohitCatalog = () => usePurohitStore(useShallow((st) => ({
  settings: st.settings,
  rituals: st.rituals,
  pandits: st.pandits,
  services: st.services,
})));

/**
 * Joins services with their pandit + ritual. A listing is "live" only when the service,
 * its pandit and its ritual are all active.
 */
export const buildListings = ({ rituals, pandits, services }, { liveOnly = true } = {}) => {
  const ritualById = new Map(rituals.map((x) => [x.id, x]));
  const panditById = new Map(pandits.map((x) => [x.id, x]));
  return services
    .map((service) => ({ service, ritual: ritualById.get(service.ritualId), pandit: panditById.get(service.panditId) }))
    .filter(({ ritual, pandit, service }) => ritual && pandit && (!liveOnly || (service.active && ritual.active && pandit.active)));
};

export const useActiveRituals = () => {
  const { rituals } = usePurohitCatalog();
  return useMemo(() => rituals.filter((x) => x.active).sort(byOrder('order')), [rituals]);
};

export const useRitualListings = (ritualId) => {
  const catalog = usePurohitCatalog();
  return useMemo(() => buildListings(catalog)
    .filter((x) => x.service.ritualId === ritualId)
    .sort((a, b) => Number(b.service.featured) - Number(a.service.featured)
      || Number(b.pandit.verified) - Number(a.pandit.verified)
      || a.service.price - b.service.price), [catalog, ritualId]);
};

export const useHomeListings = () => {
  const catalog = usePurohitCatalog();
  return useMemo(() => buildListings(catalog)
    .filter((x) => x.service.showOnHome)
    .sort((a, b) => (a.service.homeOrder ?? 0) - (b.service.homeOrder ?? 0)), [catalog]);
};

/** One live card (pandit × ritual) by service id, or null when missing/disabled. */
export const useLiveListing = (serviceId) => {
  const catalog = usePurohitCatalog();
  return useMemo(() => buildListings(catalog).find((x) => x.service.id === serviceId) || null, [catalog, serviceId]);
};

export const useAllLiveListings = () => {
  const catalog = usePurohitCatalog();
  return useMemo(() => buildListings(catalog)
    .sort((a, b) => Number(b.service.featured) - Number(a.service.featured) || (a.ritual.order ?? 0) - (b.ritual.order ?? 0)), [catalog]);
};
