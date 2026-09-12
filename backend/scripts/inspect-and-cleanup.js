require('dotenv').config();
const mongoose = require('mongoose');
const DeliveryAssignment = require('../src/models/DeliveryAssignment');
const Order = require('../src/models/Order');

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to DB');

  const allUnassigned = await DeliveryAssignment.find({ partnerId: null }).lean();
  console.log('Total unassigned assignments:', allUnassigned.length);
  for (const a of allUnassigned) {
    const order = await Order.findById(a.orderId).lean();
    console.log({
      id: a._id,
      orderId: a.orderId,
      orderNumber: order?.orderNumber,
      orderStatus: order?.status,
      assignmentStatus: a.status,
      createdAt: a.createdAt,
    });
  }

  // Mark stale unassigned assignments older than 2 hours as 'cancelled' so they don't pop up
  const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
  const updated = await DeliveryAssignment.updateMany(
    {
      partnerId: null,
      status: { $in: ['pending', 'assigned'] },
      createdAt: { $lt: twoHoursAgo },
    },
    { $set: { status: 'cancelled', cancelReason: 'Offer expired / stale test run' } }
  );
  console.log('Cancelled stale test assignments:', updated.modifiedCount);

  process.exit(0);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
