/**
 * CR-002 P9 — ranked delivery partner offers.
 *
 * The in-memory assignment repository below reproduces the guard conditions of
 * the real conditional updates (partnerId null, offer live, offeredTo match),
 * so "only one partner ends up owning the assignment" is genuinely exercised
 * rather than assumed.
 */
jest.mock('../../../src/database', () => ({
  withTransaction: (callback) => callback(null),
}));

const { DeliveryOrderService } = require('../../../src/services/delivery/DeliveryOrderService');
const { DeliveryPartnerRankingService } = require('../../../src/services/fulfillment/DeliveryPartnerRankingService');
const { FulfillmentSweeper } = require('../../../src/services/fulfillment/FulfillmentSweeper');
const { ASSIGNMENT_STATUS } = require('../../../src/constants/delivery');
const { ORDER_STATUS } = require('../../../src/constants/commerce');
const { haversineKm } = require('../../../src/utils/geoHelper');

const PICKUP = { lat: 28.6139, lng: 77.2090 };

function buildContext({ mode = 'ranked', partners = [], timeoutSeconds = 60 } = {}) {
  const orderId = 'order-1';
  const sellerId = 'seller-1';

  const order = {
    _id: orderId,
    userId: 'user-1',
    orderNumber: 'MK-P9',
    status: ORDER_STATUS.PACKED,
    marketplaceTab: 'quick_shop',
    fulfillment: { sellerId },
    sellerSubOrders: [{ sellerId }],
    addressSnapshot: { lat: 28.62, lng: 77.22, pincode: '110001' },
  };

  const assignment = {
    _id: 'assign-1',
    orderId,
    partnerId: null,
    status: ASSIGNMENT_STATUS.PENDING,
    offeredTo: [],
    rejectedBy: [],
    offerExpiresAt: null,
    offerRound: 0,
    earningAmount: 50,
    deletedAt: null,
  };

  const partnerStore = new Map(partners.map((p) => [String(p._id), p]));

  const deliveryPartnerRepository = {
    findById: jest.fn(async (id) => partnerStore.get(String(id)) || null),
    updateById: jest.fn(async (id, data) => Object.assign(partnerStore.get(String(id)), data)),
    findNearbyOnline: jest.fn(async ({ latitude, longitude, maxDistanceMeters }) => [...partnerStore.values()]
      .filter((p) => p.status === 'approved' && p.isOnline && p.latitude != null)
      .map((p) => ({ ...p, _d: haversineKm(latitude, longitude, p.latitude, p.longitude) }))
      .filter((p) => p._d * 1000 <= maxDistanceMeters)
      .sort((a, b) => a._d - b._d)),
    model: { findByIdAndUpdate: jest.fn(async () => ({})) },
  };

  const deliveryAssignmentRepository = {
    findByOrderId: jest.fn(async () => assignment),
    countByPartner: jest.fn(async (partnerId) => partnerStore.get(String(partnerId))?.activeCount ?? 0),
    findByPartner: jest.fn(async () => []),
    findAvailable: jest.fn(async () => []),
    create: jest.fn(async (data) => Object.assign(assignment, data)),

    updateById: jest.fn(async (id, data) => {
      const { $addToSet, ...rest } = data;
      Object.assign(assignment, rest);
      if ($addToSet?.rejectedBy) {
        const v = String($addToSet.rejectedBy);
        if (!assignment.rejectedBy.map(String).includes(v)) assignment.rejectedBy.push(v);
      }
      return assignment;
    }),

    // Guards mirror the real conditional update.
    offerToPartner: jest.fn(async (oid, partnerId, expiresAt) => {
      if (assignment.partnerId) return null;
      if (![ASSIGNMENT_STATUS.PENDING, ASSIGNMENT_STATUS.ASSIGNED].includes(assignment.status)) return null;
      assignment.status = ASSIGNMENT_STATUS.ASSIGNED;
      assignment.offerExpiresAt = expiresAt;
      assignment.offerRound += 1;
      if (!assignment.offeredTo.map(String).includes(String(partnerId))) {
        assignment.offeredTo.push(String(partnerId));
      }
      return assignment;
    }),

    acceptOfferByPartner: jest.fn(async (oid, partnerId, now = new Date()) => {
      if (assignment.partnerId) return null;
      if (assignment.status !== ASSIGNMENT_STATUS.ASSIGNED) return null;
      if (!assignment.offeredTo.map(String).includes(String(partnerId))) return null;
      if (!assignment.offerExpiresAt || new Date(assignment.offerExpiresAt) <= now) return null;
      assignment.partnerId = partnerId;
      assignment.status = ASSIGNMENT_STATUS.ACCEPTED;
      assignment.acceptedAt = new Date();
      assignment.offerExpiresAt = null;
      return assignment;
    }),

    acceptByOrderId: jest.fn(async (oid, partnerId) => {
      if (assignment.partnerId) return null;
      if (![ASSIGNMENT_STATUS.PENDING, ASSIGNMENT_STATUS.ASSIGNED].includes(assignment.status)) return null;
      assignment.partnerId = partnerId;
      assignment.status = ASSIGNMENT_STATUS.ACCEPTED;
      return assignment;
    }),

    withdrawOffer: jest.fn(async (oid, partnerId, { reason } = {}) => {
      if (assignment.partnerId) return null;
      if (assignment.status !== ASSIGNMENT_STATUS.ASSIGNED) return null;
      if (!assignment.offeredTo.map(String).includes(String(partnerId))) return null;
      assignment.status = ASSIGNMENT_STATUS.PENDING;
      assignment.offerExpiresAt = null;
      assignment.rejectReason = reason || null;
      if (!assignment.rejectedBy.map(String).includes(String(partnerId))) {
        assignment.rejectedBy.push(String(partnerId));
      }
      return assignment;
    }),

    expireOffer: jest.fn(async (id, expiresAt) => {
      if (assignment.partnerId) return null;
      if (assignment.status !== ASSIGNMENT_STATUS.ASSIGNED) return null;
      if (String(assignment.offerExpiresAt) !== String(expiresAt)) return null;
      assignment.status = ASSIGNMENT_STATUS.PENDING;
      assignment.offerExpiresAt = null;
      return assignment;
    }),

    findExpiredOffers: jest.fn(async (now = new Date()) => (
      !assignment.partnerId
        && assignment.status === ASSIGNMENT_STATUS.ASSIGNED
        && assignment.offerExpiresAt
        && new Date(assignment.offerExpiresAt) < now
        ? [assignment] : []
    )),
  };

  const fulfillmentConfigService = {
    resolve: jest.fn(async () => ({
      deliveryAssignmentMode: mode,
      deliveryPartnerAssignmentTimeoutSeconds: timeoutSeconds,
      sellerSearchRadiusKm: 10,
      routingProviderEnabled: false,
      routingFallbackSpeedKmph: 18,
      maxConcurrentDeliveries: 3,
    })),
  };

  const service = new DeliveryOrderService({
    deliveryAssignmentRepository,
    deliveryPartnerRepository,
    deliveryEarningRepository: { create: jest.fn(), sumByPartner: jest.fn(async () => 0) },
    deliveryOtpService: { createOtp: jest.fn(async () => '1234'), verifyOtp: jest.fn(async () => true) },
    orderRepository: { findById: jest.fn(async () => order), updateById: jest.fn(async () => order) },
    orderItemRepository: { listByOrderId: jest.fn(async () => [{ sellerId }]) },
    sellerRepository: { findById: jest.fn(async () => ({ _id: sellerId, ...PICKUP, latitude: PICKUP.lat, longitude: PICKUP.lng })) },
    orderTrackingRepository: { createInitial: jest.fn() },
    orderStatusHistoryRepository: { addTransition: jest.fn() },
    deliveryPartnerRankingService: new DeliveryPartnerRankingService({ deliveryAssignmentRepository }),
    fulfillmentConfigService,
  });

  const sweeper = new FulfillmentSweeper({
    orderFulfillmentRepository: {
      findExpiredAcceptances: async () => [], findExpiredSearches: async () => [],
    },
    fulfillmentEngineService: { handleAcceptanceTimeout: jest.fn(), attemptNext: jest.fn() },
    fulfillmentConfigService,
    deliveryAssignmentRepository,
    deliveryOrderService: service,
  });

  return { service, sweeper, assignment, order, deliveryAssignmentRepository, deliveryPartnerRepository };
}

function partner(id, overrides = {}) {
  return {
    _id: id,
    status: 'approved',
    isOnline: true,
    latitude: PICKUP.lat,
    longitude: PICKUP.lng,
    lastLocationAt: new Date(),
    activeCount: 0,
    deletedAt: null,
    ...overrides,
  };
}

describe('CR-002 P9 — ranked delivery offers', () => {
  describe('offer creation', () => {
    it('offers to the nearest partner when all else is equal', async () => {
      const near = partner('p-near', { latitude: 28.6140, longitude: 77.2091 });
      const far = partner('p-far', { latitude: 28.6600, longitude: 77.2600 });
      const { service, assignment } = buildContext({ partners: [far, near] });

      const result = await service.notifyNearbyPartnersForOrder('order-1');

      expect(result.ranked).toBe(true);
      expect(result.partnerIds).toEqual(['p-near']);
      expect(assignment.status).toBe(ASSIGNMENT_STATUS.ASSIGNED);
      expect(assignment.offeredTo).toEqual(['p-near']);
      expect(assignment.offerExpiresAt).toBeInstanceOf(Date);
    });

    it('is not simply nearest-wins: a loaded partner loses to a freer one', async () => {
      const busy = partner('p-busy', { latitude: 28.6140, longitude: 77.2091, activeCount: 3 });
      const free = partner('p-free', { latitude: 28.6200, longitude: 77.2150, activeCount: 0 });
      const { service } = buildContext({ partners: [busy, free] });

      const result = await service.notifyNearbyPartnersForOrder('order-1');

      expect(result.partnerIds).toEqual(['p-free']);
    });

    it('offers to exactly one partner, never several', async () => {
      const { service, assignment } = buildContext({
        partners: [partner('p1'), partner('p2'), partner('p3')],
      });

      await service.notifyNearbyPartnersForOrder('order-1');

      expect(assignment.offeredTo).toHaveLength(1);
    });

    it('derives the offer window from configuration', async () => {
      const { service, assignment } = buildContext({
        partners: [partner('p1')], timeoutSeconds: 25,
      });

      const before = Date.now();
      await service.notifyNearbyPartnersForOrder('order-1');

      const ms = new Date(assignment.offerExpiresAt).getTime() - before;
      expect(ms).toBeGreaterThan(20_000);
      expect(ms).toBeLessThanOrEqual(26_000);
    });

    it('does not offer when the assignment is already owned', async () => {
      const { service, assignment } = buildContext({ partners: [partner('p1')] });
      assignment.partnerId = 'someone-else';

      expect(await service.offerToNextRankedPartner('order-1')).toBeNull();
    });
  });

  describe('no partner available', () => {
    it('falls back to broadcast rather than stranding the order', async () => {
      const { service, assignment } = buildContext({ partners: [] });

      const result = await service.notifyNearbyPartnersForOrder('order-1');

      // Broadcast path returns the (empty) partner list; no offer was made.
      expect(result.ranked).toBeUndefined();
      expect(assignment.offeredTo).toHaveLength(0);
    });

    it('falls back when every candidate is offline', async () => {
      const { service } = buildContext({ partners: [partner('p1', { isOnline: false })] });

      const result = await service.notifyNearbyPartnersForOrder('order-1');
      expect(result.ranked).toBeUndefined();
    });

    it('falls back when every candidate is at their workload cap', async () => {
      const { service } = buildContext({
        partners: [partner('p1', { activeCount: 3 }), partner('p2', { activeCount: 5 })],
      });

      const result = await service.notifyNearbyPartnersForOrder('order-1');
      expect(result.ranked).toBeUndefined();
    });
  });

  describe('acceptance', () => {
    it('the offered partner can accept', async () => {
      const { service, assignment } = buildContext({ partners: [partner('p1')] });
      await service.notifyNearbyPartnersForOrder('order-1');

      const result = await service.acceptOrder('p1', 'order-1');

      expect(String(result.assignment.partnerId)).toBe('p1');
      expect(assignment.status).toBe(ASSIGNMENT_STATUS.ACCEPTED);
      expect(result.pickupOtp).toBeTruthy();
    });

    it('a partner without the offer cannot accept', async () => {
      const { service } = buildContext({ partners: [partner('p1'), partner('p2')] });
      await service.notifyNearbyPartnersForOrder('order-1');

      await expect(service.acceptOrder('p2', 'order-1')).rejects.toMatchObject({ code: 'CONFLICT' });
    });

    it('a duplicate accept by the same partner is idempotent', async () => {
      const { service, assignment } = buildContext({ partners: [partner('p1')] });
      await service.notifyNearbyPartnersForOrder('order-1');

      await service.acceptOrder('p1', 'order-1');
      const second = await service.acceptOrder('p1', 'order-1');

      expect(second.idempotent).toBe(true);
      expect(String(assignment.partnerId)).toBe('p1');
    });

    it('an expired offer cannot be accepted', async () => {
      const { service, assignment } = buildContext({ partners: [partner('p1')] });
      await service.notifyNearbyPartnersForOrder('order-1');

      assignment.offerExpiresAt = new Date(Date.now() - 1000);

      await expect(service.acceptOrder('p1', 'order-1')).rejects.toMatchObject({ code: 'CONFLICT' });
      expect(assignment.partnerId).toBeNull();
    });

    it('an offline partner cannot accept', async () => {
      const p = partner('p1');
      const { service, deliveryPartnerRepository } = buildContext({ partners: [p] });
      await service.notifyNearbyPartnersForOrder('order-1');

      await deliveryPartnerRepository.updateById('p1', { isOnline: false });

      await expect(service.acceptOrder('p1', 'order-1'))
        .rejects.toMatchObject({ code: 'DELIVERY_NOT_AVAILABLE' });
    });

    it('concurrent accepts leave exactly one owner', async () => {
      const { service, assignment } = buildContext({ partners: [partner('p1'), partner('p2')] });
      await service.notifyNearbyPartnersForOrder('order-1');

      // Both partners hold an offer for this round (forced) and race.
      assignment.offeredTo = ['p1', 'p2'];

      const results = await Promise.allSettled([
        service.acceptOrder('p1', 'order-1'),
        service.acceptOrder('p2', 'order-1'),
      ]);

      const fulfilled = results.filter((r) => r.status === 'fulfilled');
      expect(fulfilled).toHaveLength(1);
      expect(assignment.status).toBe(ASSIGNMENT_STATUS.ACCEPTED);
      expect(['p1', 'p2']).toContain(String(assignment.partnerId));
    });
  });

  describe('rejection', () => {
    it('rejection withdraws the offer and moves to the next partner', async () => {
      const near = partner('p-near', { latitude: 28.6140, longitude: 77.2091 });
      const next = partner('p-next', { latitude: 28.6200, longitude: 77.2150 });
      const { service, assignment } = buildContext({ partners: [near, next] });

      await service.notifyNearbyPartnersForOrder('order-1');
      expect(assignment.offeredTo).toEqual(['p-near']);

      await service.rejectOrder('p-near', 'order-1', 'too_far');

      expect(assignment.rejectedBy).toContain('p-near');
      expect(assignment.offeredTo).toContain('p-next');
      expect(assignment.status).toBe(ASSIGNMENT_STATUS.ASSIGNED);
    });

    it('a rejected partner is not offered the same order again', async () => {
      const { service, assignment } = buildContext({ partners: [partner('p1')] });

      await service.notifyNearbyPartnersForOrder('order-1');
      await service.rejectOrder('p1', 'order-1');

      // Only candidate already refused — no live offer remains.
      expect(assignment.rejectedBy).toContain('p1');
      expect(assignment.status).toBe(ASSIGNMENT_STATUS.PENDING);
    });

    it('all partners rejecting leaves the assignment unowned and pending', async () => {
      const { service, assignment } = buildContext({
        partners: [partner('p1', { latitude: 28.6140 }), partner('p2', { latitude: 28.6150 })],
      });

      await service.notifyNearbyPartnersForOrder('order-1');
      await service.rejectOrder(assignment.offeredTo[0], 'order-1');
      await service.rejectOrder(assignment.offeredTo[assignment.offeredTo.length - 1], 'order-1');

      expect(assignment.partnerId).toBeNull();
      expect(assignment.status).toBe(ASSIGNMENT_STATUS.PENDING);
      expect(assignment.rejectedBy).toHaveLength(2);
    });

    it('rejecting after someone else accepted does not undo the acceptance', async () => {
      const { service, assignment } = buildContext({ partners: [partner('p1'), partner('p2')] });
      await service.notifyNearbyPartnersForOrder('order-1');

      assignment.offeredTo = ['p1', 'p2'];
      await service.acceptOrder('p1', 'order-1');

      await expect(service.rejectRankedOffer('p2', 'order-1'))
        .rejects.toMatchObject({ code: 'CONFLICT' });
      expect(String(assignment.partnerId)).toBe('p1');
    });
  });

  describe('timeout via sweeper', () => {
    it('expires the offer and reassigns to the next partner', async () => {
      const near = partner('p-near', { latitude: 28.6140, longitude: 77.2091 });
      const next = partner('p-next', { latitude: 28.6200, longitude: 77.2150 });
      const { service, sweeper, assignment } = buildContext({ partners: [near, next] });

      await service.notifyNearbyPartnersForOrder('order-1');
      assignment.offerExpiresAt = new Date(Date.now() - 1000);

      const result = await sweeper.sweepOnce();

      expect(result.deliveryOfferTimeouts).toBe(1);
      expect(assignment.rejectedBy).toContain('p-near');
      expect(assignment.offeredTo).toContain('p-next');
    });

    it('does not expire an offer that is still live', async () => {
      const { service, sweeper, assignment } = buildContext({ partners: [partner('p1')] });
      await service.notifyNearbyPartnersForOrder('order-1');

      const result = await sweeper.sweepOnce();

      expect(result.deliveryOfferTimeouts).toBe(0);
      expect(assignment.status).toBe(ASSIGNMENT_STATUS.ASSIGNED);
    });

    it('a timeout racing an acceptance leaves the acceptance intact', async () => {
      const { service, assignment } = buildContext({ partners: [partner('p1')] });
      await service.notifyNearbyPartnersForOrder('order-1');

      const staleDeadline = assignment.offerExpiresAt;
      await service.acceptOrder('p1', 'order-1');

      // Sweeper acts on the deadline it read before the accept landed.
      const result = await service.handleOfferTimeout({
        ...assignment, offerExpiresAt: staleDeadline,
      });

      expect(result).toBeNull();
      expect(String(assignment.partnerId)).toBe('p1');
      expect(assignment.status).toBe(ASSIGNMENT_STATUS.ACCEPTED);
    });
  });

  describe('broadcast mode is preserved (shipped default)', () => {
    it('makes no ranked offer and keeps first-come-first-served', async () => {
      const { service, assignment, deliveryAssignmentRepository } = buildContext({
        mode: 'broadcast', partners: [partner('p1'), partner('p2')],
      });

      const result = await service.notifyNearbyPartnersForOrder('order-1');

      expect(deliveryAssignmentRepository.offerToPartner).not.toHaveBeenCalled();
      expect(assignment.offeredTo).toHaveLength(0);
      expect(result.partnerIds.sort()).toEqual(['p1', 'p2']);
    });

    it('lets any nearby partner accept', async () => {
      const { service, assignment } = buildContext({
        mode: 'broadcast', partners: [partner('p1'), partner('p2')],
      });
      await service.notifyNearbyPartnersForOrder('order-1');

      await service.acceptOrder('p2', 'order-1');

      expect(String(assignment.partnerId)).toBe('p2');
    });

    it('falls back to broadcast when config resolution fails', async () => {
      const { service } = buildContext({ partners: [partner('p1')] });
      service.fulfillmentConfigService.resolve = jest.fn(async () => { throw new Error('down'); });

      const result = await service.notifyNearbyPartnersForOrder('order-1');
      expect(result.ranked).toBeUndefined();
    });
  });
});

describe('DeliveryPartnerRankingService', () => {
  const svc = new DeliveryPartnerRankingService({});

  describe('isEligible', () => {
    const cases = [
      ['not approved', { status: 'pending' }, 'not_approved'],
      ['offline', { isOnline: false }, 'offline'],
      ['no location', { latitude: null, longitude: null }, 'no_location'],
      ['deleted', { deletedAt: new Date() }, 'deleted'],
    ];

    it.each(cases)('rejects a partner that is %s', (_label, overrides, reason) => {
      expect(svc.isEligible(partner('p', overrides))).toMatchObject({ ok: false, reason });
    });

    it('rejects a partner who already refused this order', () => {
      expect(svc.isEligible(partner('p'), { rejectedBy: ['p'] }))
        .toMatchObject({ ok: false, reason: 'already_rejected' });
    });

    it('rejects a partner at their workload cap', () => {
      expect(svc.isEligible(partner('p'), { maxConcurrentDeliveries: 3, workload: 3 }))
        .toMatchObject({ ok: false, reason: 'overloaded' });
    });

    it('accepts an eligible partner', () => {
      expect(svc.isEligible(partner('p'), { maxConcurrentDeliveries: 3, workload: 1 }).ok).toBe(true);
    });

    it('rejects a missing partner defensively', () => {
      expect(svc.isEligible(null).ok).toBe(false);
    });
  });

  it('scores a stale location lower than a fresh one', async () => {
    const fresh = partner('fresh', { lastLocationAt: new Date() });
    const stale = partner('stale', { lastLocationAt: new Date(Date.now() - 10 * 60 * 1000) });

    const { ranked } = await svc.rank({
      partners: [stale, fresh], pickupLocation: PICKUP, config: { sellerSearchRadiusKm: 10 },
    });

    expect(ranked[0].partnerId).toBe('fresh');
  });

  it('breaks ties deterministically', async () => {
    const { ranked } = await svc.rank({
      partners: [partner('b'), partner('a')], pickupLocation: PICKUP,
      config: { sellerSearchRadiusKm: 10 },
    });

    expect(ranked.map((r) => r.partnerId)).toEqual(['a', 'b']);
  });

  it('returns empty without candidates or a pickup point', async () => {
    expect((await svc.rank({ partners: [], pickupLocation: PICKUP })).ranked).toEqual([]);
    expect((await svc.rank({ partners: [partner('a')], pickupLocation: null })).ranked).toEqual([]);
  });

  it('reports why each candidate was excluded', async () => {
    const { ranked, rejected } = await svc.rank({
      partners: [partner('off', { isOnline: false })], pickupLocation: PICKUP,
      config: { sellerSearchRadiusKm: 10 },
    });

    expect(ranked).toHaveLength(0);
    expect(rejected[0]).toMatchObject({ partnerId: 'off', reason: 'offline' });
  });
});
