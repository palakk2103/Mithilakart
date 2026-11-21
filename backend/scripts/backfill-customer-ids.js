/**
 * One-off: give every EXISTING customer a permanent customer id (MK000001…),
 * oldest customer first, and copy it onto their past orders.
 * New customers get theirs automatically when they register.
 *
 * Safe to re-run: customers that already have an id are skipped, and the
 * counter is only ever moved forward.
 *
 * Usage:  node scripts/backfill-customer-ids.js            (dry run, changes nothing)
 *         node scripts/backfill-customer-ids.js --apply    (writes)
 */
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../src/models/User');
const Order = require('../src/models/Order');
const Counter = require('../src/models/Counter');
const { formatCustomerId, COUNTER_NAME } = require('../src/utils/customerId');

const APPLY = process.argv.includes('--apply');

async function main() {
  await mongoose.connect(process.env.MONGODB_URI || process.env.MONGO_URI);

  const existing = await Counter.findById(COUNTER_NAME).lean();
  let seq = existing?.seq || 0;

  const missing = await User.find({ $or: [{ customerId: null }, { customerId: { $exists: false } }] })
    .sort({ createdAt: 1, _id: 1 })
    .select('_id name phone email createdAt')
    .lean();

  console.log(`${APPLY ? 'APPLY' : 'DRY RUN'}: ${missing.length} customer(s) without an id; counter currently at ${seq}`);

  let assigned = 0;
  for (const user of missing) {
    seq += 1;
    const customerId = formatCustomerId(seq);
    if (assigned < 5) console.log(`  ${customerId} -> ${user.name || '(no name)'} ${user.phone || user.email || ''}`);
    if (APPLY) {
      // $set only: customerId is immutable on the schema, so bypass save().
      await User.collection.updateOne({ _id: user._id, customerId: { $in: [null, undefined] } }, { $set: { customerId } });
      await Order.collection.updateMany({ userId: user._id, customerId: { $in: [null, undefined] } }, { $set: { customerId } });
    }
    assigned += 1;
  }

  if (APPLY && assigned) {
    await Counter.updateOne({ _id: COUNTER_NAME }, { $max: { seq } }, { upsert: true });
  }
  if (APPLY) {
    // Past orders of customers that already had an id (e.g. registered after the feature shipped).
    const withIds = await User.find({ customerId: { $ne: null } }).select('_id customerId').lean();
    for (const u of withIds) {
      await Order.collection.updateMany({ userId: u._id, customerId: { $in: [null, undefined] } }, { $set: { customerId: u.customerId } });
    }
  }

  console.log(`${APPLY ? 'Assigned' : 'Would assign'} ${assigned} id(s)${APPLY ? `; counter is now ${seq}` : ''}.`);
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
