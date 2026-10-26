const { AdminFulfillmentService } = require('../../../src/services/admin/AdminFulfillmentService');
const { FulfillmentConfigService } = require('../../../src/services/fulfillment/FulfillmentConfigService');
const { DEFAULT_PLATFORM_SETTINGS } = require('../../../src/constants/platformSettings');

function build({ stored = {}, fulfillments = [], attempts = [], assignment = null } = {}) {
  const settings = { ...stored };

  const platformConfigService = {
    getConfig: jest.fn(async () => ({ ...DEFAULT_PLATFORM_SETTINGS, ...settings })),
  };
  const fulfillmentConfigService = new FulfillmentConfigService({ platformConfigService });

  const adminPlatformSettingsService = {
    updateSettings: jest.fn(async (updates) => {
      Object.assign(settings, updates);
      return Object.keys(updates);
    }),
  };

  const orderFulfillmentRepository = {
    listForAdmin: jest.fn(async () => fulfillments),
    count: jest.fn(async () => fulfillments.length),
    findByOrderId: jest.fn(async (id) => fulfillments.find((f) => String(f.orderId) === String(id)) || null),
  };

  const fulfillmentAttemptRepository = {
    listByFulfillment: jest.fn(async () => attempts),
  };

  const orderRepository = {
    find: jest.fn(async () => [{ _id: 'order-1', orderNumber: 'MK-1' }]),
    findById: jest.fn(async () => ({
      _id: 'order-1', orderNumber: 'MK-1', status: 'placed', paymentStatus: 'paid', total: 500,
    })),
  };

  const deliveryAssignmentRepository = {
    findByOrderId: jest.fn(async () => assignment),
  };

  const auditService = { log: jest.fn(async () => ({})) };

  const fulfillmentEngineService = {
    attemptNext: jest.fn(async () => ({ state: 'searching' })),
    forceCourier: jest.fn(async () => ({ state: 'courier_assigned' })),
  };

  return {
    service: new AdminFulfillmentService({
      adminPlatformSettingsService,
      fulfillmentConfigService,
      orderFulfillmentRepository,
      fulfillmentAttemptRepository,
      orderRepository,
      deliveryAssignmentRepository,
      fulfillmentEngineService,
      auditService,
    }),
    adminPlatformSettingsService,
    auditService,
    fulfillmentEngineService,
    settings,
  };
}

describe('CR-002 P11 — AdminFulfillmentService', () => {
  describe('validation', () => {
    it('accepts valid numeric, boolean, mode and weight settings', () => {
      const { service } = build();

      const clean = service.validate({
        quickFulfillmentSearchTimeoutSeconds: 45,
        warehouseFallbackEnabled: false,
        deliveryAssignmentMode: 'ranked',
        sellerRankingWeights: { distance: 0.5, routeEta: 0.5 },
      });

      expect(clean.quickFulfillmentSearchTimeoutSeconds).toBe(45);
      expect(clean.warehouseFallbackEnabled).toBe(false);
      expect(clean.deliveryAssignmentMode).toBe('ranked');
    });

    it('rejects an out-of-range value rather than silently clamping it', () => {
      const { service } = build();

      // Clamping would leave the admin believing 99999 was applied.
      expect(() => service.validate({ quickFulfillmentSearchTimeoutSeconds: 99999 }))
        .toThrow(/Invalid fulfillment settings/);

      try {
        service.validate({ quickFulfillmentSearchTimeoutSeconds: 99999 });
      } catch (err) {
        expect(err.details[0]).toMatchObject({
          field: 'quickFulfillmentSearchTimeoutSeconds',
          message: expect.stringContaining('between 5 and 300'),
        });
      }
    });

    it('rejects a non-numeric value for a numeric setting', () => {
      const { service } = build();
      expect(() => service.validate({ sellerSearchRadiusKm: 'far' })).toThrow();
      // null must not slip through as 0.
      expect(() => service.validate({ sellerSearchRadiusKm: null })).toThrow();
    });

    it('rejects a non-boolean for a boolean setting', () => {
      const { service } = build();
      expect(() => service.validate({ warehouseFallbackEnabled: 'yes' })).toThrow();
    });

    it('rejects an unknown delivery assignment mode', () => {
      const { service } = build();
      expect(() => service.validate({ deliveryAssignmentMode: 'telepathy' })).toThrow();
    });

    it('rejects a key that is not a fulfillment setting', () => {
      const { service } = build();
      expect(() => service.validate({ somethingElse: 1 })).toThrow(/Invalid fulfillment settings/);
    });

    it('rejects an unknown ranking factor and an out-of-range weight', () => {
      const { service } = build();
      expect(() => service.validate({ sellerRankingWeights: { madeUp: 0.5 } })).toThrow();
      expect(() => service.validate({ sellerRankingWeights: { distance: 5 } })).toThrow();
    });

    it('rejects all-zero ranking weights', () => {
      const { service } = build();
      expect(() => service.validate({ sellerRankingWeights: { distance: 0, routeEta: 0 } })).toThrow();
    });

    it('accepts valid partnerRankingWeights, mirroring sellerRankingWeights', () => {
      const { service } = build();
      const clean = service.validate({ partnerRankingWeights: { pickupDistance: 0.6, workload: 0.4 } });
      expect(clean.partnerRankingWeights).toEqual({ pickupDistance: 0.6, workload: 0.4 });
    });

    it('rejects an unknown partner ranking factor and an out-of-range weight', () => {
      const { service } = build();
      expect(() => service.validate({ partnerRankingWeights: { madeUp: 0.5 } })).toThrow();
      expect(() => service.validate({ partnerRankingWeights: { pickupDistance: 5 } })).toThrow();
    });

    it('rejects all-zero partner ranking weights', () => {
      const { service } = build();
      expect(() => service.validate({ partnerRankingWeights: { pickupDistance: 0, workload: 0 } })).toThrow();
    });

    it('rejects an empty or malformed payload', () => {
      const { service } = build();
      expect(() => service.validate({})).toThrow(/No settings provided/);
      expect(() => service.validate(null)).toThrow(/must be an object/);
      expect(() => service.validate([1, 2])).toThrow(/must be an object/);
    });

    it('validates reused commercial settings too', () => {
      const { service } = build();
      expect(service.validate({ platformFee: 10 }).platformFee).toBe(10);
      expect(() => service.validate({ platformFee: -1 })).toThrow();
    });
  });

  describe('getSettings', () => {
    it('returns effective config plus the ranges the UI needs', async () => {
      const { service } = build();
      const result = await service.getSettings();

      expect(result.settings.searchTimeoutSeconds).toBe(30);
      expect(result.ranges.quickFulfillmentSearchTimeoutSeconds).toEqual({ min: 5, max: 300 });
      expect(result.deliveryAssignmentModes).toContain('broadcast');
      expect(result.rankingFactors).toContain('distance');
      expect(result.partnerRankingFactors).toContain('pickupDistance');
      expect(result.settings.partnerRankingWeights).toBeDefined();
    });
  });

  describe('updateSettings', () => {
    it('writes through the existing settings service, not a new store', async () => {
      const { service, adminPlatformSettingsService } = build();

      const result = await service.updateSettings(
        { quickFulfillmentSearchTimeoutSeconds: 60 }, 'admin-1'
      );

      expect(adminPlatformSettingsService.updateSettings).toHaveBeenCalledWith(
        { quickFulfillmentSearchTimeoutSeconds: 60 }, 'admin-1'
      );
      expect(result.settings.searchTimeoutSeconds).toBe(60);
    });

    it('audits the change with before and after values', async () => {
      const { service, auditService } = build();

      await service.updateSettings({ deliveryBufferMinutes: 8 }, 'admin-1');

      expect(auditService.log).toHaveBeenCalledWith(expect.objectContaining({
        adminId: 'admin-1',
        action: 'fulfillment.settings.update',
        metadata: expect.objectContaining({
          changes: { deliveryBufferMinutes: { from: 3, to: 8 } },
        }),
      }));
    });

    it('writes nothing when validation fails', async () => {
      const { service, adminPlatformSettingsService } = build();

      await expect(service.updateSettings({ sellerSearchRadiusKm: 9999 }, 'admin-1')).rejects.toThrow();
      expect(adminPlatformSettingsService.updateSettings).not.toHaveBeenCalled();
    });
  });

  describe('monitoring', () => {
    const fulfillment = {
      _id: 'ful-1',
      orderId: 'order-1',
      state: 'failed',
      marketplaceTab: 'quick_shop',
      attemptCount: 3,
      fallbackLevel: 3,
      failureCode: 'COURIER_UNAVAILABLE',
      traceId: 'trace-xyz',
      excludedSellerIds: ['s1', 's2'],
      configSnapshot: { deliveryBufferMinutes: 3 },
    };

    it('lists fulfillments with their diagnostic fields', async () => {
      const { service } = build({ fulfillments: [fulfillment] });
      const result = await service.listFulfillments({});

      expect(result.items[0]).toMatchObject({
        orderId: 'order-1',
        state: 'failed',
        failureCode: 'COURIER_UNAVAILABLE',
        traceId: 'trace-xyz',
        excludedSellerCount: 2,
      });
    });

    it('answers "why did this order go to courier" without server logs', async () => {
      const attempts = [
        {
          attemptNumber: 1, kind: 'seller', status: 'reservation_failed', sellerId: 's1',
          failureCode: 'SELLER_INSUFFICIENT_QUANTITY', rankScore: 0.8,
          rankBreakdown: { distance: { raw: 0.9 } }, reservations: [],
        },
        {
          attemptNumber: 2, kind: 'warehouse', status: 'reservation_failed', sellerId: 'wh1',
          failureCode: 'SELLER_MISSING_PRODUCT', reservations: [],
        },
        {
          attemptNumber: 3, kind: 'courier', status: 'reservation_failed',
          failureCode: 'COURIER_UNAVAILABLE', failureDetail: 'Shiprocket 503', reservations: [],
        },
      ];

      const { service } = build({ fulfillments: [fulfillment], attempts });
      const detail = await service.getFulfillmentDetail('order-1');

      expect(detail.fulfillment.traceId).toBe('trace-xyz');
      expect(detail.attempts).toHaveLength(3);
      expect(detail.attempts.map((a) => a.failureCode)).toEqual([
        'SELLER_INSUFFICIENT_QUANTITY', 'SELLER_MISSING_PRODUCT', 'COURIER_UNAVAILABLE',
      ]);
      expect(detail.attempts[0].rankBreakdown).toBeTruthy();
      expect(detail.configSnapshot).toEqual({ deliveryBufferMinutes: 3 });
    });

    it('includes the delivery assignment state', async () => {
      const { service } = build({
        fulfillments: [fulfillment],
        assignment: {
          _id: 'a1', status: 'assigned', partnerId: null,
          offeredTo: ['p1'], rejectedBy: ['p2'], offerRound: 2,
        },
      });

      const detail = await service.getFulfillmentDetail('order-1');

      expect(detail.deliveryAssignment).toMatchObject({
        status: 'assigned', offeredTo: ['p1'], rejectedBy: ['p2'], offerRound: 2,
      });
    });

    it('degrades rather than failing when the assignment lookup errors', async () => {
      const { service } = build({ fulfillments: [fulfillment] });
      service.deliveryAssignmentRepository.findByOrderId = async () => { throw new Error('db down'); };

      const detail = await service.getFulfillmentDetail('order-1');
      expect(detail.deliveryAssignment).toBeNull();
      expect(detail.fulfillment).toBeTruthy();
    });

    it('404s for an order with no fulfillment record', async () => {
      const { service } = build({ fulfillments: [] });
      await expect(service.getFulfillmentDetail('nope')).rejects.toMatchObject({ code: 'NOT_FOUND' });
    });
  });

  describe('operator actions', () => {
    const failed = { _id: 'ful-1', orderId: 'order-1', state: 'failed', traceId: 't' };
    const live = { _id: 'ful-2', orderId: 'order-2', state: 'seller_assigned', traceId: 't' };

    it('retries a failed fulfillment and audits it', async () => {
      const { service, auditService, fulfillmentEngineService } = build({ fulfillments: [failed] });

      const result = await service.retryFulfillment('order-1', 'admin-1');

      expect(result.retried).toBe(true);
      expect(fulfillmentEngineService.attemptNext).toHaveBeenCalledWith('ful-1');
      expect(auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'fulfillment.retry' })
      );
    });

    it('refuses to retry a live fulfillment, so it cannot double-reserve', async () => {
      const { service, fulfillmentEngineService } = build({ fulfillments: [live] });

      await expect(service.retryFulfillment('order-2', 'admin-1'))
        .rejects.toMatchObject({ code: 'CONFLICT' });
      expect(fulfillmentEngineService.attemptNext).not.toHaveBeenCalled();
    });

    it('forces courier fallback and audits it', async () => {
      const { service, auditService, fulfillmentEngineService } = build({ fulfillments: [live] });

      const result = await service.forceCourier('order-2', 'admin-1');

      expect(result.forced).toBe(true);
      expect(fulfillmentEngineService.forceCourier).toHaveBeenCalledWith('order-2');
      expect(auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'fulfillment.force_courier' })
      );
    });

    it('404s when the order has no fulfillment record', async () => {
      const { service } = build({ fulfillments: [] });
      await expect(service.retryFulfillment('nope', 'a')).rejects.toMatchObject({ code: 'NOT_FOUND' });
      await expect(service.forceCourier('nope', 'a')).rejects.toMatchObject({ code: 'NOT_FOUND' });
    });
  });
});
