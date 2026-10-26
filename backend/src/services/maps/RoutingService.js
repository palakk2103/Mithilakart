const { BaseService } = require('../../core/BaseService');
const config = require('../../config');
const { haversineKm } = require('../../utils/geoHelper');
const { isFiniteNumber, toFiniteNumber } = require('../../utils/numeric');
const { logger } = require('../../utils/logger');

const DEFAULT_TIMEOUT_MS = 5000;
const CACHE_MAX = 500;
const CACHE_TTL_MS = 5 * 60 * 1000;

/**
 * CR-002 — route ETA between two points.
 *
 * Extends the existing maps layer rather than adding a parallel location
 * architecture: same `config.maps.apiKey`, same timeout convention, same
 * coordinate-keyed TTL cache as GeocodingService, and the existing
 * `utils/geoHelper.haversineKm` for the fallback.
 *
 * NEVER throws. A routing outage must degrade the ETA's accuracy, not fail the
 * order — so every failure path falls back to a haversine estimate and the
 * caller is told which source was used.
 */
class RoutingService extends BaseService {
  constructor({ platformConfigService = null } = {}) {
    super();
    this.apiKey = config.maps?.apiKey || null;
    this.timeoutMs = Number(config.maps?.timeoutMs) || DEFAULT_TIMEOUT_MS;
    this.platformConfigService = platformConfigService;
    this._cache = new Map();
  }

  isProviderAvailable() {
    return Boolean(this.apiKey);
  }

  _cacheKey(origin, destination) {
    // Round to ~100 m. Finer precision would make the cache useless without
    // meaningfully improving the estimate.
    const r = (n) => Number(n).toFixed(3);
    return `${r(origin.lat)},${r(origin.lng)}|${r(destination.lat)},${r(destination.lng)}`;
  }

  _getCached(key) {
    const entry = this._cache.get(key);
    if (!entry) return null;
    if (Date.now() - entry.ts > CACHE_TTL_MS) {
      this._cache.delete(key);
      return null;
    }
    return entry.data;
  }

  _setCache(key, data) {
    if (this._cache.size >= CACHE_MAX) {
      const oldest = this._cache.keys().next().value;
      this._cache.delete(oldest);
    }
    this._cache.set(key, { data, ts: Date.now() });
  }

  _validCoords(point) {
    return Boolean(point)
      && Number.isFinite(Number(point.lat))
      && Number.isFinite(Number(point.lng));
  }

  /**
   * Straight-line distance converted to minutes at a configured average speed.
   * Deliberately simple and dependency-free — this is the path that keeps
   * fulfillment working when the routing provider is off or unreachable.
   */
  estimateByHaversine(origin, destination, speedKmph) {
    const distanceKm = haversineKm(origin.lat, origin.lng, destination.lat, destination.lng);
    const parsedSpeed = toFiniteNumber(speedKmph, 0);
    const speed = parsedSpeed > 0 ? parsedSpeed : 18;
    const minutes = (distanceKm / speed) * 60;

    return {
      distanceKm: Number(distanceKm.toFixed(3)),
      etaMinutes: Math.max(1, Math.ceil(minutes)),
      source: 'haversine',
    };
  }

  async _fetchGoogleMatrix(origin, destination) {
    const url = 'https://maps.googleapis.com/maps/api/distancematrix/json'
      + `?origins=${origin.lat},${origin.lng}`
      + `&destinations=${destination.lat},${destination.lng}`
      + '&mode=driving&departure_time=now'
      + `&key=${this.apiKey}`;

    const response = await fetch(url, { signal: AbortSignal.timeout(this.timeoutMs) });
    if (!response.ok) throw new Error(`Distance Matrix HTTP ${response.status}`);

    const body = await response.json();
    const element = body?.rows?.[0]?.elements?.[0];
    if (!element || element.status !== 'OK') {
      throw new Error(`Distance Matrix element status ${element?.status || 'MISSING'}`);
    }

    const seconds = element.duration_in_traffic?.value ?? element.duration?.value;
    const meters = element.distance?.value;
    if (!Number.isFinite(seconds)) throw new Error('Distance Matrix returned no duration');

    return {
      distanceKm: Number.isFinite(meters) ? Number((meters / 1000).toFixed(3)) : null,
      etaMinutes: Math.max(1, Math.ceil(seconds / 60)),
      source: 'provider',
    };
  }

  /**
   * Route ETA in minutes.
   *
   * Returns `{ distanceKm, etaMinutes, source, degraded }`. `degraded` is true
   * whenever the provider was wanted but could not be used, which is what the
   * caller logs as MAP_SERVICE_UNAVAILABLE — a warning, never a thrown error.
   */
  async getRouteEta({ origin, destination, routingEnabled = false, fallbackSpeedKmph = 18, traceId = null }) {
    if (!this._validCoords(origin) || !this._validCoords(destination)) {
      return { distanceKm: null, etaMinutes: null, source: 'unavailable', degraded: true };
    }

    const from = { lat: Number(origin.lat), lng: Number(origin.lng) };
    const to = { lat: Number(destination.lat), lng: Number(destination.lng) };

    if (!routingEnabled || !this.isProviderAvailable()) {
      // Not an error: routing is off by default so CR-002 ships without
      // incurring Distance Matrix cost or latency on the checkout path.
      return { ...this.estimateByHaversine(from, to, fallbackSpeedKmph), degraded: false };
    }

    const key = this._cacheKey(from, to);
    const cached = this._getCached(key);
    if (cached) return { ...cached, degraded: false };

    try {
      const result = await this._fetchGoogleMatrix(from, to);
      this._setCache(key, result);
      return { ...result, degraded: false };
    } catch (error) {
      logger.warn({ err: error, traceId }, 'CR-002 routing provider unavailable — falling back to haversine');
      return { ...this.estimateByHaversine(from, to, fallbackSpeedKmph), degraded: true };
    }
  }

  /**
   * The CR-002 ETA formula:
   *   routeETA + sellerPreparation + operationalBuffer
   *
   * Every term is configuration or measurement. Nothing here is a hardcoded
   * delivery time.
   */
  composeDeliveryEta({ routeEtaMinutes, preparationMinutes, bufferMinutes }) {
    // Number(null) is 0 and passes Number.isFinite, so an absent route ETA
    // would otherwise be reported as prep + buffer rather than "unknown".
    if (!isFiniteNumber(routeEtaMinutes)) return null;

    const route = Number(routeEtaMinutes);
    const prep = toFiniteNumber(preparationMinutes, 0);
    const buffer = toFiniteNumber(bufferMinutes, 0);

    return Math.max(1, Math.ceil(route + prep + buffer));
  }
}

module.exports = { RoutingService };
