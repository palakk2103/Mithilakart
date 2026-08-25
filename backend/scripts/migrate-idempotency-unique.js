/**
 * Enforces uniqueness on idempotencyKey across Order, WalletTransaction and
 * Refund — closes a real double-processing race under concurrent duplicate
 * requests. Found during the CR-002 master audit (2026-08-25): all three
 * fields were `index: true, sparse: true` but NOT `unique: true`, so a genuine
 * race (network retry, double-tap, replayed webhook) could create two
 * documents with the identical idempotency key — the exact failure the key
 * exists to prevent.
 *
 * Uses a PARTIAL index (`idempotencyKey: { $type: 'string' }`), not `sparse`.
 * First attempt used sparse+unique and failed live against `orders`: the
 * schema's `default: null` means most documents store an EXPLICIT null, not
 * an absent field, and `sparse` only excludes absent fields — so a
 * sparse+unique index still collided on the 145 real `idempotencyKey: null`
 * documents already in Atlas. The partial filter excludes non-string values
 * instead, which is what actually makes this safe. MongoDB rolled the failed
 * build back atomically; no broken index was left behind.
 *
 * `PaymentTransaction` is deliberately excluded: it already has an explicit
 * `unique: false` on `{ orderId, idempotencyKey }`, which looks intentional
 * (a single order may have multiple payment attempts sharing no key, or the
 * compound uniqueness is enforced differently) and needs its own dedicated
 * look before being touched — not bundled into this pass.
 *
 * Safe by construction: this script verifies zero pre-existing duplicate
 * non-null keys before syncing, and refuses to proceed (rather than fail
 * loudly mid-sync) if any are found.
 *
 * Usage: node scripts/migrate-idempotency-unique.js [--dry-run]
 */
require('dotenv').config();
const mongoose = require('mongoose');
const Order = require('../src/models/Order');
const WalletTransaction = require('../src/models/WalletTransaction');
const Refund = require('../src/models/Refund');

const DRY_RUN = process.argv.includes('--dry-run');

const TARGETS = [
  { name: 'orders', collection: 'orders', model: Order },
  { name: 'wallet_transactions', collection: 'wallet_transactions', model: WalletTransaction },
  { name: 'refunds', collection: 'refunds', model: Refund },
];

async function findDuplicates(collectionName) {
  return mongoose.connection.db.collection(collectionName).aggregate([
    { $match: { idempotencyKey: { $ne: null } } },
    { $group: { _id: '$idempotencyKey', count: { $sum: 1 }, ids: { $push: '$_id' } } },
    { $match: { count: { $gt: 1 } } },
  ]).toArray();
}

async function main() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/mithilakart';
  await mongoose.connect(uri);

  if (DRY_RUN) process.stdout.write('DRY RUN — no index changes will be applied.\n\n');

  for (const target of TARGETS) {
    const dupes = await findDuplicates(target.collection);

    if (dupes.length) {
      process.stdout.write(
        `${target.name}: BLOCKED — ${dupes.length} duplicate idempotencyKey group(s) exist. `
        + `Resolve manually before syncing (documents: ${JSON.stringify(dupes.slice(0, 3))}).\n`
      );
      continue;
    }

    if (DRY_RUN) {
      process.stdout.write(`${target.name}: 0 duplicates — would drop the old idempotencyKey_1 index and sync the new partial-unique one.\n`);
      continue;
    }

    // The pre-existing `idempotencyKey_1` index (plain or sparse, non-unique)
    // shares the new index's default name but not its options, so
    // syncIndexes() reports a conflict instead of replacing it. Drop it by
    // name first — safe: the new partial+unique index below covers every
    // query the old one did, plus the constraint.
    const existing = await target.model.collection.indexes();
    if (existing.some((i) => i.name === 'idempotencyKey_1')) {
      await target.model.collection.dropIndex('idempotencyKey_1');
      process.stdout.write(`${target.name}: dropped stale non-unique idempotencyKey_1 index.\n`);
    }

    await target.model.syncIndexes();
    process.stdout.write(`${target.name}: 0 duplicates — unique partial index synced.\n`);
  }

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
