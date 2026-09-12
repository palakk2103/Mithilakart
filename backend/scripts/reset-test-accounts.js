require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to DB');

  const sellerHash = await bcrypt.hash('Seller@12345', 10);
  const adminHash = await bcrypt.hash('Admin@12345', 10);

  // 1. Reset Amit Seller
  const resAmit = await mongoose.connection.collection('sellers').updateOne(
    { email: 'amit.seller@mithilakart.com' },
    {
      $set: {
        passwordHash: sellerHash,
        failedLoginAttempts: 0,
        lockUntil: null,
        status: 'active',
        kycStatus: 'approved',
        isAcceptingOrders: true,
        quickCommerceEligible: true,
      }
    }
  );
  console.log('Updated Amit Seller:', resAmit.matchedCount);

  // 2. Reset Multi-tier Sellers (A, B, C, D, Warehouse)
  const multiEmails = [
    'seller.a@mithilakart.com',
    'seller.b@mithilakart.com',
    'seller.c@mithilakart.com',
    'seller.d@mithilakart.com',
    'warehouse@mithilakart.com',
    'standard.seller@mithilakart.com',
  ];
  const resMulti = await mongoose.connection.collection('sellers').updateMany(
    { email: { $in: multiEmails } },
    {
      $set: {
        passwordHash: sellerHash,
        failedLoginAttempts: 0,
        lockUntil: null,
        status: 'active',
        kycStatus: 'approved',
        isAcceptingOrders: true,
        quickCommerceEligible: true,
      }
    }
  );
  console.log('Updated Multi-tier Sellers:', resMulti.matchedCount);

  // 3. Reset Admin
  const resAdmin = await mongoose.connection.collection('admin_users').updateOne(
    { email: 'palakpatel0342@gmail.com' },
    {
      $set: {
        passwordHash: adminHash,
        failedLoginAttempts: 0,
        lockUntil: null,
        status: 'active',
      }
    }
  );
  console.log('Updated Admin:', resAdmin.matchedCount);

  // 4. Ensure Customer exists and active
  await mongoose.connection.collection('users').updateOne(
    { phone: '9999999999' },
    {
      $set: {
        status: 'active',
        isVerified: true,
      }
    },
    { upsert: true }
  );
  console.log('Customer 9999999999 verified active');

  // 5. Ensure Delivery Partner exists and active
  await mongoose.connection.collection('delivery_partners').updateOne(
    { phone: '9123456789' },
    {
      $set: {
        status: 'approved',
        isApproved: true,
        isActive: true,
        isOnline: true,
      }
    },
    { upsert: true }
  );
  console.log('Delivery Partner 9123456789 active');

  // 6. Fix Test Customer Address 6a844bc0081d5cb31a8fa2a8 to be in Patna near Amit Seller
  const resAddr = await mongoose.connection.collection('user_addresses').updateOne(
    { _id: new mongoose.Types.ObjectId('6a844bc0081d5cb31a8fa2a8') },
    {
      $set: {
        city: 'Patna',
        state: 'Bihar',
        pincode: '800001',
        addressLine: 'Boring Road, Patna',
        latitude: 25.6000,
        longitude: 85.1400,
      }
    }
  );
  console.log('Updated test customer address coordinates:', resAddr.matchedCount);

  await mongoose.disconnect();
}

run().catch(console.error);
