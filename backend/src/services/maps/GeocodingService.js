const { BaseService } = require('../../core/BaseService');
const config = require('../../config');
const { logger } = require('../../utils/logger');

const DEFAULT_TIMEOUT_MS = 5000;
const GEOCODE_CACHE_MAX = 200;
const GEOCODE_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

class GeocodingService extends BaseService {
  constructor() {
    super();
    this.apiKey = config.maps?.apiKey || null;
    this.timeoutMs = Number(config.maps?.timeoutMs) || DEFAULT_TIMEOUT_MS;
    this._cache = new Map();
  }

  isEnabled() {
    return Boolean(this.apiKey);
  }

  async _fetchJson(url, options = {}) {
    const response = await fetch(url, {
      ...options,
      signal: AbortSignal.timeout(this.timeoutMs),
    });

    if (!response.ok) {
      throw new Error(`Geocoding HTTP ${response.status}`);
    }

    return response.json();
  }

  _cacheKey(lat, lng) {
    return `${lat.toFixed(5)},${lng.toFixed(5)}`;
  }

  _getCached(lat, lng) {
    const key = this._cacheKey(lat, lng);
    const entry = this._cache.get(key);
    if (!entry) return null;
    if (Date.now() - entry.ts > GEOCODE_CACHE_TTL_MS) {
      this._cache.delete(key);
      return null;
    }
    return entry.data;
  }

  _setCache(lat, lng, data) {
    const key = this._cacheKey(lat, lng);
    if (this._cache.size >= GEOCODE_CACHE_MAX) {
      // Evict oldest entry
      const oldest = this._cache.keys().next().value;
      this._cache.delete(oldest);
    }
    this._cache.set(key, { data, ts: Date.now() });
  }

  async reverseGeocode({ latitude, longitude }) {
    const lat = Number(latitude);
    const lng = Number(longitude);

    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      return this._coordFallback(latitude, longitude);
    }

    const cached = this._getCached(lat, lng);
    if (cached) return cached;

    let result = null;

    if (this.isEnabled()) {
      result = await this._reverseGeocodeGoogle(lat, lng);
    }

    if (!result) {
      result = await this.reverseGeocodeNominatim(lat, lng);
    }

    if (!result) {
      result = this._coordFallback(lat, lng);
    }

    this._setCache(lat, lng, result);
    return result;
  }

  async _reverseGeocodeGoogle(latitude, longitude) {
    try {
      const url = new URL('https://maps.googleapis.com/maps/api/geocode/json');
      url.searchParams.set('latlng', `${latitude},${longitude}`);
      url.searchParams.set('key', this.apiKey);

      const data = await this._fetchJson(url);

      if (data.status !== 'OK' || !data.results?.length) {
        logger.warn(
          { status: data.status, errorMessage: data.error_message || null, latitude, longitude },
          `Google reverse geocoding failed: ${data.error_message || data.status}`
        );
        return null;
      }

      const result = data.results.find((r) =>
        r.types?.some((t) => ['street_address', 'premise', 'establishment', 'point_of_interest', 'subpremise'].includes(t))
      ) || data.results[0];
      const components = result.address_components || [];
      const pick = (type) => components.find((c) => c.types.includes(type))?.long_name || null;

      const building = pick('premise') || pick('establishment') || pick('point_of_interest');
      const road = pick('route');
      const area = pick('sublocality') || pick('sublocality_level_1') || pick('neighborhood');
      const city = pick('locality') || pick('administrative_area_level_2');
      const shortLabel = [building, road, area].filter(Boolean).join(', ')
        || [road, area, city].filter(Boolean).join(', ')
        || result.formatted_address;

      return {
        latitude: Number(latitude),
        longitude: Number(longitude),
        shortLabel,
        formattedAddress: shortLabel,
        fullFormattedAddress: result.formatted_address,
        placeId: result.place_id,
        city,
        state: pick('administrative_area_level_1'),
        pincode: pick('postal_code'),
        addressLine: [building, road, area].filter(Boolean).join(', ') || result.formatted_address,
      };
    } catch (error) {
      logger.warn({ err: error, latitude, longitude }, 'Google reverse geocoding request failed');
      return null;
    }
  }

  async reverseGeocodeNominatim(latitude, longitude) {
    try {
      const url = new URL('https://nominatim.openstreetmap.org/reverse');
      url.searchParams.set('lat', String(latitude));
      url.searchParams.set('lon', String(longitude));
      url.searchParams.set('format', 'json');
      url.searchParams.set('addressdetails', '1');
      url.searchParams.set('namedetails', '1');
      url.searchParams.set('zoom', '18');

      const data = await this._fetchJson(url, {
        headers: {
          'User-Agent': 'Mithilakart/1.0 (contact@mithilakart.com)',
          Accept: 'application/json',
        },
      });

      const addr = data.address || {};
      const building = addr.shop
        || addr.building
        || addr.commercial
        || addr.amenity
        || addr.office
        || data.name
        || null;
      const road = addr.road || addr.pedestrian || addr.footway || addr.residential || null;
      const area = addr.suburb || addr.neighbourhood || addr.quarter || addr.city_district || null;
      const city = addr.city || addr.town || addr.village || addr.county || null;

      const shortLabel = [building, road, area]
        .filter(Boolean)
        .join(', ')
        || [road, area, city].filter(Boolean).join(', ')
        || city;

      const addressLine = [building, road, area].filter(Boolean).join(', ') || road || null;

      return {
        latitude: Number(latitude),
        longitude: Number(longitude),
        shortLabel,
        formattedAddress: shortLabel || data.display_name || this._coordFallback(latitude, longitude).formattedAddress,
        fullFormattedAddress: data.display_name || null,
        placeId: String(data.place_id || ''),
        city,
        state: addr.state || null,
        pincode: addr.postcode || null,
        addressLine,
      };
    } catch (error) {
      logger.warn({ err: error, latitude, longitude }, 'Nominatim reverse geocoding failed');
      return null;
    }
  }

  _coordFallback(latitude, longitude) {
    const lat = Number(latitude);
    const lng = Number(longitude);
    const hasCoords = Number.isFinite(lat) && Number.isFinite(lng);

    return {
      latitude: hasCoords ? lat : null,
      longitude: hasCoords ? lng : null,
      shortLabel: hasCoords ? `Near ${lat.toFixed(4)}, ${lng.toFixed(4)}` : 'Location unavailable',
      formattedAddress: hasCoords ? `Near ${lat.toFixed(4)}, ${lng.toFixed(4)}` : 'Location unavailable',
      fullFormattedAddress: null,
      city: null,
      state: null,
      pincode: null,
      addressLine: null,
      placeId: null,
    };
  }

  async geocodeAddress({ addressLine, city, state, pincode }) {
    if (!this.isEnabled()) {
      return null;
    }

    const query = [addressLine, city, state, pincode, 'India'].filter(Boolean).join(', ');

    try {
      const url = new URL('https://maps.googleapis.com/maps/api/geocode/json');
      url.searchParams.set('address', query);
      url.searchParams.set('key', this.apiKey);

      const data = await this._fetchJson(url);

      if (data.status !== 'OK' || !data.results?.length) {
        logger.warn({ status: data.status, query }, 'Geocoding failed');
        return null;
      }

      const location = data.results[0].geometry.location;
      return {
        latitude: location.lat,
        longitude: location.lng,
        formattedAddress: data.results[0].formatted_address,
        placeId: data.results[0].place_id,
      };
    } catch (error) {
      logger.warn({ err: error, query }, 'Geocoding request failed');
      return null;
    }
  }

  buildDirectionsUrl({ lat, lng, label = 'Destination' }) {
    if (lat != null && lng != null) {
      return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&destination_place_id=${encodeURIComponent(label)}`;
    }
    return 'https://www.google.com/maps';
  }
}

module.exports = {
  GeocodingService,
};
