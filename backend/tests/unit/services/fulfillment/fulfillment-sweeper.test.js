const { FulfillmentSweeper } = require('../../../../src/services/fulfillment/FulfillmentSweeper');

/**
 * The sweeper is what actually enforces CR-002's timeouts: QueueManager has no
 * adapter, so deadlines live in MongoDB and this is the only thing that acts on
 * them. If it silently stops, offers hang and stock stays reserved forever.
 */
function build({
  expiredAcceptances = [], expiredSearches = [], expiredOffers = null, intervalSeconds = 15,
} = {}) {
  const orderFulfillmentRepository = {
    findExpiredAcceptances: jest.fn(async () => expiredAcceptances),
    findExpiredSearches: jest.fn(async () => expiredSearches),
  };

  const fulfillmentEngineService = {
    handleAcceptanceTimeout: jest.fn(async () => ({})),
    attemptNext: jest.fn(async () => ({})),
  };

  const fulfillmentConfigService = {
    resolve: jest.fn(async () => ({ sweeperIntervalSeconds: intervalSeconds })),
  };

  // null means "delivery sweeping not wired" — the broadcast-mode default.
  const deliveryAssignmentRepository = expiredOffers === null ? null : {
    findExpiredOffers: jest.fn(async () => expiredOffers),
  };
  const deliveryOrderService = expiredOffers === null ? null : {
    handleOfferTimeout: jest.fn(async () => ({})),
  };

  return {
    sweeper: new FulfillmentSweeper({
      orderFulfillmentRepository,
      fulfillmentEngineService,
      fulfillmentConfigService,
      deliveryAssignmentRepository,
      deliveryOrderService,
    }),
    orderFulfillmentRepository,
    fulfillmentEngineService,
    fulfillmentConfigService,
    deliveryAssignmentRepository,
    deliveryOrderService,
  };
}

const ful = (id) => ({ _id: id, traceId: `trace-${id}` });

describe('FulfillmentSweeper', () => {
  afterEach(() => jest.useRealTimers());

  describe('sweepOnce', () => {
    it('reports a clean pass when nothing has expired', async () => {
      const { sweeper } = build();
      const result = await sweeper.sweepOnce();

      expect(result).toEqual({
        acceptanceTimeouts: 0, searchTimeouts: 0, deliveryOfferTimeouts: 0, errors: 0,
      });
    });

    it('T-08: hands each expired acceptance to the engine', async () => {
      const { sweeper, fulfillmentEngineService } = build({
        expiredAcceptances: [ful('f1'), ful('f2')],
      });

      const result = await sweeper.sweepOnce();

      expect(result.acceptanceTimeouts).toBe(2);
      expect(fulfillmentEngineService.handleAcceptanceTimeout).toHaveBeenCalledTimes(2);
    });

    it('re-drives each expired search so it can escalate', async () => {
      const { sweeper, fulfillmentEngineService } = build({
        expiredSearches: [ful('f3')],
      });

      const result = await sweeper.sweepOnce();

      expect(result.searchTimeouts).toBe(1);
      expect(fulfillmentEngineService.attemptNext).toHaveBeenCalledWith('f3');
    });

    it('passes the sweep timestamp through to the queries', async () => {
      const { sweeper, orderFulfillmentRepository } = build();
      const now = new Date('2026-08-18T12:00:00.000Z');

      await sweeper.sweepOnce(now);

      expect(orderFulfillmentRepository.findExpiredAcceptances).toHaveBeenCalledWith(now);
      expect(orderFulfillmentRepository.findExpiredSearches).toHaveBeenCalledWith(now);
    });

    it('keeps going when one fulfillment throws, so a single bad row cannot stall the queue', async () => {
      const { sweeper, fulfillmentEngineService } = build({
        expiredAcceptances: [ful('bad'), ful('good')],
      });
      fulfillmentEngineService.handleAcceptanceTimeout
        .mockRejectedValueOnce(new Error('boom'))
        .mockResolvedValueOnce({});

      const result = await sweeper.sweepOnce();

      expect(result.errors).toBe(1);
      expect(result.acceptanceTimeouts).toBe(1);
      expect(fulfillmentEngineService.handleAcceptanceTimeout).toHaveBeenCalledTimes(2);
    });

    it('keeps going when a search re-drive throws', async () => {
      const { sweeper, fulfillmentEngineService } = build({ expiredSearches: [ful('f1')] });
      fulfillmentEngineService.attemptNext.mockRejectedValue(new Error('boom'));

      const result = await sweeper.sweepOnce();

      expect(result.errors).toBe(1);
      expect(result.searchTimeouts).toBe(0);
    });

    it('survives a repository failure instead of throwing at the caller', async () => {
      const { sweeper, orderFulfillmentRepository } = build();
      orderFulfillmentRepository.findExpiredAcceptances.mockRejectedValue(new Error('db down'));

      await expect(sweeper.sweepOnce()).resolves.toMatchObject({ errors: 1 });
    });

    it('P9: expires delivery offers when the delivery layer is wired', async () => {
      const { sweeper, deliveryOrderService } = build({
        expiredOffers: [{ _id: 'a1', orderId: 'o1' }, { _id: 'a2', orderId: 'o2' }],
      });

      const result = await sweeper.sweepOnce();

      expect(result.deliveryOfferTimeouts).toBe(2);
      expect(deliveryOrderService.handleOfferTimeout).toHaveBeenCalledTimes(2);
    });

    it('skips delivery sweeping when not wired (broadcast mode)', async () => {
      const { sweeper } = build();
      const result = await sweeper.sweepOnce();
      expect(result.deliveryOfferTimeouts).toBe(0);
    });

    it('keeps going when one delivery offer timeout throws', async () => {
      const { sweeper, deliveryOrderService } = build({
        expiredOffers: [{ _id: 'bad' }, { _id: 'good' }],
      });
      deliveryOrderService.handleOfferTimeout
        .mockRejectedValueOnce(new Error('boom'))
        .mockResolvedValueOnce({});

      const result = await sweeper.sweepOnce();

      expect(result.errors).toBe(1);
      expect(result.deliveryOfferTimeouts).toBe(1);
    });

    it('survives a delivery repository failure', async () => {
      const { sweeper, deliveryAssignmentRepository } = build({ expiredOffers: [] });
      deliveryAssignmentRepository.findExpiredOffers.mockRejectedValue(new Error('db down'));

      await expect(sweeper.sweepOnce()).resolves.toMatchObject({ errors: 1 });
    });

    it('processes acceptances before searches', async () => {
      const order = [];
      const { sweeper, fulfillmentEngineService } = build({
        expiredAcceptances: [ful('a')],
        expiredSearches: [ful('s')],
      });
      fulfillmentEngineService.handleAcceptanceTimeout.mockImplementation(async () => { order.push('acceptance'); });
      fulfillmentEngineService.attemptNext.mockImplementation(async () => { order.push('search'); });

      await sweeper.sweepOnce();

      expect(order).toEqual(['acceptance', 'search']);
    });
  });

  describe('lifecycle', () => {
    it('reads its interval from configuration rather than hardcoding one', async () => {
      jest.useFakeTimers();
      const { sweeper, fulfillmentConfigService, orderFulfillmentRepository } = build({ intervalSeconds: 5 });

      await sweeper.start();
      expect(fulfillmentConfigService.resolve).toHaveBeenCalled();

      jest.advanceTimersByTime(5000);
      await Promise.resolve();

      expect(orderFulfillmentRepository.findExpiredAcceptances).toHaveBeenCalled();
      sweeper.stop();
    });

    it('still starts on a default interval when config is unavailable', async () => {
      jest.useFakeTimers();
      const { sweeper, fulfillmentConfigService } = build();
      fulfillmentConfigService.resolve.mockRejectedValue(new Error('config down'));

      await expect(sweeper.start()).resolves.toBeTruthy();
      sweeper.stop();
    });

    it('is idempotent — a second start does not add a second timer', async () => {
      jest.useFakeTimers();
      const { sweeper, fulfillmentConfigService } = build();

      await sweeper.start();
      await sweeper.start();

      expect(fulfillmentConfigService.resolve).toHaveBeenCalledTimes(1);
      sweeper.stop();
    });

    it('stops cleanly and fires no further passes', async () => {
      jest.useFakeTimers();
      const { sweeper, orderFulfillmentRepository } = build({ intervalSeconds: 5 });

      await sweeper.start();
      sweeper.stop();

      jest.advanceTimersByTime(60_000);
      await Promise.resolve();

      expect(orderFulfillmentRepository.findExpiredAcceptances).not.toHaveBeenCalled();
    });

    it('tolerates stop() before start()', () => {
      const { sweeper } = build();
      expect(() => sweeper.stop()).not.toThrow();
    });

    it('skips a tick rather than stacking passes when one is still running', async () => {
      const { sweeper, orderFulfillmentRepository } = build();
      let release;
      orderFulfillmentRepository.findExpiredAcceptances.mockImplementation(
        () => new Promise((resolve) => { release = () => resolve([]); })
      );

      sweeper._stopped = false;
      const first = sweeper._tick();
      await Promise.resolve();

      // Second tick arrives while the first is still in flight.
      await sweeper._tick();
      expect(orderFulfillmentRepository.findExpiredAcceptances).toHaveBeenCalledTimes(1);

      release();
      await first;
    });

    it('does not run a tick while stopped', async () => {
      const { sweeper, orderFulfillmentRepository } = build();

      await sweeper._tick();

      expect(orderFulfillmentRepository.findExpiredAcceptances).not.toHaveBeenCalled();
    });
  });
});
