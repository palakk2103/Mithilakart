const { RoutingService } = require('../../../../src/services/maps/RoutingService');
const { SellerRankingService } = require('../../../../src/services/fulfillment/SellerRankingService');
const { FulfillmentConfigService } = require('../../../../src/services/fulfillment/FulfillmentConfigService');
const { DEFAULT_SELLER_RANKING_WEIGHTS } = require('../../../../src/constants/platformSettings');

const DELHI = { lat: 28.6139, lng: 77.2090 };
const NEARBY = { lat: 28.6200, lng: 77.2150 };

const CONFIG = {
  sellerSearchRadiusKm: 10,
  routingProviderEnabled: false,
  routingFallbackSpeedKmph: 18,
  defaultPreparationTimeMinutes: 5,
  deliveryBufferMinutes: 3,
  rankingWeights: DEFAULT_SELLER_RANKING_WEIGHTS,
};

describe('RoutingService', () => {
  afterEach(() => {
    delete global.fetch;
    jest.restoreAllMocks();
  });

  describe('haversine fallback', () => {
    it('estimates an ETA without any provider', async () => {
      const service = new RoutingService();
      const result = await service.getRouteEta({
        origin: DELHI, destination: NEARBY, routingEnabled: false, fallbackSpeedKmph: 18,
      });

      expect(result.source).toBe('haversine');
      expect(result.degraded).toBe(false);
      expect(result.etaMinutes).toBeGreaterThan(0);
      expect(result.distanceKm).toBeGreaterThan(0);
    });

    it('scales the ETA inversely with the configured speed', async () => {
      const service = new RoutingService();
      const slow = await service.getRouteEta({ origin: DELHI, destination: NEARBY, fallbackSpeedKmph: 10 });
      const fast = await service.getRouteEta({ origin: DELHI, destination: NEARBY, fallbackSpeedKmph: 40 });

      expect(slow.etaMinutes).toBeGreaterThan(fast.etaMinutes);
    });

    it('never returns a zero-minute ETA', async () => {
      const service = new RoutingService();
      const result = await service.getRouteEta({ origin: DELHI, destination: DELHI, fallbackSpeedKmph: 18 });
      expect(result.etaMinutes).toBeGreaterThanOrEqual(1);
    });

    it('guards an invalid speed', async () => {
      const service = new RoutingService();
      const result = await service.getRouteEta({ origin: DELHI, destination: NEARBY, fallbackSpeedKmph: 0 });
      expect(result.etaMinutes).toBeGreaterThan(0);
    });

    it('reports unavailable for malformed coordinates rather than throwing', async () => {
      const service = new RoutingService();
      for (const bad of [null, {}, { lat: 'x', lng: 1 }, { lat: 1 }]) {
        const result = await service.getRouteEta({ origin: bad, destination: DELHI });
        expect(result.source).toBe('unavailable');
        expect(result.etaMinutes).toBeNull();
      }
    });
  });

  describe('provider path', () => {
    function withProvider(service) {
      service.apiKey = 'test-key';
      return service;
    }

    it('uses the provider duration when routing is enabled', async () => {
      global.fetch = jest.fn(async () => ({
        ok: true,
        json: async () => ({
          rows: [{ elements: [{ status: 'OK', duration: { value: 720 }, distance: { value: 4200 } }] }],
        }),
      }));

      const service = withProvider(new RoutingService());
      const result = await service.getRouteEta({
        origin: DELHI, destination: NEARBY, routingEnabled: true,
      });

      expect(result.source).toBe('provider');
      expect(result.etaMinutes).toBe(12);
      expect(result.distanceKm).toBe(4.2);
      expect(result.degraded).toBe(false);
    });

    it('prefers duration_in_traffic when present', async () => {
      global.fetch = jest.fn(async () => ({
        ok: true,
        json: async () => ({
          rows: [{ elements: [{
            status: 'OK',
            duration: { value: 600 },
            duration_in_traffic: { value: 900 },
            distance: { value: 4000 },
          }] }],
        }),
      }));

      const service = withProvider(new RoutingService());
      const result = await service.getRouteEta({ origin: DELHI, destination: NEARBY, routingEnabled: true });
      expect(result.etaMinutes).toBe(15);
    });

    it('T-25: degrades to haversine when the provider fails, and never throws', async () => {
      global.fetch = jest.fn(async () => { throw new Error('network down'); });

      const service = withProvider(new RoutingService());
      const result = await service.getRouteEta({
        origin: DELHI, destination: NEARBY, routingEnabled: true, fallbackSpeedKmph: 18,
      });

      expect(result.source).toBe('haversine');
      expect(result.degraded).toBe(true);
      expect(result.etaMinutes).toBeGreaterThan(0);
    });

    it('degrades on a non-OK HTTP status', async () => {
      global.fetch = jest.fn(async () => ({ ok: false, status: 429, json: async () => ({}) }));

      const service = withProvider(new RoutingService());
      const result = await service.getRouteEta({ origin: DELHI, destination: NEARBY, routingEnabled: true });
      expect(result.degraded).toBe(true);
    });

    it('degrades on a ZERO_RESULTS element', async () => {
      global.fetch = jest.fn(async () => ({
        ok: true,
        json: async () => ({ rows: [{ elements: [{ status: 'ZERO_RESULTS' }] }] }),
      }));

      const service = withProvider(new RoutingService());
      const result = await service.getRouteEta({ origin: DELHI, destination: NEARBY, routingEnabled: true });
      expect(result.degraded).toBe(true);
    });

    it('degrades when the element carries no duration', async () => {
      global.fetch = jest.fn(async () => ({
        ok: true,
        json: async () => ({ rows: [{ elements: [{ status: 'OK', distance: { value: 100 } }] }] }),
      }));

      const service = withProvider(new RoutingService());
      const result = await service.getRouteEta({ origin: DELHI, destination: NEARBY, routingEnabled: true });
      expect(result.degraded).toBe(true);
    });

    it('reports a null distance when the provider omits one', async () => {
      global.fetch = jest.fn(async () => ({
        ok: true,
        json: async () => ({ rows: [{ elements: [{ status: 'OK', duration: { value: 300 } }] }] }),
      }));

      const service = withProvider(new RoutingService());
      const result = await service.getRouteEta({ origin: DELHI, destination: NEARBY, routingEnabled: true });
      expect(result.distanceKm).toBeNull();
      expect(result.etaMinutes).toBe(5);
    });

    it('does not call the provider when routing is disabled', async () => {
      global.fetch = jest.fn();
      const service = withProvider(new RoutingService());
      await service.getRouteEta({ origin: DELHI, destination: NEARBY, routingEnabled: false });
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('does not call the provider when no API key is configured', async () => {
      global.fetch = jest.fn();
      const service = new RoutingService();
      service.apiKey = null;
      await service.getRouteEta({ origin: DELHI, destination: NEARBY, routingEnabled: true });
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('caches by rounded coordinates to limit provider cost', async () => {
      global.fetch = jest.fn(async () => ({
        ok: true,
        json: async () => ({
          rows: [{ elements: [{ status: 'OK', duration: { value: 600 }, distance: { value: 3000 } }] }],
        }),
      }));

      const service = withProvider(new RoutingService());
      await service.getRouteEta({ origin: DELHI, destination: NEARBY, routingEnabled: true });
      await service.getRouteEta({ origin: DELHI, destination: NEARBY, routingEnabled: true });

      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    it('evicts the oldest entry when the cache is full', async () => {
      const service = withProvider(new RoutingService());
      for (let i = 0; i < 520; i += 1) {
        service._setCache(`key-${i}`, { etaMinutes: i });
      }
      expect(service._cache.size).toBeLessThanOrEqual(500);
    });

    it('expires a stale cache entry', async () => {
      const service = withProvider(new RoutingService());
      service._setCache('k', { etaMinutes: 1 });
      service._cache.get('k').ts = Date.now() - (10 * 60 * 1000);
      expect(service._getCached('k')).toBeNull();
    });
  });

  describe('composeDeliveryEta — the CR-002 formula', () => {
    it('adds route + preparation + buffer (the CR worked example)', () => {
      const service = new RoutingService();
      // Route 12 + prep 5 + buffer 3 = 20 minutes.
      expect(service.composeDeliveryEta({
        routeEtaMinutes: 12, preparationMinutes: 5, bufferMinutes: 3,
      })).toBe(20);
    });

    it('returns null without a route ETA rather than inventing one', () => {
      const service = new RoutingService();
      expect(service.composeDeliveryEta({ routeEtaMinutes: null, preparationMinutes: 5, bufferMinutes: 3 })).toBeNull();
    });

    it('treats missing preparation and buffer as zero', () => {
      const service = new RoutingService();
      expect(service.composeDeliveryEta({ routeEtaMinutes: 10 })).toBe(10);
    });

    it('rounds up to whole minutes', () => {
      const service = new RoutingService();
      expect(service.composeDeliveryEta({ routeEtaMinutes: 10.2, preparationMinutes: 0.5, bufferMinutes: 0 })).toBe(11);
    });
  });
});

describe('SellerRankingService', () => {
  function candidate(id, overrides = {}) {
    return {
      sellerId: id,
      seller: { _id: id, latitude: 28.61, longitude: 77.20, preparationTimeMinutes: null },
      distanceKm: 5,
      resolvedItems: [{ productId: 'A', quantity: 1, availableStock: 10 }],
      ...overrides,
    };
  }

  function buildService({ workload = null } = {}) {
    const routingService = new RoutingService();
    const orderRepository = workload === null ? null : { count: jest.fn(async () => workload) };
    const platformConfigService = { getConfig: jest.fn(async () => ({})) };
    const fulfillmentConfigService = new FulfillmentConfigService({ platformConfigService });

    return new SellerRankingService({ routingService, orderRepository, fulfillmentConfigService });
  }

  describe('normInv', () => {
    it('is 1 at zero, 0 at the max, and clamps beyond', () => {
      expect(SellerRankingService.normInv(0, 10)).toBe(1);
      expect(SellerRankingService.normInv(10, 10)).toBe(0);
      expect(SellerRankingService.normInv(20, 10)).toBe(0);
      expect(SellerRankingService.normInv(5, 10)).toBe(0.5);
    });

    it('returns 0 for unusable input', () => {
      expect(SellerRankingService.normInv(null, 10)).toBe(0);
      expect(SellerRankingService.normInv(5, 0)).toBe(0);
      expect(SellerRankingService.normInv('x', 10)).toBe(0);
    });
  });

  describe('stockHeadroom', () => {
    it('is the worst ratio across lines, capped at 1', () => {
      expect(SellerRankingService.stockHeadroom([
        { quantity: 1, availableStock: 10 },
        { quantity: 2, availableStock: 2 },
      ])).toBe(1);

      expect(SellerRankingService.stockHeadroom([
        { quantity: 4, availableStock: 2 },
      ])).toBe(0.5);
    });

    it('is 0 for empty or unusable input', () => {
      expect(SellerRankingService.stockHeadroom([])).toBe(0);
      expect(SellerRankingService.stockHeadroom([{ quantity: 1, availableStock: null }])).toBe(0);
    });
  });

  describe('ranking', () => {
    it('is not simply nearest-wins: a closer but depleted seller can lose', async () => {
      const service = buildService();

      const ranked = await service.rank({
        candidates: [
          candidate('near-empty', {
            distanceKm: 1,
            resolvedItems: [{ productId: 'A', quantity: 10, availableStock: 10 }], // headroom 1.0...
            seller: { _id: 'near-empty', latitude: 28.61, longitude: 77.20, preparationTimeMinutes: 60 },
          }),
          candidate('far-fast', {
            distanceKm: 3,
            seller: { _id: 'far-fast', latitude: 28.63, longitude: 77.22, preparationTimeMinutes: 1 },
          }),
        ],
        customerLocation: DELHI,
        config: CONFIG,
      });

      // The far seller's much shorter preparation time outweighs 2 km.
      expect(ranked[0].sellerId).toBe('far-fast');
    });

    it('prefers the closer seller when all else is equal', async () => {
      const service = buildService();
      const ranked = await service.rank({
        candidates: [candidate('far', { distanceKm: 8 }), candidate('near', { distanceKm: 1 })],
        customerLocation: DELHI,
        config: CONFIG,
      });

      expect(ranked[0].sellerId).toBe('near');
    });

    it('breaks ties deterministically by distance then sellerId', async () => {
      const service = buildService();
      const ranked = await service.rank({
        candidates: [candidate('b-seller'), candidate('a-seller')],
        customerLocation: DELHI,
        config: CONFIG,
      });

      expect(ranked.map((r) => r.sellerId)).toEqual(['a-seller', 'b-seller']);
    });

    it('records a per-factor breakdown for admin traceability', async () => {
      const service = buildService();
      const [top] = await service.rank({
        candidates: [candidate('s1')],
        customerLocation: DELHI,
        config: CONFIG,
      });

      expect(top.rankScore).toEqual(expect.any(Number));
      expect(top.rankBreakdown.distance).toEqual(
        expect.objectContaining({ raw: expect.any(Number), weight: expect.any(Number) })
      );
    });

    it('falls back to the configured default preparation time', async () => {
      const service = buildService();
      const [top] = await service.rank({
        candidates: [candidate('s1')],
        customerLocation: DELHI,
        config: CONFIG,
      });

      expect(top.preparationMinutes).toBe(CONFIG.defaultPreparationTimeMinutes);
    });

    it('still ranks when workload tracking is unavailable', async () => {
      const service = buildService({ workload: null });
      const ranked = await service.rank({
        candidates: [candidate('s1')], customerLocation: DELHI, config: CONFIG,
      });

      expect(ranked).toHaveLength(1);
      expect(ranked[0].rankBreakdown.workload).toBeUndefined();
      // The remaining weights must still sum to a usable score.
      expect(ranked[0].rankScore).toBeGreaterThan(0);
    });

    it('incorporates workload when it is available', async () => {
      const service = buildService({ workload: 0 });
      const [top] = await service.rank({
        candidates: [candidate('s1')], customerLocation: DELHI, config: CONFIG,
      });

      expect(top.workload).toBe(0);
      expect(top.rankBreakdown.workload.raw).toBe(1);
    });

    it('survives a workload query failure', async () => {
      const service = buildService({ workload: 0 });
      service.orderRepository.count.mockRejectedValue(new Error('db down'));

      const ranked = await service.rank({
        candidates: [candidate('s1')], customerLocation: DELHI, config: CONFIG,
      });

      expect(ranked).toHaveLength(1);
    });

    it('returns an empty list for no candidates', async () => {
      const service = buildService();
      expect(await service.rank({ candidates: [], customerLocation: DELHI, config: CONFIG })).toEqual([]);
      expect(await service.rank({ candidates: null, customerLocation: DELHI, config: CONFIG })).toEqual([]);
    });

    it('ranks without a routing service wired', async () => {
      const service = new SellerRankingService({});
      const ranked = await service.rank({
        candidates: [candidate('s1')], customerLocation: DELHI, config: CONFIG,
      });

      expect(ranked).toHaveLength(1);
      expect(ranked[0].routeEtaMinutes).toBeNull();
    });

    it('applies an admin ranking boost', async () => {
      const service = buildService();
      const boosted = candidate('boosted', {
        seller: { _id: 'boosted', latitude: 28.61, longitude: 77.20, rankingBoost: 1 },
      });

      const ranked = await service.rank({
        candidates: [boosted, candidate('plain')],
        customerLocation: DELHI,
        config: CONFIG,
      });

      expect(ranked[0].sellerId).toBe('boosted');
    });

    it('honours a zero distance weight as a disabled factor', async () => {
      const service = buildService();
      const weights = { ...DEFAULT_SELLER_RANKING_WEIGHTS, distance: 0 };

      const ranked = await service.rank({
        candidates: [candidate('far', { distanceKm: 9 }), candidate('near', { distanceKm: 1 })],
        customerLocation: DELHI,
        config: { ...CONFIG, rankingWeights: weights },
      });

      expect(ranked[0].rankBreakdown.distance.weight).toBe(0);
    });

    describe('Requirement 4: Price + Distance Seller Ranking (A/B testing)', () => {
      it('scores lower price higher on the price factor', async () => {
        const service = buildService();
        const sellerA = candidate('seller-A', {
          distanceKm: 2,
          resolvedItems: [{ productId: 'A', quantity: 1, unitPrice: 200, availableStock: 10 }],
        });
        const sellerB = candidate('seller-B', {
          distanceKm: 4,
          resolvedItems: [{ productId: 'A', quantity: 1, unitPrice: 100, availableStock: 10 }],
        });

        const ranked = await service.rank({
          candidates: [sellerA, sellerB],
          customerLocation: DELHI,
          config: CONFIG,
        });

        const rankedA = ranked.find((r) => r.sellerId === 'seller-A');
        const rankedB = ranked.find((r) => r.sellerId === 'seller-B');

        expect(rankedB.rankBreakdown.price.raw).toBe(1.0); // lowest price gets top score
        expect(rankedA.rankBreakdown.price.raw).toBe(0.0); // highest price gets bottom score
      });

      it('A/B Test: Nearer seller wins when distance weight dominates, cheaper seller wins when price weight dominates', async () => {
        const service = buildService();
        // Seller A: nearer (2 km), higher price (₹250)
        const sellerA = candidate('seller-A-near-costly', {
          distanceKm: 2,
          resolvedItems: [{ productId: 'A', quantity: 1, unitPrice: 250, availableStock: 10 }],
          seller: { _id: 'seller-A-near-costly', latitude: 28.61, longitude: 77.20, preparationTimeMinutes: 5 },
        });
        // Seller B: farther (7 km), lower price (₹120)
        const sellerB = candidate('seller-B-far-cheap', {
          distanceKm: 7,
          resolvedItems: [{ productId: 'A', quantity: 1, unitPrice: 120, availableStock: 10 }],
          seller: { _id: 'seller-B-far-cheap', latitude: 28.67, longitude: 77.27, preparationTimeMinutes: 5 },
        });

        // Config 1: Admin configures distance dominance (distance: 0.70, price: 0.05)
        const distanceFavoredConfig = {
          ...CONFIG,
          rankingWeights: {
            distance: 0.70,
            price: 0.05,
            routeEta: 0.10,
            preparation: 0.05,
            workload: 0.05,
            availability: 0.05,
          },
        };

        const rankedByDistance = await service.rank({
          candidates: [sellerA, sellerB],
          customerLocation: DELHI,
          config: distanceFavoredConfig,
        });

        // Nearer seller wins under distance-favored configuration
        expect(rankedByDistance[0].sellerId).toBe('seller-A-near-costly');

        // Config 2: Admin switches configuration to price dominance (price: 0.70, distance: 0.05)
        const priceFavoredConfig = {
          ...CONFIG,
          rankingWeights: {
            distance: 0.05,
            price: 0.70,
            routeEta: 0.10,
            preparation: 0.05,
            workload: 0.05,
            availability: 0.05,
          },
        };

        const rankedByPrice = await service.rank({
          candidates: [sellerA, sellerB],
          customerLocation: DELHI,
          config: priceFavoredConfig,
        });

        // Cheaper seller wins under price-favored configuration!
        expect(rankedByPrice[0].sellerId).toBe('seller-B-far-cheap');
      });
    });
  });
});
