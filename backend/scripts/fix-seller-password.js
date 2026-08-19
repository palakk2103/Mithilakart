const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
require('dotenv').config();

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  const sellersCollection = mongoose.connection.collection('sellers');
  const seller = await sellersCollection.findOne({ email: 'amit.seller@mithilakart.com' });
  
  if (!seller) {
    console.error('Seller amit.seller@mithilakart.com not found!');
    process.exit(1);
  }

  const hash = await bcrypt.hash('Seller@12345', 10);
  await sellersCollection.updateOne(
    { _id: seller._id },
    {
      $set: {
        passwordHash: hash,
        failedLoginAttempts: 0,
        lockUntil: null,
        status: 'active',
        kycStatus: 'approved',
      },
    }
  );

  console.log('Password for amit.seller@mithilakart.com set to: Seller@12345');

  // Also verify all seeded sellers
  const allSellers = ['ravi.seller@mithilakart.com', 'priya.seller@mithilakart.com', 'sunita.seller@mithilakart.com', 'warehouse@mithilakart.com', 'seller@mithilakart.com'];
  for (const email of allSellers) {
    await sellersCollection.updateOne(
      { email },
      {
        $set: {
          passwordHash: hash,
          failedLoginAttempts: 0,
          lockUntil: null,
          status: 'active',
          kycStatus: 'approved',
        },
      }
    );
  }
  console.log('All seller passwords reset to Seller@12345');
  process.exit(0);
}

run();
