/**
 * Assign a packed order to delivery partners (dev / ops helper).
 * Usage: node scripts/assign-order-to-delivery.js [orderNumber] [partnerPhone]
 */
require('dotenv').config();
const mongoose = require('mongoose');

const ORDER_NUMBER = process.argv[2] || 'MK-1784635715660-FC8B6A47';
const PARTNER_PHONE = process.argv[3] || '9123456789';

async function main() {
  await mongoose.connect(process.env.MONGODB_URI);

  const Order = require('../src/models/Order');
  const DeliveryPartner = require('../src/models/DeliveryPartner');
  const DeliveryAssignment = require('../src/models/DeliveryAssignment');
  const { DEFAULT_DELIVERY_EARNING_AMOUNT, ASSIGNMENT_STATUS } = require('../src/constants/delivery');

  const order = await Order.findOne({ orderNumber: ORDER_NUMBER });
  if (!order) {
    throw new Error(`Order not found: ${ORDER_NUMBER}`);
  }

  const partner = await DeliveryPartner.findOne({ phone: PARTNER_PHONE, deletedAt: null });
  if (!partner) {
    throw new Error(`Delivery partner not found: ${PARTNER_PHONE}`);
  }

  if (!['packed', 'confirmed'].includes(order.status)) {
    throw new Error(`Order status must be packed or confirmed, got: ${order.status}`);
  }

  await Order.updateOne(
    { _id: order._id },
    { fulfilmentType: 'local_delivery' }
  );

  await DeliveryPartner.updateOne(
    { _id: partner._id },
    { isOnline: true }
  );

  let assignment = await DeliveryAssignment.findOne({ orderId: order._id, deletedAt: null });
  if (!assignment) {
    assignment = await DeliveryAssignment.create({
      orderId: order._id,
      status: ASSIGNMENT_STATUS.PENDING,
      earningAmount: DEFAULT_DELIVERY_EARNING_AMOUNT,
    });
  }

  console.log('Assigned order to delivery queue');
  console.log('  orderNumber:', order.orderNumber);
  console.log('  orderId:', String(order._id));
  console.log('  status:', order.status);
  console.log('  fulfilmentType: local_delivery');
  console.log('  partner:', partner.name || partner.phone, String(partner._id));
  console.log('  assignmentId:', String(assignment._id));
  console.log('  partner isOnline: true');
  console.log('\nDelivery app me Pending tab refresh karein aur order accept karein.');

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
