/**
 * CR-002 master audit (2026-08-25) — LAYER 2: idempotencyKey uniqueness.
 *
 * Proves the fix for a real gap found during the audit: Order,
 * WalletTransaction and Refund all declared `idempotencyKey` as indexed but
 * NOT unique, so a genuine race (retried request, double-tap, replayed
 * webhook) could create two documents sharing the same idempotency key — the
 * exact failure that key exists to prevent.
 *
 * The fix uses a PARTIAL unique index (`idempotencyKey: { $type: 'string' }`),
 * not `sparse`, because the schema's `default: null` writes an explicit null
 * on most documents rather than omitting the field — sparse only excludes
 * absent fields, so sparse+unique still collided against the many
 * `idempotencyKey: null` documents already in production. This is a database
 * index behaviour, so — same as `FulfillmentReservationService` — it can only
 * be proven against a real MongoDB, not a mocked repository.
 *
 * Deliberately connects to MONGODB_URI (the real, already-migrated database),
 * not a separate MONGO_TEST_URI database, because this test verifies an index
 * that was migrated onto the real database via
 * `scripts/migrate-idempotency-unique.js` — a fresh test database would not
 * have it. This is safe: every write below uses a value with the `L2IDEMTEST-`
 * prefix, nothing pre-existing is ever read or modified, and every created
 * document is removed in `afterAll` regardless of pass/fail.
 *
 * Skips entirely without MONGODB_URI so CI without a database stays green.
 */
const mongoose = require('mongoose');

const MONGO_URI = process.env.MONGODB_URI;
const describeLayer2 = MONGO_URI ? describe : describe.skip;

const Order = require('../../src/models/Order');
const WalletTransaction = require('../../src/models/WalletTransaction');
const Refund = require('../../src/models/Refund');

const runId = `L2IDEMTEST-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

function assertSafeTarget(uri) {
  const dbName = (uri.split('/').pop() || '').split('?')[0].toLowerCase();
  if (dbName.includes('prod')) {
    throw new Error(`Refusing to run against database "${dbName}"`);
  }
}

describeLayer2('CR-002 audit Layer 2 — idempotencyKey uniqueness (real MongoDB)', () => {
  beforeAll(async () => {
    assertSafeTarget(MONGO_URI);
    await mongoose.connect(MONGO_URI, { serverSelectionTimeoutMS: 15000 });
  }, 30000);

  afterAll(async () => {
    if (!mongoose.connection.readyState) return;
    await Order.deleteMany({ idempotencyKey: new RegExp(`^${runId}`) });
    await WalletTransaction.deleteMany({ idempotencyKey: new RegExp(`^${runId}`) });
    await Refund.deleteMany({ idempotencyKey: new RegExp(`^${runId}`) });
    await mongoose.disconnect();
  }, 30000);

  it('L2-11: a second Order with the same idempotencyKey is rejected by the database', async () => {
    const key = `${runId}-order`;
    const base = {
      userId: new mongoose.Types.ObjectId(),
      orderNumber: `${runId}-1`,
      idempotencyKey: key,
    };

    await Order.create(base);
    await expect(Order.create({ ...base, orderNumber: `${runId}-2` }))
      .rejects.toMatchObject({ code: 11000 });
  }, 20000);

  it('L2-12: many Orders with idempotencyKey null coexist — the fix does not break the common case', async () => {
    const docs = await Order.insertMany([
      { userId: new mongoose.Types.ObjectId(), orderNumber: `${runId}-null-1`, idempotencyKey: null },
      { userId: new mongoose.Types.ObjectId(), orderNumber: `${runId}-null-2`, idempotencyKey: null },
      { userId: new mongoose.Types.ObjectId(), orderNumber: `${runId}-null-3` }, // field entirely absent
    ]);
    expect(docs).toHaveLength(3);
  }, 20000);

  it('L2-13: a second WalletTransaction with the same idempotencyKey is rejected — closes the double-credit race', async () => {
    const key = `${runId}-wallet`;
    const base = {
      walletId: new mongoose.Types.ObjectId(),
      userId: new mongoose.Types.ObjectId(),
      type: 'credit',
      amount: 10,
      balanceAfter: 10,
      referenceType: 'promotion',
      idempotencyKey: key,
    };

    await WalletTransaction.create(base);
    await expect(WalletTransaction.create(base)).rejects.toMatchObject({ code: 11000 });
  }, 20000);

  it('L2-14: a second Refund with the same idempotencyKey is rejected — closes the double-refund race', async () => {
    const key = `${runId}-refund`;
    const base = {
      returnId: new mongoose.Types.ObjectId(),
      orderId: new mongoose.Types.ObjectId(),
      userId: new mongoose.Types.ObjectId(),
      amount: 50,
      idempotencyKey: key,
    };

    await Refund.create(base);
    await expect(Refund.create(base)).rejects.toMatchObject({ code: 11000 });
  }, 20000);

  it('L2-15: concurrent duplicate-key inserts — exactly one wins, proving the constraint under a real race', async () => {
    const key = `${runId}-concurrent`;
    const attempt = () => WalletTransaction.create({
      walletId: new mongoose.Types.ObjectId(),
      userId: new mongoose.Types.ObjectId(),
      type: 'credit',
      amount: 5,
      balanceAfter: 5,
      referenceType: 'promotion',
      idempotencyKey: key,
    });

    const results = await Promise.allSettled([attempt(), attempt(), attempt(), attempt(), attempt()]);

    const fulfilled = results.filter((r) => r.status === 'fulfilled');
    const rejected = results.filter((r) => r.status === 'rejected');

    expect(fulfilled).toHaveLength(1);
    expect(rejected).toHaveLength(4);
    for (const r of rejected) expect(r.reason.code).toBe(11000);
  }, 20000);
});
