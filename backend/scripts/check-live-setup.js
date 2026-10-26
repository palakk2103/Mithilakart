require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);

  console.log('--- ADMIN USERS ---');
  const admins = await mongoose.connection.collection('admin_users').find({}).toArray();
  for (const a of admins) {
    const isMatch = await bcrypt.compare('Admin@12345', a.passwordHash || '');
    console.log('Admin:', a.email, '| status:', a.status, '| password matches Admin@12345:', isMatch);
  }

  console.log('\n--- TARGET SELLERS ---');
  const targetEmails = [
    'vazahat.seller@mithilakart.com',
    'vazahat@mithilakart.com',
    'standard.seller@mithilakart.com',
    'warehouse@mithilakart.com'
  ];

  for (const email of targetEmails) {
    const s = await mongoose.connection.collection('sellers').findOne({ email });
    if (!s) {
      console.log('Seller NOT FOUND:', email);
      continue;
    }
    const match12345678 = await bcrypt.compare('12345678', s.passwordHash || '');
    const matchSeller12345 = await bcrypt.compare('Seller@12345', s.passwordHash || '');
    console.log({
      email: s.email,
      name: s.name,
      storeName: s.storeName,
      phone: s.phone,
      isWarehouse: s.isWarehouse,
      lat: s.latitude,
      lng: s.longitude,
      radius: s.fulfillmentRadiusKm,
      status: s.status,
      kycStatus: s.kycStatus,
      isOnline: s.isOnline,
      isAcceptingOrders: s.isAcceptingOrders,
      quickEligible: s.quickCommerceEligible,
      groceryEligible: s.groceryEligible,
      mithilakEligible: s.mithilakEligible,
      matches12345678: match12345678,
      matchesSeller12345: matchSeller12345
    });
  }

  console.log('\n--- DELIVERY PARTNERS ---');
  const targetPhones = ['9827607086', '9123456789'];
  for (const phone of targetPhones) {
    const r = await mongoose.connection.collection('delivery_partners').findOne({ phone });
    if (!r) {
      console.log('Rider NOT FOUND:', phone);
      continue;
    }
    console.log({
      name: r.name,
      phone: r.phone,
      status: r.status,
      isOnline: r.isOnline,
      lat: r.latitude,
      lng: r.longitude,
      location: r.location
    });
  }

  console.log('\n--- CUSTOMER (9827607086) ---');
  const user = await mongoose.connection.collection('users').findOne({ phone: '9827607086' });
  if (user) {
    console.log({
      id: user._id,
      name: user.name,
      phone: user.phone,
      email: user.email,
      status: user.status
    });
    const addresses = await mongoose.connection.collection('user_addresses').find({ userId: user._id }).toArray();
    console.log('Customer addresses (' + addresses.length + '):');
    addresses.forEach(a => console.log({
      id: a._id,
      addressLine1: a.addressLine1,
      city: a.city,
      state: a.state,
      pincode: a.pincode,
      isDefault: a.isDefault,
      coords: a.location?.coordinates
    }));
  } else {
    console.log('Customer not found with phone 9827607086');
  }

  await mongoose.disconnect();
}

run().catch(console.error);
