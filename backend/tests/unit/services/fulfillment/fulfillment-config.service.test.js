const { FulfillmentConfigService } = require('../../../../src/services/fulfillment/FulfillmentConfigService');
const {
  DEFAULT_PLATFORM_SETTINGS,
  DEFAULT_SELLER_RANKING_WEIGHTS,
  DEFAULT_PARTNER_RANKING_WEIGHTS,
} = require('../../../../src/constants/platformSettings');

function buildService({ platform = {}, tabConfig = undefined } = {}) {
  const platformConfigService = {
    getConfig: jest.fn(async () => ({ ...DEFAULT_PLATFORM_SETTINGS, ...platform })),
  };
  const marketplaceConfigRepository = {
    findByTab: jest.fn(async () => tabConfig),
  };

  return {
    service: new FulfillmentConfigService({ platformConfigService, marketplaceConfigRepository }),
    platformConfigService,
    marketplaceConfigRepository,
  };
}

describe('FulfillmentConfigService', () => {
  describe('resolution order', () => {
    it('falls back to code defaults when nothing is configured', async () => {
      const { service } = buildService();
      const config = await service.resolve('quick_shop');

      // The CR's 30-second discovery window — configurable, not hardcoded.
      expect(config.searchTimeoutSeconds).toBe(30);
      expect(config.sellerAcceptanceTimeoutSeconds).toBe(120);
      expect(config.sellerSearchRadiusKm).toBe(10);
    });

    it('prefers a platform setting over the code default', async () => {
      const { service } = buildService({ platform: { quickFulfillmentSearchTimeoutSeconds: 45 } });
      const config = await service.resolve('quick_shop');
      expect(config.searchTimeoutSeconds).toBe(45);
    });

    it('prefers a per-tab override over the platform setting', async () => {
      const { service } = buildService({
        platform: { quickFulfillmentSearchTimeoutSeconds: 45 },
        tabConfig: { fulfillmentOverrides: { quickFulfillmentSearchTimeoutSeconds: 12 } },
      });
      const config = await service.resolve('groceries_fresh');
      expect(config.searchTimeoutSeconds).toBe(12);
    });

    it('ignores a null per-tab override and inherits the platform value', async () => {
      const { service } = buildService({
        platform: { sellerSearchRadiusKm: 25 },
        tabConfig: { fulfillmentOverrides: { sellerSearchRadiusKm: null } },
      });
      const config = await service.resolve('quick_shop');
      expect(config.sellerSearchRadiusKm).toBe(25);
    });

    it('honours a false boolean override rather than treating it as absent', async () => {
      const { service } = buildService({
        tabConfig: { fulfillmentOverrides: { warehouseFallbackEnabled: false } },
      });
      const config = await service.resolve('quick_shop');
      expect(config.warehouseFallbackEnabled).toBe(false);
    });

    it('still resolves when the tab config lookup throws', async () => {
      const { service, marketplaceConfigRepository } = buildService();
      marketplaceConfigRepository.findByTab.mockRejectedValue(new Error('db down'));

      const config = await service.resolve('quick_shop');
      expect(config.searchTimeoutSeconds).toBe(30);
    });
  });

  describe('range clamping', () => {
    it('clamps an out-of-range timeout to the allowed maximum', async () => {
      const { service } = buildService({ platform: { quickFulfillmentSearchTimeoutSeconds: 99999 } });
      const config = await service.resolve(null);
      expect(config.searchTimeoutSeconds).toBe(300);
    });

    it('clamps a negative radius to the allowed minimum', async () => {
      const { service } = buildService({ platform: { sellerSearchRadiusKm: -5 } });
      const config = await service.resolve(null);
      expect(config.sellerSearchRadiusKm).toBe(1);
    });

    it('falls back to the default when the value is not numeric', async () => {
      const { service } = buildService({ platform: { sellerAcceptanceTimeoutSeconds: 'soon' } });
      const config = await service.resolve(null);
      expect(config.sellerAcceptanceTimeoutSeconds).toBe(120);
    });
  });

  describe('ship defaults preserve pre-CR-002 behaviour', () => {
    it('ships dark: broadcast delivery, no substitution, routing off', async () => {
      const { service } = buildService();
      const config = await service.resolve('quick_shop');

      expect(config.deliveryAssignmentMode).toBe('broadcast');
      expect(config.crossSellerSubstitutionEnabled).toBe(false);
      expect(config.routingProviderEnabled).toBe(false);
    });

    it('rejects an unknown delivery assignment mode', async () => {
      const { service } = buildService({ platform: { deliveryAssignmentMode: 'telepathy' } });
      const config = await service.resolve(null);
      expect(config.deliveryAssignmentMode).toBe('broadcast');
    });
  });

  describe('boolean coercion', () => {
    it('accepts stringified booleans as stored by a generic settings write', async () => {
      const { service: on } = buildService({ platform: { warehouseFallbackEnabled: 'false' } });
      expect((await on.resolve(null)).warehouseFallbackEnabled).toBe(false);

      const { service: off } = buildService({ platform: { crossSellerSubstitutionEnabled: 'true' } });
      expect((await off.resolve(null)).crossSellerSubstitutionEnabled).toBe(true);
    });

    it('falls back to the code default for an uninterpretable boolean', async () => {
      const { service } = buildService({ platform: { courierFallbackEnabled: 'maybe' } });
      expect((await service.resolve(null)).courierFallbackEnabled).toBe(true);
    });

    it('falls back to the code default when the platform value is null', async () => {
      const { service } = buildService({ platform: { sellerSearchRadiusKm: null } });
      expect((await service.resolve(null)).sellerSearchRadiusKm).toBe(10);
    });
  });

  describe('normalizeWeights', () => {
    it('returns defaults unchanged (they already sum to 1)', () => {
      const { service } = buildService();
      const weights = service.normalizeWeights(DEFAULT_SELLER_RANKING_WEIGHTS);
      const total = Object.values(weights).reduce((a, b) => a + b, 0);
      expect(total).toBeCloseTo(1, 6);
    });

    it('renormalises a partial admin edit instead of silently rescaling', () => {
      const { service } = buildService();
      // Admin bumps distance to 0.9 and leaves everything else alone.
      const weights = service.normalizeWeights({ ...DEFAULT_SELLER_RANKING_WEIGHTS, distance: 0.9 });
      const total = Object.values(weights).reduce((a, b) => a + b, 0);

      expect(total).toBeCloseTo(1, 6);
      expect(weights.distance).toBeGreaterThan(DEFAULT_SELLER_RANKING_WEIGHTS.distance);
    });

    it('treats a zero weight as a disabled factor', () => {
      const { service } = buildService();
      const weights = service.normalizeWeights({ ...DEFAULT_SELLER_RANKING_WEIGHTS, workload: 0 });
      expect(weights.workload).toBe(0);
      expect(Object.values(weights).reduce((a, b) => a + b, 0)).toBeCloseTo(1, 6);
    });

    it('falls back to defaults when every weight is zero', () => {
      const { service } = buildService();
      const weights = service.normalizeWeights({
        distance: 0, routeEta: 0, preparation: 0, workload: 0, availability: 0, adminBoost: 0,
      });
      expect(weights).toEqual(DEFAULT_SELLER_RANKING_WEIGHTS);
    });

    it('ignores negative and non-numeric weights', () => {
      const { service } = buildService();
      const weights = service.normalizeWeights({ distance: -1, routeEta: 'fast', preparation: 1 });
      expect(weights.distance).toBe(0);
      expect(weights.routeEta).toBe(0);
      expect(weights.preparation).toBeCloseTo(1, 6);
    });
  });

  describe('partnerRankingWeights (DB-backed, mirrors sellerRankingWeights)', () => {
    it('exposes normalised code defaults when nothing is configured', async () => {
      const { service } = buildService();
      const config = await service.resolve(null);

      expect(config.partnerRankingWeights).toEqual(DEFAULT_PARTNER_RANKING_WEIGHTS);
      const total = Object.values(config.partnerRankingWeights).reduce((a, b) => a + b, 0);
      expect(total).toBeCloseTo(1, 6);
    });

    it('prefers an admin-set platform setting over the code default', async () => {
      const { service } = buildService({
        platform: { partnerRankingWeights: { ...DEFAULT_PARTNER_RANKING_WEIGHTS, pickupDistance: 0.9 } },
      });
      const config = await service.resolve(null);

      expect(config.partnerRankingWeights.pickupDistance).toBeGreaterThan(DEFAULT_PARTNER_RANKING_WEIGHTS.pickupDistance);
      const total = Object.values(config.partnerRankingWeights).reduce((a, b) => a + b, 0);
      expect(total).toBeCloseTo(1, 6);
    });

    it('normalizeWeights uses the partner factor set, not the seller one, when given partner defaults', () => {
      const { service } = buildService();
      const weights = service.normalizeWeights(
        { ...DEFAULT_PARTNER_RANKING_WEIGHTS, workload: 0 },
        DEFAULT_PARTNER_RANKING_WEIGHTS
      );

      expect(weights.workload).toBe(0);
      expect(Object.keys(weights)).toEqual(Object.keys(DEFAULT_PARTNER_RANKING_WEIGHTS));
      expect(Object.values(weights).reduce((a, b) => a + b, 0)).toBeCloseTo(1, 6);
    });

    it('is included in the order snapshot, same as seller ranking weights', async () => {
      const { service } = buildService();
      const resolved = await service.resolve('quick_shop');
      const snapshot = service.buildSnapshot(resolved);

      expect(snapshot.partnerRankingWeights).toEqual(resolved.partnerRankingWeights);
    });
  });

  describe('redistributeWeights', () => {
    it('redistributes an unavailable factor across the rest rather than zeroing it', () => {
      const { service } = buildService();
      const base = service.normalizeWeights(DEFAULT_SELLER_RANKING_WEIGHTS);

      // Workload tracking unavailable — its share must go to the others, not
      // flatten every candidate equally.
      const available = ['distance', 'routeEta', 'preparation', 'availability', 'adminBoost'];
      const result = service.redistributeWeights(base, available);

      expect(result.workload).toBeUndefined();
      expect(Object.values(result).reduce((a, b) => a + b, 0)).toBeCloseTo(1, 6);
      expect(result.distance).toBeGreaterThan(base.distance);
    });

    it('returns empty when no factor is available', () => {
      const { service } = buildService();
      expect(service.redistributeWeights(DEFAULT_SELLER_RANKING_WEIGHTS, [])).toEqual({});
    });
  });

  describe('buildSnapshot', () => {
    it('captures the rules actually applied, so later config edits cannot rewrite history', async () => {
      const { service } = buildService({ platform: { deliveryBufferMinutes: 7 } });
      const resolved = await service.resolve('quick_shop');
      const snapshot = service.buildSnapshot(resolved, { commissionRate: 0.12 });

      expect(snapshot.deliveryBufferMinutes).toBe(7);
      expect(snapshot.commissionRate).toBe(0.12);
      expect(snapshot.rankingWeights).toEqual(resolved.rankingWeights);
      expect(snapshot.resolvedAt).toEqual(expect.any(String));
    });

    it('is a detached copy — mutating the snapshot cannot affect live config', async () => {
      const { service } = buildService();
      const resolved = await service.resolve('quick_shop');
      const snapshot = service.buildSnapshot(resolved);

      snapshot.searchTimeoutSeconds = 1;
      expect(resolved.searchTimeoutSeconds).toBe(30);
    });
  });
});
