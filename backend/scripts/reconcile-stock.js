/**
 * One-time repair of product stock after the COD inventory bug.
 *
 * Before the fix, an order confirmed inside checkout (Cash on Delivery) read
 * its items outside the checkout transaction, found none, and deducted
 * nothing — while still being flagged inventoryDeducted. Its checkout
 * reservation was never released, quick-commerce offers reserved the same
 * units again, and a customer cancel then ADDED stock that was never taken.
 *
 * reservedStock — always recomputed from what is genuinely held right now:
 *   - unpaid online orders still pending (checkout reservation), and
 *   - live fulfilment-attempt reservations of orders that were NOT deducted.
 *   Everything else is stale. With --apply, stale attempt reservations are
 *   also marked released so nothing releases them a second time later.
 *
 * stock — only with --fix-cod-stock --before=<ISO time the fix was deployed>.
 *   For every COD order placed before that time:
 *     - not cancelled (placed … delivered): the sale was never deducted → −qty
 *     - cancelled by the customer, or cancelled at/after the cutoff by anyone:
 *       the cancel added back units never taken → −qty
 *     - cancelled before the cutoff by seller/admin: no stock moved → nothing
 *   A product never goes below 0. Review the dry run first: if a seller has
 *   since typed in a corrected stock count by hand, skip that product.
 *
 * Usage:
 *   node scripts/reconcile-stock.js                       # dry run, reserved only
 *   node scripts/reconcile-stock.js --fix-cod-stock --before=2026-10-28T10:00:00+05:30
 *   … add --apply to write (a JSON backup of every changed product is saved first)
 *   … add --skip=SKU1,SKU2 to leave products alone
 */
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

const args = process.argv.slice(2);
const flag = (name) => args.includes(`--${name}`);
const option = (name) => (args.find((a) => a.startsWith(`--${name}=`)) || '').split('=').slice(1).join('=') || null;

const APPLY = flag('apply');
const FIX_COD_STOCK = flag('fix-cod-stock');
const BEFORE = option('before') ? new Date(option('before')) : null;
const SKIP = new Set((option('skip') || '').split(',').map((s) => s.trim()).filter(Boolean));

const LIVE_ATTEMPT = ['offered', 'reserved', 'accepted'];
const TERMINAL_FULFILLMENT = ['fulfilled', 'failed', 'cancelled'];

const key = (id) => String(id);
const add = (map, id, qty, why) => {
  const entry = map.get(key(id)) || { qty: 0, why: [] };
  entry.qty += qty;
  if (why) entry.why.push(why);
  map.set(key(id), entry);
};

async function main() {
  if (FIX_COD_STOCK && (!BEFORE || Number.isNaN(BEFORE.getTime()))) {
    throw new Error('--fix-cod-stock needs --before=<ISO date-time when the fix went live>');
  }

  await mongoose.connect(process.env.MONGODB_URI);
  const db = mongoose.connection.db;
  console.log(`Database: ${db.databaseName} | mode: ${APPLY ? 'APPLY' : 'dry run'}${FIX_COD_STOCK ? ` | COD stock fix for orders before ${BEFORE.toISOString()}` : ''}\n`);

  // The stock correction subtracts; running it twice would subtract twice.
  const runs = db.collection('maintenance_runs');
  const previousCodFix = FIX_COD_STOCK ? await runs.findOne({ name: 'reconcile-stock-cod' }) : null;
  if (previousCodFix && !flag('force')) {
    throw new Error(`The COD stock fix was already applied on ${previousCodFix.appliedAt.toISOString()} — refusing to subtract again (use --force only if you restored the backup).`);
  }

  const orders = db.collection('orders');
  const orderItems = db.collection('order_items');

  // ── reservedStock that is genuinely held ─────────────────────────────
  const held = new Map();

  const unpaid = await orders.find({
    status: 'pending', paymentStatus: 'pending', inventoryDeducted: { $ne: true }, deletedAt: null,
  }, { projection: { _id: 1, orderNumber: 1 } }).toArray();
  for (const order of unpaid) {
    const items = await orderItems.find({ orderId: order._id, deletedAt: null }).toArray();
    for (const it of items) add(held, it.productId, it.quantity, `unpaid ${order.orderNumber}`);
  }

  const staleAttemptEntries = [];
  const attempts = await db.collection('fulfillment_attempts').find({
    status: { $in: LIVE_ATTEMPT }, 'reservations.releasedAt': null,
  }).toArray();
  const fulfillments = new Map((await db.collection('order_fulfillments').find({
    _id: { $in: attempts.map((a) => a.fulfillmentId) },
  }).toArray()).map((f) => [key(f._id), f]));
  const attemptOrders = new Map((await orders.find({
    _id: { $in: attempts.map((a) => a.orderId) },
  }, { projection: { inventoryDeducted: 1, status: 1, orderNumber: 1 } }).toArray()).map((o) => [key(o._id), o]));

  for (const attempt of attempts) {
    const order = attemptOrders.get(key(attempt.orderId));
    const fulfillment = fulfillments.get(key(attempt.fulfillmentId));
    const stillNeeded = order && !order.inventoryDeducted
      && !['cancelled', 'delivered'].includes(order.status)
      && fulfillment && !TERMINAL_FULFILLMENT.includes(fulfillment.state);
    for (const entry of attempt.reservations || []) {
      if (entry.releasedAt || entry.heldByOrder || entry.settledAt) continue;
      if (stillNeeded) add(held, entry.productId, entry.quantity, `offer on ${order.orderNumber}`);
      else staleAttemptEntries.push({ attemptId: attempt._id, productId: entry.productId });
    }
  }

  // ── COD stock that was never deducted ────────────────────────────────
  const stockDelta = new Map();
  if (FIX_COD_STOCK) {
    const codOrders = await orders.find({
      paymentMethod: 'cod', createdAt: { $lt: BEFORE }, status: { $ne: 'pending' }, deletedAt: null,
    }, { projection: { _id: 1, orderNumber: 1, status: 1, cancelledAt: 1 } }).toArray();
    const history = db.collection('order_status_history');

    for (const order of codOrders) {
      let reason = null;
      if (order.status !== 'cancelled') {
        reason = `sale never deducted (${order.orderNumber}, ${order.status})`;
      } else {
        const cancel = await history.findOne({ orderId: order._id, toStatus: 'cancelled' }, { sort: { createdAt: -1 } });
        const cancelledAt = order.cancelledAt || cancel?.createdAt;
        if (cancel?.changedBy === 'customer' || (cancelledAt && cancelledAt >= BEFORE)) {
          reason = `cancel added back undeducted units (${order.orderNumber})`;
        }
      }
      if (!reason) continue;
      const items = await orderItems.find({ orderId: order._id, deletedAt: null }).toArray();
      for (const it of items) add(stockDelta, it.productId, -it.quantity, reason);
    }
  }

  // ── Compare and report ───────────────────────────────────────────────
  const productIds = new Set([...held.keys(), ...stockDelta.keys()]);
  const mismatched = await db.collection('products').find({
    deletedAt: null,
    $or: [{ reservedStock: { $gt: 0 } }, { _id: { $in: [...productIds].map((id) => new mongoose.Types.ObjectId(id)) } }],
  }, { projection: { sku: 1, title: 1, stock: 1, reservedStock: 1 } }).toArray();

  const changes = [];
  for (const p of mismatched) {
    if (SKIP.has(p.sku)) continue;
    const reserved = held.get(key(p._id))?.qty || 0;
    const delta = stockDelta.get(key(p._id))?.qty || 0;
    const stock = Math.max(0, (p.stock || 0) + delta);
    const finalReserved = Math.min(reserved, stock);
    if (stock === (p.stock || 0) && finalReserved === (p.reservedStock || 0)) continue;
    changes.push({
      _id: p._id,
      sku: p.sku,
      title: p.title,
      before: { stock: p.stock || 0, reservedStock: p.reservedStock || 0 },
      after: { stock, reservedStock: finalReserved },
      why: [...(held.get(key(p._id))?.why || []), ...(stockDelta.get(key(p._id))?.why || [])].slice(0, 6),
    });
  }

  for (const c of changes) {
    console.log(`${c.sku || c._id}  ${c.title || ''}`);
    console.log(`   stock ${c.before.stock} → ${c.after.stock} | reserved ${c.before.reservedStock} → ${c.after.reservedStock}`);
    for (const why of c.why) console.log(`     · ${why}`);
  }
  console.log(`\n${changes.length} product(s) to correct, ${staleAttemptEntries.length} stale offer reservation(s) to close.`);

  if (!APPLY) {
    console.log('\nDry run — nothing written. Re-run with --apply to save.');
    await mongoose.disconnect();
    return;
  }

  const backup = path.join(__dirname, `stock-backup-${db.databaseName}-${Date.now()}.json`);
  fs.writeFileSync(backup, JSON.stringify(changes, null, 2));
  console.log(`Backup of previous values: ${backup}`);

  if (changes.length) {
    await db.collection('products').bulkWrite(changes.map((c) => ({
      updateOne: { filter: { _id: c._id }, update: { $set: { stock: c.after.stock, reservedStock: c.after.reservedStock } } },
    })));
  }
  for (const entry of staleAttemptEntries) {
    await db.collection('fulfillment_attempts').updateOne(
      { _id: entry.attemptId },
      { $set: { 'reservations.$[e].releasedAt': new Date() } },
      { arrayFilters: [{ 'e.productId': entry.productId, 'e.releasedAt': null }] }
    );
  }
  if (FIX_COD_STOCK) {
    await runs.insertOne({ name: 'reconcile-stock-cod', before: BEFORE, appliedAt: new Date(), products: changes.length, backup });
  }
  console.log('Applied.');
  await mongoose.disconnect();
}

main().catch(async (err) => {
  console.error(err.message);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
