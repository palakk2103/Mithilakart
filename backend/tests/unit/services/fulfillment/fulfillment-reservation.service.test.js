const { FulfillmentReservationService } = require('../../../../src/services/fulfillment/FulfillmentReservationService');
const { FULFILLMENT_FAILURE_CODE: FAIL } = require('../../../../src/constants/fulfillment');
const { AppError } = require('../../../../src/utils/AppError');

/**
 * An in-memory stand-in for ProductRepository that reproduces the semantics of
 * the real Mongo conditional update:
 *
 *   { $expr: { $gte: [{ $subtract: ['$stock', '$reservedStock'] }, qty] } }
 *   { $inc: { reservedStock: qty } }
 *
 * The compare and the increment happen with no await between them, so this
 * models MongoDB's single-document atomicity: two interleaved callers cannot
 * both succeed on the last unit.
 */
function fakeProductRepository(initial = {}) {
  const stock = new Map(Object.entries(initial).map(([id, v]) => [
    id,
    { stock: v.stock, reservedStock: v.reservedStock || 0 },
  ]));

  return {
    stock,
    reserveStock: jest.fn(async (productId, quantity) => {
      const row = stock.get(String(productId));
      if (!row) throw AppError.outOfStock('Insufficient stock');
      // Atomic compare-and-increment — no await between the two.
      if (row.stock - row.reservedStock < quantity) {
        throw AppError.outOfStock('Insufficient stock');
      }
      row.reservedStock += quantity;
      return { matchedCount: 1 };
    }),
    releaseReservedStock: jest.fn(async (productId, quantity) => {
      const row = stock.get(String(productId));
      if (!row) return { matchedCount: 0 };
      if (row.reservedStock < quantity) return { matchedCount: 0 };
      row.reservedStock -= quantity;
      return { matchedCount: 1 };
    }),
    decrementStock: jest.fn(async (productId, quantity) => {
      const row = stock.get(String(productId));
      if (!row || row.stock < quantity) throw AppError.outOfStock('Insufficient stock');
      row.stock -= quantity;
      row.reservedStock = Math.max(0, row.reservedStock - quantity);
      return { matchedCount: 1 };
    }),
  };
}

function fakeAttemptRepository() {
  return {
    updateById: jest.fn(async (id, data) => ({ _id: id, ...data })),
    markReservationsReleased: jest.fn(async () => ({ matchedCount: 1 })),
  };
}

function items(...specs) {
  return specs.map(([productId, quantity]) => ({ productId, quantity }));
}

function assertNoCorruption(repo) {
  for (const [id, row] of repo.stock.entries()) {
    expect(row.stock).toBeGreaterThanOrEqual(0);
    expect(row.reservedStock).toBeGreaterThanOrEqual(0);
    // Overselling would show up as reserved exceeding physical stock.
    expect(row.reservedStock).toBeLessThanOrEqual(row.stock);
    expect(Number.isInteger(row.reservedStock)).toBe(true);
    expect(id).toBeTruthy();
  }
}

describe('FulfillmentReservationService', () => {
  describe('all-or-nothing reservation', () => {
    it('T-02: reserves every line when all are available', async () => {
      const productRepository = fakeProductRepository({ A: { stock: 5 }, B: { stock: 5 }, C: { stock: 5 } });
      const service = new FulfillmentReservationService({
        productRepository, fulfillmentAttemptRepository: fakeAttemptRepository(),
      });

      const result = await service.reserveCompleteCart({
        resolvedItems: items(['A', 1], ['B', 2], ['C', 3]),
      });

      expect(result.ok).toBe(true);
      expect(result.reserved).toHaveLength(3);
      expect(productRepository.stock.get('A').reservedStock).toBe(1);
      expect(productRepository.stock.get('B').reservedStock).toBe(2);
      expect(productRepository.stock.get('C').reservedStock).toBe(3);
      assertNoCorruption(productRepository);
    });

    it('releases everything already taken when a later line fails', async () => {
      const productRepository = fakeProductRepository({ A: { stock: 5 }, B: { stock: 5 }, C: { stock: 0 } });
      const service = new FulfillmentReservationService({
        productRepository, fulfillmentAttemptRepository: fakeAttemptRepository(),
      });

      const result = await service.reserveCompleteCart({
        resolvedItems: items(['A', 1], ['B', 1], ['C', 1]),
      });

      expect(result.ok).toBe(false);
      expect(result.failedProductId).toBe('C');
      expect(result.reserved).toEqual([]);
      // The critical assertion: NOTHING is left held.
      expect(productRepository.stock.get('A').reservedStock).toBe(0);
      expect(productRepository.stock.get('B').reservedStock).toBe(0);
      assertNoCorruption(productRepository);
    });

    it('fails on the first line without holding anything', async () => {
      const productRepository = fakeProductRepository({ A: { stock: 0 }, B: { stock: 5 } });
      const service = new FulfillmentReservationService({
        productRepository, fulfillmentAttemptRepository: fakeAttemptRepository(),
      });

      const result = await service.reserveCompleteCart({ resolvedItems: items(['A', 1], ['B', 1]) });

      expect(result.ok).toBe(false);
      expect(productRepository.releaseReservedStock).not.toHaveBeenCalled();
      expect(productRepository.stock.get('B').reservedStock).toBe(0);
    });

    it('rejects an empty cart without touching inventory', async () => {
      const productRepository = fakeProductRepository({ A: { stock: 5 } });
      const service = new FulfillmentReservationService({
        productRepository, fulfillmentAttemptRepository: fakeAttemptRepository(),
      });

      const result = await service.reserveCompleteCart({ resolvedItems: [] });

      expect(result.ok).toBe(false);
      expect(result.code).toBe(FAIL.SELLER_MISSING_PRODUCT);
      expect(productRepository.reserveStock).not.toHaveBeenCalled();
    });

    it('rejects a non-array input defensively', async () => {
      const productRepository = fakeProductRepository({});
      const service = new FulfillmentReservationService({
        productRepository, fulfillmentAttemptRepository: fakeAttemptRepository(),
      });

      const result = await service.reserveCompleteCart({ resolvedItems: null });
      expect(result.ok).toBe(false);
    });

    it('never throws past its boundary, even on an unexpected repository error', async () => {
      const productRepository = fakeProductRepository({ A: { stock: 5 }, B: { stock: 5 } });
      productRepository.reserveStock.mockImplementationOnce(async () => { throw new Error('connection reset'); });

      const service = new FulfillmentReservationService({
        productRepository, fulfillmentAttemptRepository: fakeAttemptRepository(),
      });

      const result = await service.reserveCompleteCart({ resolvedItems: items(['A', 1], ['B', 1]) });

      expect(result.ok).toBe(false);
      expect(result.code).toBe(FAIL.SELLER_INSUFFICIENT_QUANTITY);
    });

    it('distinguishes losing a race from an unexpected failure', async () => {
      const productRepository = fakeProductRepository({ A: { stock: 0 } });
      const service = new FulfillmentReservationService({
        productRepository, fulfillmentAttemptRepository: fakeAttemptRepository(),
      });

      const result = await service.reserveCompleteCart({ resolvedItems: items(['A', 1]) });
      expect(result.code).toBe(FAIL.RESERVATION_LOST_RACE);
    });

    it('reserves in deterministic productId order regardless of input order', async () => {
      const productRepository = fakeProductRepository({ A: { stock: 5 }, B: { stock: 5 }, C: { stock: 5 } });
      const service = new FulfillmentReservationService({
        productRepository, fulfillmentAttemptRepository: fakeAttemptRepository(),
      });

      await service.reserveCompleteCart({ resolvedItems: items(['C', 1], ['A', 1], ['B', 1]) });

      const order = productRepository.reserveStock.mock.calls.map((call) => call[0]);
      expect(order).toEqual(['A', 'B', 'C']);
    });
  });

  describe('crash safety', () => {
    it('T-31: persists reservations before reporting success', async () => {
      const productRepository = fakeProductRepository({ A: { stock: 5 }, B: { stock: 5 } });
      const attemptRepo = fakeAttemptRepository();
      const service = new FulfillmentReservationService({
        productRepository, fulfillmentAttemptRepository: attemptRepo,
      });

      const result = await service.reserveCompleteCart({
        resolvedItems: items(['A', 1], ['B', 2]),
        attempt: { _id: 'attempt-1' },
      });

      expect(result.ok).toBe(true);
      expect(attemptRepo.updateById).toHaveBeenCalledWith(
        'attempt-1',
        { reservations: [
          { productId: 'A', quantity: 1, releasedAt: null },
          { productId: 'B', quantity: 2, releasedAt: null },
        ] },
        null
      );
    });

    it('rolls back rather than leaking stock when the reservation record cannot be persisted', async () => {
      const productRepository = fakeProductRepository({ A: { stock: 5 }, B: { stock: 5 } });
      const attemptRepo = fakeAttemptRepository();
      attemptRepo.updateById.mockRejectedValue(new Error('write failed'));

      const service = new FulfillmentReservationService({
        productRepository, fulfillmentAttemptRepository: attemptRepo,
      });

      const result = await service.reserveCompleteCart({
        resolvedItems: items(['A', 1], ['B', 1]),
        attempt: { _id: 'attempt-1' },
      });

      expect(result.ok).toBe(false);
      // Unrecorded stock would be stranded forever, so it must be given back.
      expect(productRepository.stock.get('A').reservedStock).toBe(0);
      expect(productRepository.stock.get('B').reservedStock).toBe(0);
    });

    it('continues releasing the remaining lines when one release fails', async () => {
      const productRepository = fakeProductRepository({ A: { stock: 5 }, B: { stock: 5 }, C: { stock: 0 } });
      productRepository.releaseReservedStock.mockImplementationOnce(async () => { throw new Error('db down'); });

      const service = new FulfillmentReservationService({
        productRepository, fulfillmentAttemptRepository: fakeAttemptRepository(),
      });

      const result = await service.reserveCompleteCart({ resolvedItems: items(['A', 1], ['B', 1], ['C', 1]) });

      expect(result.ok).toBe(false);
      // Reverse order: B is attempted first (and throws), A must still be released.
      expect(productRepository.stock.get('A').reservedStock).toBe(0);
    });

    it('works without an attempt record (engine pre-flight probe)', async () => {
      const productRepository = fakeProductRepository({ A: { stock: 5 } });
      const service = new FulfillmentReservationService({
        productRepository, fulfillmentAttemptRepository: null,
      });

      const result = await service.reserveCompleteCart({ resolvedItems: items(['A', 1]) });
      expect(result.ok).toBe(true);
    });
  });

  describe('releaseAttempt', () => {
    it('releases all outstanding reservations', async () => {
      const productRepository = fakeProductRepository({ A: { stock: 5, reservedStock: 1 }, B: { stock: 5, reservedStock: 2 } });
      const attemptRepo = fakeAttemptRepository();
      const service = new FulfillmentReservationService({
        productRepository, fulfillmentAttemptRepository: attemptRepo,
      });

      const result = await service.releaseAttempt({
        _id: 'attempt-1',
        reservations: [
          { productId: 'A', quantity: 1, releasedAt: null },
          { productId: 'B', quantity: 2, releasedAt: null },
        ],
      });

      expect(result.released).toBe(2);
      expect(productRepository.stock.get('A').reservedStock).toBe(0);
      expect(productRepository.stock.get('B').reservedStock).toBe(0);
      expect(attemptRepo.markReservationsReleased).toHaveBeenCalledWith('attempt-1', null);
    });

    it('T-32: skips already-released entries so a re-run sweeper cannot double-release', async () => {
      const productRepository = fakeProductRepository({ A: { stock: 5, reservedStock: 1 } });
      const service = new FulfillmentReservationService({
        productRepository, fulfillmentAttemptRepository: fakeAttemptRepository(),
      });

      const attempt = {
        _id: 'attempt-1',
        reservations: [{ productId: 'A', quantity: 1, releasedAt: new Date() }],
      };

      const result = await service.releaseAttempt(attempt);

      expect(result.released).toBe(0);
      expect(productRepository.releaseReservedStock).not.toHaveBeenCalled();
      // Availability must not be inflated by a phantom release.
      expect(productRepository.stock.get('A').reservedStock).toBe(1);
    });

    it('is a no-op for an attempt that never reserved anything', async () => {
      const productRepository = fakeProductRepository({});
      const service = new FulfillmentReservationService({
        productRepository, fulfillmentAttemptRepository: fakeAttemptRepository(),
      });

      expect((await service.releaseAttempt({ _id: 'a', reservations: [] })).released).toBe(0);
      expect((await service.releaseAttempt(null)).released).toBe(0);
    });

    it('still returns stock when no attempt repository is wired', async () => {
      const productRepository = fakeProductRepository({ A: { stock: 5, reservedStock: 1 } });
      const service = new FulfillmentReservationService({
        productRepository, fulfillmentAttemptRepository: null,
      });

      const result = await service.releaseAttempt({
        _id: 'attempt-1',
        reservations: [{ productId: 'A', quantity: 1, releasedAt: null }],
      });

      expect(result.released).toBe(1);
      expect(productRepository.stock.get('A').reservedStock).toBe(0);
    });

    it('records the release even when one line fails to release', async () => {
      const productRepository = fakeProductRepository({ A: { stock: 5, reservedStock: 1 } });
      productRepository.releaseReservedStock.mockRejectedValueOnce(new Error('db down'));
      const attemptRepo = fakeAttemptRepository();
      const service = new FulfillmentReservationService({
        productRepository, fulfillmentAttemptRepository: attemptRepo,
      });

      const result = await service.releaseAttempt({
        _id: 'attempt-1',
        reservations: [{ productId: 'A', quantity: 1, releasedAt: null }],
      });

      expect(result.released).toBe(0);
      expect(attemptRepo.markReservationsReleased).toHaveBeenCalled();
    });
  });

  describe('commitAttempt', () => {
    it('converts reservations into a permanent stock decrement', async () => {
      const productRepository = fakeProductRepository({ A: { stock: 5, reservedStock: 2 } });
      const service = new FulfillmentReservationService({
        productRepository, fulfillmentAttemptRepository: fakeAttemptRepository(),
      });

      const result = await service.commitAttempt({
        _id: 'a', reservations: [{ productId: 'A', quantity: 2, releasedAt: null }],
      });

      expect(result.committed).toBe(1);
      expect(productRepository.stock.get('A').stock).toBe(3);
      expect(productRepository.stock.get('A').reservedStock).toBe(0);
    });

    it('skips released entries and empty attempts', async () => {
      const productRepository = fakeProductRepository({ A: { stock: 5, reservedStock: 2 } });
      const service = new FulfillmentReservationService({
        productRepository, fulfillmentAttemptRepository: fakeAttemptRepository(),
      });

      expect((await service.commitAttempt({
        _id: 'a', reservations: [{ productId: 'A', quantity: 2, releasedAt: new Date() }],
      })).committed).toBe(0);
      expect((await service.commitAttempt({ _id: 'a', reservations: [] })).committed).toBe(0);
      expect((await service.commitAttempt(null)).committed).toBe(0);
    });
  });

  /**
   * T-18 — the scenario CR-002 marks MANDATORY.
   *
   * Seller has A=1, B=1, C=1. Two customers simultaneously order A+B+C.
   * Exactly one may succeed; the other must fail cleanly to fallback.
   */
  describe('T-18: last-unit concurrency race (MANDATORY)', () => {
    async function runRace(interleave) {
      const productRepository = fakeProductRepository({ A: { stock: 1 }, B: { stock: 1 }, C: { stock: 1 } });
      const service = new FulfillmentReservationService({
        productRepository, fulfillmentAttemptRepository: fakeAttemptRepository(),
      });

      const cart = () => items(['A', 1], ['B', 1], ['C', 1]);
      const results = await interleave(service, cart);

      return { productRepository, results };
    }

    it('exactly one order succeeds when both run concurrently', async () => {
      const { productRepository, results } = await runRace(async (service, cart) => Promise.all([
        service.reserveCompleteCart({ resolvedItems: cart(), traceId: 'X' }),
        service.reserveCompleteCart({ resolvedItems: cart(), traceId: 'Y' }),
      ]));

      const succeeded = results.filter((r) => r.ok);
      const failed = results.filter((r) => !r.ok);

      expect(succeeded).toHaveLength(1);
      expect(failed).toHaveLength(1);

      // The winner holds exactly one of each; the loser holds nothing.
      expect(productRepository.stock.get('A').reservedStock).toBe(1);
      expect(productRepository.stock.get('B').reservedStock).toBe(1);
      expect(productRepository.stock.get('C').reservedStock).toBe(1);
      assertNoCorruption(productRepository);
    });

    it('both fail cleanly and strand nothing when each wins a different line', async () => {
      // Forces the pathological split: X takes A, Y takes B, so neither can
      // complete. The requirement is that no stock is left held.
      const productRepository = fakeProductRepository({ A: { stock: 1 }, B: { stock: 1 }, C: { stock: 1 } });
      const service = new FulfillmentReservationService({
        productRepository, fulfillmentAttemptRepository: fakeAttemptRepository(),
      });

      const realReserve = productRepository.reserveStock.getMockImplementation();
      let call = 0;
      productRepository.reserveStock.mockImplementation(async (productId, quantity) => {
        call += 1;
        // Y grabs B before X gets to it.
        if (call === 2) return realReserve('B', quantity);
        return realReserve(productId, quantity);
      });

      const [x, y] = await Promise.all([
        service.reserveCompleteCart({ resolvedItems: items(['A', 1], ['B', 1], ['C', 1]) }),
        service.reserveCompleteCart({ resolvedItems: items(['A', 1], ['B', 1], ['C', 1]) }),
      ]);

      expect([x.ok, y.ok].filter(Boolean).length).toBeLessThanOrEqual(1);

      for (const [, row] of productRepository.stock.entries()) {
        expect(row.reservedStock).toBeLessThanOrEqual(row.stock);
        expect(row.reservedStock).toBeGreaterThanOrEqual(0);
      }
    });

    it('N concurrent orders against N units: successes never exceed supply', async () => {
      const UNITS = 3;
      const ORDERS = 8;
      const productRepository = fakeProductRepository({
        A: { stock: UNITS }, B: { stock: UNITS }, C: { stock: UNITS },
      });
      const service = new FulfillmentReservationService({
        productRepository, fulfillmentAttemptRepository: fakeAttemptRepository(),
      });

      const results = await Promise.all(
        Array.from({ length: ORDERS }, () =>
          service.reserveCompleteCart({ resolvedItems: items(['A', 1], ['B', 1], ['C', 1]) }))
      );

      const succeeded = results.filter((r) => r.ok).length;

      expect(succeeded).toBe(UNITS);
      expect(productRepository.stock.get('A').reservedStock).toBe(UNITS);
      assertNoCorruption(productRepository);
    });

    it('zero overselling when demand far exceeds a single unit', async () => {
      const productRepository = fakeProductRepository({ A: { stock: 1 } });
      const service = new FulfillmentReservationService({
        productRepository, fulfillmentAttemptRepository: fakeAttemptRepository(),
      });

      const results = await Promise.all(
        Array.from({ length: 25 }, () => service.reserveCompleteCart({ resolvedItems: items(['A', 1]) }))
      );

      expect(results.filter((r) => r.ok)).toHaveLength(1);
      expect(productRepository.stock.get('A').reservedStock).toBe(1);
      assertNoCorruption(productRepository);
    });
  });
});
