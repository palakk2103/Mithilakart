/**
 * CR-002 — LAYER 2: real MongoDB concurrency and atomicity.
 *
 * Layer 1 proves the algorithm against an in-memory double. THIS file is what
 * proves the database actually behaves as assumed: that `reserveStock` is a
 * genuine single-document conditional update and that two concurrent callers
 * cannot both take the last unit.
 *
 * Skips entirely without MONGO_TEST_URI so CI without a database stays green.
 * Requires a REPLICA SET — transactions are unavailable on a standalone mongod.
 */
const mongoose = require('mongoose');

const MONGO_URI = process.env.MONGO_TEST_URI;
const describeLayer2 = MONGO_URI ? describe : describe.skip;

const Product = require('../../src/models/Product');
const Seller = require('../../src/models/Seller');
const { ProductRepository } = require('../../src/repositories/ProductRepository');
const { FulfillmentAttemptRepository } = require('../../src/repositories/FulfillmentAttemptRepository');
const { FulfillmentReservationService } = require('../../src/services/fulfillment/FulfillmentReservationService');

const runId = `l2-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

/** Guard: never let this suite loose on a production database. */
function assertSafeTarget(uri) {
  const dbName = (uri.split('/').pop() || '').split('?')[0].toLowerCase();
  if (dbName.includes('prod')) {
    throw new Error(`Refusing to run Layer 2 tests against database "${dbName}"`);
  }
}

describeLayer2('CR-002 Layer 2 — real MongoDB atomicity', () => {
  let productRepository;
  let attemptRepository;
  let reservationService;
  let sellerId;

  beforeAll(async () => {
    assertSafeTarget(MONGO_URI);
    await mongoose.connect(MONGO_URI, { serverSelectionTimeoutMS: 15000 });

    productRepository = new ProductRepository();
    attemptRepository = new FulfillmentAttemptRepository();
    reservationService = new FulfillmentReservationService({
      productRepository, fulfillmentAttemptRepository: attemptRepository,
    });

    const seller = await Seller.create({
      name: `${runId}-seller`,
      email: `${runId}@layer2.test`,
      passwordHash: 'x',
      status: 'active',
      kycStatus: 'approved',
      latitude: 28.6139,
      longitude: 77.2090,
    });
    sellerId = seller._id;
  }, 60000);

  afterAll(async () => {
    if (!mongoose.connection.readyState) return;
    // Namespaced cleanup — touches only what this run created.
    await Product.deleteMany({ sku: new RegExp(`^${runId}`) });
    await Seller.deleteMany({ email: new RegExp(`^${runId}`) });
    await mongoose.connection.db.collection('fulfillment_attempts')
      .deleteMany({ orderId: new RegExp(`^${runId}`) }).catch(() => {});
    await mongoose.disconnect();
  }, 60000);

  /** Fresh product with a known stock level. */
  async function makeProduct(label, stock) {
    return Product.create({
      sellerId,
      title: `${runId}-${label}`,
      sku: `${runId}-${label}`,
      price: 100,
      mrp: 120,
      stock,
      reservedStock: 0,
      categoryId: new mongoose.Types.ObjectId(),
      status: 'approved',
    });
  }

  async function readStock(id) {
    const p = await Product.findById(id).lean();
    return { stock: p.stock, reservedStock: p.reservedStock };
  }

  /** The four invariants CR-002 must never violate. */
  async function assertInvariants(ids) {
    for (const id of ids) {
      const { stock, reservedStock } = await readStock(id);
      expect(stock).toBeGreaterThanOrEqual(0);           // no negative inventory
      expect(reservedStock).toBeGreaterThanOrEqual(0);
      expect(reservedStock).toBeLessThanOrEqual(stock);  // no overselling
    }
  }

  const items = (...pairs) => pairs.map(([productId, quantity]) => ({ productId, quantity }));

  it('L2-1: reserveStock is a real atomic conditional update', async () => {
    const p = await makeProduct('atomic', 5);

    await productRepository.reserveStock(p._id, 3);
    expect(await readStock(p._id)).toEqual({ stock: 5, reservedStock: 3 });

    // Over-reserving beyond availability must be refused by the DB predicate.
    await expect(productRepository.reserveStock(p._id, 3)).rejects.toMatchObject({
      code: 'OUT_OF_STOCK',
    });
    expect(await readStock(p._id)).toEqual({ stock: 5, reservedStock: 3 });

    await assertInvariants([p._id]);
  }, 30000);

  it('L2-2: concurrent reservations never exceed supply', async () => {
    const p = await makeProduct('concurrent', 5);

    const results = await Promise.allSettled(
      Array.from({ length: 20 }, () => productRepository.reserveStock(p._id, 1))
    );

    const ok = results.filter((r) => r.status === 'fulfilled').length;
    expect(ok).toBe(5);
    expect(await readStock(p._id)).toEqual({ stock: 5, reservedStock: 5 });
  }, 60000);

  it('L2-3: last-unit race has exactly one winner', async () => {
    const p = await makeProduct('lastunit', 1);

    const results = await Promise.allSettled([
      productRepository.reserveStock(p._id, 1),
      productRepository.reserveStock(p._id, 1),
    ]);

    expect(results.filter((r) => r.status === 'fulfilled')).toHaveLength(1);
    expect((await readStock(p._id)).reservedStock).toBe(1);
    await assertInvariants([p._id]);
  }, 30000);

  it('L2-4: multi-product complete cart reserves all or nothing', async () => {
    const a = await makeProduct('cart-a', 5);
    const b = await makeProduct('cart-b', 5);
    const c = await makeProduct('cart-c', 5);

    const result = await reservationService.reserveCompleteCart({
      resolvedItems: items([a._id, 1], [b._id, 2], [c._id, 3]),
    });

    expect(result.ok).toBe(true);
    expect((await readStock(a._id)).reservedStock).toBe(1);
    expect((await readStock(b._id)).reservedStock).toBe(2);
    expect((await readStock(c._id)).reservedStock).toBe(3);
    await assertInvariants([a._id, b._id, c._id]);
  }, 30000);

  it('L2-5: a failing line rolls back every earlier reservation', async () => {
    const a = await makeProduct('rb-a', 5);
    const b = await makeProduct('rb-b', 5);
    const c = await makeProduct('rb-c', 0); // cannot be satisfied

    const result = await reservationService.reserveCompleteCart({
      resolvedItems: items([a._id, 1], [b._id, 1], [c._id, 1]),
    });

    expect(result.ok).toBe(false);
    // No stranded reservation, no partial hold.
    expect((await readStock(a._id)).reservedStock).toBe(0);
    expect((await readStock(b._id)).reservedStock).toBe(0);
    await assertInvariants([a._id, b._id, c._id]);
  }, 30000);

  it('L2-6: the next seller reserves cleanly after the first fails', async () => {
    const s1a = await makeProduct('s1-a', 5);
    const s1b = await makeProduct('s1-b', 0); // seller 1 cannot fulfil
    const s2a = await makeProduct('s2-a', 5);
    const s2b = await makeProduct('s2-b', 5);

    const first = await reservationService.reserveCompleteCart({
      resolvedItems: items([s1a._id, 1], [s1b._id, 1]),
    });
    expect(first.ok).toBe(false);
    expect((await readStock(s1a._id)).reservedStock).toBe(0);

    const second = await reservationService.reserveCompleteCart({
      resolvedItems: items([s2a._id, 1], [s2b._id, 1]),
    });
    expect(second.ok).toBe(true);
    await assertInvariants([s1a._id, s1b._id, s2a._id, s2b._id]);
  }, 30000);

  it('L2-7: warehouse reserves when no seller can', async () => {
    const sellerStock = await makeProduct('wh-seller', 0);
    const warehouseStock = await makeProduct('wh-warehouse', 10);

    const sellerAttempt = await reservationService.reserveCompleteCart({
      resolvedItems: items([sellerStock._id, 1]),
    });
    expect(sellerAttempt.ok).toBe(false);

    const warehouseAttempt = await reservationService.reserveCompleteCart({
      resolvedItems: items([warehouseStock._id, 1]),
    });
    expect(warehouseAttempt.ok).toBe(true);
    expect((await readStock(warehouseStock._id)).reservedStock).toBe(1);
  }, 30000);

  it('L2-8: concurrent complete-cart attempts — only one holds the cart', async () => {
    const a = await makeProduct('cc-a', 1);
    const b = await makeProduct('cc-b', 1);
    const c = await makeProduct('cc-c', 1);

    const cart = () => items([a._id, 1], [b._id, 1], [c._id, 1]);

    const results = await Promise.all([
      reservationService.reserveCompleteCart({ resolvedItems: cart() }),
      reservationService.reserveCompleteCart({ resolvedItems: cart() }),
    ]);

    // At most one can hold all three; the other must have released everything.
    expect(results.filter((r) => r.ok).length).toBeLessThanOrEqual(1);

    for (const id of [a._id, b._id, c._id]) {
      expect((await readStock(id)).reservedStock).toBeLessThanOrEqual(1);
    }
    await assertInvariants([a._id, b._id, c._id]);
  }, 60000);

  it('L2-9: releasing an attempt twice cannot double-release', async () => {
    const p = await makeProduct('dup-release', 5);

    const attempt = await attemptRepository.create({
      fulfillmentId: new mongoose.Types.ObjectId(),
      orderId: new mongoose.Types.ObjectId(),
      attemptNumber: 1,
      kind: 'seller',
      status: 'reserved',
    });

    const reserved = await reservationService.reserveCompleteCart({
      resolvedItems: items([p._id, 2]), attempt,
    });
    expect(reserved.ok).toBe(true);
    expect((await readStock(p._id)).reservedStock).toBe(2);

    const fresh = await attemptRepository.findById(attempt._id);
    await reservationService.releaseAttempt(fresh);
    await reservationService.releaseAttempt(fresh); // re-run sweeper

    // Availability must not be inflated by a phantom second release.
    expect((await readStock(p._id)).reservedStock).toBe(0);
    await assertInvariants([p._id]);
  }, 30000);

  it('L2-10: commit converts reservation into a permanent decrement exactly once', async () => {
    const p = await makeProduct('commit', 5);

    const attempt = await attemptRepository.create({
      fulfillmentId: new mongoose.Types.ObjectId(),
      orderId: new mongoose.Types.ObjectId(),
      attemptNumber: 1,
      kind: 'seller',
      status: 'reserved',
    });

    await reservationService.reserveCompleteCart({ resolvedItems: items([p._id, 2]), attempt });
    const fresh = await attemptRepository.findById(attempt._id);
    await reservationService.commitAttempt(fresh);

    expect(await readStock(p._id)).toEqual({ stock: 3, reservedStock: 0 });
    await assertInvariants([p._id]);
  }, 30000);
});
