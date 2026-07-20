const { BaseService } = require('../../core/BaseService');
const config = require('../../config');
const { logger } = require('../../utils/logger');

class GeocodingService extends BaseService {
  constructor() {
    super();
    this.apiKey = config.maps?.apiKey || null;
  }

  isEnabled() {
    return Boolean(this.apiKey);
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

      const response = await fetch(url);
      const data = await response.json();

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
      logger.error({ err: error }, 'Geocoding request failed');
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
