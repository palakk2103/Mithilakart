jest.mock('../../../src/database', () => ({
  withTransaction: (callback) => callback(null),
}));

const { GameService } = require('../../../src/services/game/GameService');
const { DEFAULT_PLATFORM_SETTINGS } = require('../../../src/constants/platformSettings');

const ORDER_ID = 'order-1';
const USER_ID = 'user-1';

function buildService({
  order = { _id: ORDER_ID, userId: USER_ID, status: 'confirmed' },
  platformOverrides = {},
  sessionStore = new Map(),
} = {}) {
  const orderRepository = {
    findActiveById: jest.fn(async (id, userId) => {
      if (!order) return null;
      // Mirrors the real repository's own filter — only "found" when it
      // actually belongs to userId, so a cross-user attempt looks identical
      // to a genuinely missing order.
      if (userId && String(order.userId) !== String(userId)) return null;
      return order;
    }),
  };

  const platformConfigService = {
    getConfig: jest.fn(async () => ({ ...DEFAULT_PLATFORM_SETTINGS, ...platformOverrides })),
  };

  let nextId = 1;
  const gameSessionRepository = {
    countByOrder: jest.fn(async (orderId) => {
      let count = 0;
      for (const s of sessionStore.values()) if (String(s.orderId) === String(orderId)) count += 1;
      return count;
    }),
    create: jest.fn(async (data) => {
      const doc = { ...data, _id: `session-${nextId++}` };
      sessionStore.set(doc._id, doc);
      return doc;
    }),
    findById: jest.fn(async (id) => sessionStore.get(id) || null),
    markClaimed: jest.fn(async (id, { walletTransactionId }) => {
      const doc = sessionStore.get(id);
      if (!doc || doc.status !== 'started') return null;
      if (doc.expiresAt && doc.expiresAt < new Date()) return null;
      doc.status = 'claimed';
      doc.claimedAt = new Date();
      doc.walletTransactionId = walletTransactionId;
      sessionStore.set(id, doc);
      return doc;
    }),
    updateById: jest.fn(async (id, patch) => {
      const doc = sessionStore.get(id);
      if (!doc) return null;
      Object.assign(doc, patch);
      sessionStore.set(id, doc);
      return doc;
    }),
  };

  let walletTxCount = 0;
  const grantedKeys = new Set();
  const walletService = {
    credit: jest.fn(async ({ idempotencyKey, amount }) => {
      if (idempotencyKey && grantedKeys.has(idempotencyKey)) {
        throw new Error('Test setup error: credit called twice with the same idempotencyKey — ' +
          'the real WalletService would short-circuit, but this mock catching it proves the ' +
          'caller relied on that short-circuit rather than its own gate.');
      }
      if (idempotencyKey) grantedKeys.add(idempotencyKey);
      walletTxCount += 1;
      return { _id: `wtx-${walletTxCount}`, amount };
    }),
  };

  return {
    service: new GameService({ gameSessionRepository, orderRepository, walletService, platformConfigService }),
    orderRepository,
    gameSessionRepository,
    walletService,
    sessionStore,
  };
}

describe('GameService — "Catch Your Delivery"', () => {
  describe('startSession', () => {
    it('decides the outcome server-side and never returns it to the caller', async () => {
      const { service } = buildService();
      const result = await service.startSession({ orderId: ORDER_ID, userId: USER_ID });

      expect(result).toEqual({
        sessionId: expect.any(String),
        durationSeconds: expect.any(Number),
        expiresAt: expect.any(Date),
      });
      expect(result.won).toBeUndefined();
      expect(result.rewardType).toBeUndefined();
      expect(result.rewardValue).toBeUndefined();
    });

    it('persists a real outcome on the session immediately, before any claim', async () => {
      const { service, sessionStore } = buildService();
      const { sessionId } = await service.startSession({ orderId: ORDER_ID, userId: USER_ID });

      const stored = sessionStore.get(sessionId);
      expect(stored.status).toBe('started');
      expect(typeof stored.won).toBe('boolean');
      expect(stored.rewardType).toEqual(expect.any(String));
    });

    it('rejects a user who does not own the order — indistinguishable from "not found"', async () => {
      const { service } = buildService({ order: { _id: ORDER_ID, userId: 'someone-else', status: 'confirmed' } });

      await expect(service.startSession({ orderId: ORDER_ID, userId: USER_ID }))
        .rejects.toMatchObject({ message: expect.stringMatching(/not found/i) });
    });

    it('refuses a second play once maxPlaysPerOrder is reached', async () => {
      const { service } = buildService({ platformOverrides: { gameMaxPlaysPerOrder: 1 } });

      await service.startSession({ orderId: ORDER_ID, userId: USER_ID });
      await expect(service.startSession({ orderId: ORDER_ID, userId: USER_ID }))
        .rejects.toMatchObject({ message: expect.stringMatching(/already used your play/i) });
    });

    it('allows multiple plays when admin raises maxPlaysPerOrder', async () => {
      const { service } = buildService({ platformOverrides: { gameMaxPlaysPerOrder: 2 } });

      await service.startSession({ orderId: ORDER_ID, userId: USER_ID });
      const second = await service.startSession({ orderId: ORDER_ID, userId: USER_ID });
      expect(second.sessionId).toBeDefined();
    });

    it('refuses to start once the order is delivered', async () => {
      const { service } = buildService({ order: { _id: ORDER_ID, userId: USER_ID, status: 'delivered' } });

      await expect(service.startSession({ orderId: ORDER_ID, userId: USER_ID }))
        .rejects.toMatchObject({ message: expect.stringMatching(/no longer be played/i) });
    });

    it('refuses to start once the order is cancelled', async () => {
      const { service } = buildService({ order: { _id: ORDER_ID, userId: USER_ID, status: 'cancelled' } });

      await expect(service.startSession({ orderId: ORDER_ID, userId: USER_ID }))
        .rejects.toThrow();
    });

    it('refuses to start when the admin has disabled the game', async () => {
      const { service } = buildService({ platformOverrides: { gameEnabled: false } });

      await expect(service.startSession({ orderId: ORDER_ID, userId: USER_ID }))
        .rejects.toMatchObject({ message: expect.stringMatching(/not currently available/i) });
    });

    it('refuses to start before the configured campaign start date', async () => {
      const future = new Date(Date.now() + 60_000).toISOString();
      const { service } = buildService({ platformOverrides: { gameStartsAt: future } });

      await expect(service.startSession({ orderId: ORDER_ID, userId: USER_ID })).rejects.toThrow();
    });

    it('refuses to start after the configured campaign expiry', async () => {
      const past = new Date(Date.now() - 60_000).toISOString();
      const { service } = buildService({ platformOverrides: { gameExpiresAt: past } });

      await expect(service.startSession({ orderId: ORDER_ID, userId: USER_ID })).rejects.toThrow();
    });

    it('resolves the real Order._id even when a caller passes an order NUMBER', async () => {
      // Guards a real bug fixed during implementation: countByOrder/create
      // must use order._id, not whatever identifier the caller passed in —
      // OrderRepository.findActiveById accepts either an ObjectId or an
      // orderNumber string.
      const order = { _id: 'real-object-id', userId: USER_ID, status: 'confirmed' };
      const { service, gameSessionRepository } = buildService({ order });

      await service.startSession({ orderId: 'MK-SOME-ORDER-NUMBER', userId: USER_ID });

      expect(gameSessionRepository.countByOrder).toHaveBeenCalledWith('real-object-id');
      expect(gameSessionRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({ orderId: 'real-object-id' })
      );
    });
  });

  describe('claimSession', () => {
    it('grants the wallet credit exactly once for a genuine win', async () => {
      const { service, sessionStore, walletService } = buildService({
        platformOverrides: { gameWinProbability: 1 }, // deterministic win
      });
      const { sessionId } = await service.startSession({ orderId: ORDER_ID, userId: USER_ID });
      expect(sessionStore.get(sessionId).won).toBe(true);

      const result = await service.claimSession({ sessionId, userId: USER_ID });

      expect(result.won).toBe(true);
      expect(result.status).toBe('claimed');
      expect(walletService.credit).toHaveBeenCalledTimes(1);
      expect(walletService.credit).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: USER_ID,
          idempotencyKey: `game:${sessionId}`,
        })
      );
    });

    it('does NOT credit the wallet on a genuine loss', async () => {
      const { service, walletService } = buildService({
        platformOverrides: { gameWinProbability: 0 }, // deterministic loss
      });
      const { sessionId } = await service.startSession({ orderId: ORDER_ID, userId: USER_ID });

      const result = await service.claimSession({ sessionId, userId: USER_ID });

      expect(result.won).toBe(false);
      expect(result.status).toBe('claimed');
      expect(walletService.credit).not.toHaveBeenCalled();
    });

    it('a second claim on the same session is a safe no-op, not a second grant', async () => {
      const { service, walletService } = buildService({
        platformOverrides: { gameWinProbability: 1 },
      });
      const { sessionId } = await service.startSession({ orderId: ORDER_ID, userId: USER_ID });

      const first = await service.claimSession({ sessionId, userId: USER_ID });
      const second = await service.claimSession({ sessionId, userId: USER_ID });

      expect(second).toEqual(first);
      expect(walletService.credit).toHaveBeenCalledTimes(1);
    });

    it('a second claim on an already-claimed LOSS session is also a safe no-op', async () => {
      const { service } = buildService({ platformOverrides: { gameWinProbability: 0 } });
      const { sessionId } = await service.startSession({ orderId: ORDER_ID, userId: USER_ID });

      const first = await service.claimSession({ sessionId, userId: USER_ID });
      const second = await service.claimSession({ sessionId, userId: USER_ID });

      expect(second).toEqual(first);
    });

    it('rejects a claim from a user who does not own the session', async () => {
      const { service } = buildService();
      const { sessionId } = await service.startSession({ orderId: ORDER_ID, userId: USER_ID });

      await expect(service.claimSession({ sessionId, userId: 'a-different-user' }))
        .rejects.toMatchObject({ message: expect.stringMatching(/does not belong to you/i) });
    });

    it('rejects a claim for a session that does not exist', async () => {
      const { service } = buildService();
      await expect(service.claimSession({ sessionId: 'no-such-session', userId: USER_ID }))
        .rejects.toMatchObject({ message: expect.stringMatching(/not found/i) });
    });

    it('rejects a claim once the session has expired without ever being claimed', async () => {
      const { service, sessionStore } = buildService({
        platformOverrides: { gameWinProbability: 1 },
      });
      const { sessionId } = await service.startSession({ orderId: ORDER_ID, userId: USER_ID });

      // Simulate time passing past the session TTL.
      const doc = sessionStore.get(sessionId);
      doc.expiresAt = new Date(Date.now() - 1000);
      sessionStore.set(sessionId, doc);

      await expect(service.claimSession({ sessionId, userId: USER_ID }))
        .rejects.toMatchObject({ message: expect.stringMatching(/expired/i) });
    });

    it('the reward value is always within the admin-configured coin range', async () => {
      // gameMaxPlaysPerOrder raised so 20 plays against the same mocked
      // order are legitimate — this test is about reward-value
      // randomization staying in range, not per-order play limits (covered
      // separately above).
      const { service, sessionStore } = buildService({
        platformOverrides: {
          gameWinProbability: 1,
          gameCoinRewardMin: 10,
          gameCoinRewardMax: 12,
          gameMaxPlaysPerOrder: 20,
        },
      });

      for (let i = 0; i < 20; i += 1) {
        const { sessionId } = await service.startSession({ orderId: ORDER_ID, userId: USER_ID });
        const stored = sessionStore.get(sessionId);
        if (stored.rewardType === 'coins') {
          expect(stored.rewardValue).toBeGreaterThanOrEqual(10);
          expect(stored.rewardValue).toBeLessThanOrEqual(12);
        }
      }
    });
  });

  describe('getPlayEligibility', () => {
    it('reports eligible for a fresh, trackable order within the campaign window', async () => {
      const { service } = buildService();
      const result = await service.getPlayEligibility({ orderId: ORDER_ID, userId: USER_ID });

      expect(result).toMatchObject({
        eligible: true,
        campaignLive: true,
        orderTrackable: true,
        playsUsed: 0,
      });
    });

    it('reports ineligible once the order has been delivered', async () => {
      const { service } = buildService({ order: { _id: ORDER_ID, userId: USER_ID, status: 'delivered' } });
      const result = await service.getPlayEligibility({ orderId: ORDER_ID, userId: USER_ID });

      expect(result.eligible).toBe(false);
      expect(result.orderTrackable).toBe(false);
    });

    it('reports ineligible after the one allowed play has been used', async () => {
      const { service } = buildService({ platformOverrides: { gameMaxPlaysPerOrder: 1 } });
      await service.startSession({ orderId: ORDER_ID, userId: USER_ID });

      const result = await service.getPlayEligibility({ orderId: ORDER_ID, userId: USER_ID });
      expect(result.eligible).toBe(false);
      expect(result.playsUsed).toBe(1);
    });

    it('counts plays against the real Order._id even when called with an order NUMBER', async () => {
      const order = { _id: 'real-object-id', userId: USER_ID, status: 'confirmed' };
      const { service, gameSessionRepository } = buildService({ order, platformOverrides: { gameMaxPlaysPerOrder: 1 } });

      await service.startSession({ orderId: 'MK-SOME-ORDER-NUMBER', userId: USER_ID });
      gameSessionRepository.countByOrder.mockClear();

      const result = await service.getPlayEligibility({ orderId: 'MK-SOME-ORDER-NUMBER', userId: USER_ID });

      expect(gameSessionRepository.countByOrder).toHaveBeenCalledWith('real-object-id');
      expect(result.playsUsed).toBe(1);
    });
  });
});
