import customerApi from '../api/client';

const inflightGeocodes = new Map();

const coordFallback = (latitude, longitude) => ({
  latitude: Number(latitude),
  longitude: Number(longitude),
  shortLabel: `Near ${Number(latitude).toFixed(4)}, ${Number(longitude).toFixed(4)}`,
  formattedAddress: `Near ${Number(latitude).toFixed(4)}, ${Number(longitude).toFixed(4)}`,
  city: null,
  state: null,
  pincode: null,
  addressLine: null,
  placeId: null,
});

async function reverseGeocodeNominatimClient(latitude, longitude) {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${encodeURIComponent(latitude)}&lon=${encodeURIComponent(longitude)}&format=json&addressdetails=1`,
      {
        headers: {
          Accept: 'application/json',
        },
        signal: AbortSignal.timeout(6000),
      }
    );
    if (!res.ok) return null;
    const data = await res.json();
    const addr = data.address || {};
    const building = addr.shop || addr.building || addr.amenity || addr.office || addr.commercial || null;
    const road = addr.road || addr.pedestrian || addr.residential || null;
    const area = addr.suburb || addr.neighbourhood || addr.city_district || addr.quarter || null;
    const city = addr.city || addr.town || addr.village || addr.county || null;
    const state = addr.state || null;
    const pincode = addr.postcode || null;

    const shortLabel = [building, road, area].filter(Boolean).join(', ')
      || [road, area, city].filter(Boolean).join(', ')
      || city
      || data.display_name;

    return {
      latitude: Number(latitude),
      longitude: Number(longitude),
      shortLabel: shortLabel || null,
      formattedAddress: shortLabel || data.display_name || null,
      fullFormattedAddress: data.display_name || null,
      city: city || null,
      state: state || null,
      pincode: pincode || null,
      addressLine: [building, road, area].filter(Boolean).join(', ') || road || null,
      placeId: String(data.place_id || ''),
    };
  } catch {
    return null;
  }
}

export const reverseGeocode = async (latitude, longitude) => {
  const cacheKey = `${Number(latitude).toFixed(4)},${Number(longitude).toFixed(4)}`;
  if (inflightGeocodes.has(cacheKey)) {
    return inflightGeocodes.get(cacheKey);
  }

  const promise = (async () => {
    try {
      const data = await customerApi.get('/maps/reverse-geocode', {
        params: { lat: latitude, lng: longitude },
        timeout: 8000,
        skipAuthLogout: true,
      });
      if (data && (data.shortLabel || data.formattedAddress || data.city)) {
        return data;
      }
    } catch {
      // Backend error or proxy drop -> use direct OpenStreetMap fallback
    }

    const osm = await reverseGeocodeNominatimClient(latitude, longitude);
    if (osm) return osm;

    return coordFallback(latitude, longitude);
  })();

  inflightGeocodes.set(cacheKey, promise);
  try {
    return await promise;
  } finally {
    setTimeout(() => inflightGeocodes.delete(cacheKey), 4000);
  }
};

export const geocodeAddress = (payload) =>
  customerApi.post('/maps/geocode', payload);

export const getNearbySellers = (latitude, longitude, radiusKm = 25) =>
  customerApi.get('/maps/nearby/sellers', {
    params: { lat: latitude, lng: longitude, radiusKm },
  });

export const getNearbyProducts = (params) =>
  customerApi.get('/maps/nearby/products', { params });

