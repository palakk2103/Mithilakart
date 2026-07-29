const STORAGE_KEY = 'mithilakart_live_location';

export const readStoredLocation = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const writeStoredLocation = (location) => {
  if (!location) {
    localStorage.removeItem(STORAGE_KEY);
    return;
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(location));
};

const toCoords = (position) => ({
  latitude: position.coords.latitude,
  longitude: position.coords.longitude,
  accuracy: position.coords.accuracy,
  source: 'gps',
  updatedAt: new Date().toISOString(),
});

const getCurrentPosition = (options) =>
  new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(resolve, reject, options);
  });

/**
 * Request browser GPS with fallbacks — works on desktop (Wi‑Fi) and mobile (GPS).
 * Tries high accuracy first, then relaxed accuracy / cached position.
 */
export const requestBrowserLocation = async ({ maximumAge = 0 } = {}) => {
  if (!navigator.geolocation) {
    throw new Error('Geolocation is not supported on this device');
  }

  const attempts = [
    { enableHighAccuracy: true, timeout: 20000, maximumAge },
    { enableHighAccuracy: false, timeout: 15000, maximumAge: Math.max(maximumAge, 120000) },
  ];

  let lastError = null;
  for (const options of attempts) {
    try {
      const position = await getCurrentPosition(options);
      return toCoords(position);
    } catch (error) {
      lastError = error;
    }
  }

  if (lastError?.code === 1) {
    const err = new Error('Location permission denied');
    err.code = 1;
    throw err;
  }

  throw lastError || new Error('Unable to detect location. Enable location services and try again.');
};

const stripAdministrativeNoise = (text) => {
  if (!text) return text;
  const parts = text.split(',').map((p) => p.trim()).filter(Boolean);
  const filtered = parts.filter((part) => !/tahsil|district|madhya pradesh|india|\d{6}/i.test(part));
  const unique = [];
  const seen = new Set();
  for (const part of filtered) {
    const key = part.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(part);
  }
  return unique.slice(0, 3).join(', ') || parts.slice(0, 2).join(', ');
};

export const formatLocationLabel = (location) => {
  if (!location) return 'Set delivery location';

  const primary = location.shortLabel || location.addressLine;
  if (primary) {
    return primary.length > 52 ? `${primary.slice(0, 52)}…` : primary;
  }

  if (location.formattedAddress) {
    const cleaned = stripAdministrativeNoise(location.formattedAddress);
    return cleaned.length > 52 ? `${cleaned.slice(0, 52)}…` : cleaned;
  }

  if (location.city) return location.city;
  if (location.latitude != null && location.longitude != null) {
    return `${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}`;
  }
  return 'Set delivery location';
};
