require('dotenv').config();
const mongoose = require('mongoose');
const DeliveryAssignment = require('../src/models/DeliveryAssignment');

async function clean() {
  await mongoose.connect(process.env.MONGODB_URI);

  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

  // 1. Cancel unassigned pending assignments older than 1 hour
  const res1 = await DeliveryAssignment.updateMany(
    {
      partnerId: null,
      status: { $in: ['pending', 'assigned'] },
      createdAt: { $lt: oneHourAgo },
    },
    { $set: { status: 'cancelled', cancelReason: 'Stale test order expired' } }
  );
  console.log('Cleaned up stale pending assignments:', res1.modifiedCount);

  // 2. Mark old historical assigned runs for this partner (older than 1 hour) as delivered
  const partnerId = '6a5e15b0d069a283d6c1f98e';
  const currentOrderId = '6aa2602af78404928863d382';
  const res2 = await DeliveryAssignment.updateMany(
    {
      partnerId,
      orderId: { $ne: new mongoose.Types.ObjectId(currentOrderId) },
      status: { $in: ['accepted', 'picked_up', 'assigned'] },
      createdAt: { $lt: oneHourAgo },
    },
    { $set: { status: 'delivered', deliveredAt: new Date() } }
  );
  console.log('Cleared old test active runs for partner:', res2.modifiedCount);

  process.exit(0);
}

clean().catch((err) => {
  console.error(err);
  process.exit(1);
});
