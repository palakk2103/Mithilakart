require('dotenv').config();
const mongoose = require('mongoose');
const Seller = require('../src/models/Seller');
const AdminUser = require('../src/models/AdminUser');
const { PasswordService } = require('../src/services/PasswordService');

async function sync() {
  await mongoose.connect(process.env.MONGODB_URI);
  const pwd = new PasswordService();
  const hash = await pwd.hash('123456');

  await Seller.updateMany(
    { email: { $in: ['palakpatel0342@gmail.com', 'amit.seller@mithilakart.com', 'ravi.seller@mithilakart.com', 'seller@mithilakart.com'] } },
    { $set: { passwordHash: hash, failedLoginAttempts: 0, lockUntil: null, status: 'active', kycStatus: 'approved' } }
  );

  await AdminUser.updateMany(
    { email: 'palakpatel0342@gmail.com' },
    { $set: { passwordHash: hash, failedLoginAttempts: 0, lockUntil: null, status: 'active' } }
  );

  console.log('RESET_SUCCESS');
  await mongoose.disconnect();
}

sync().catch((err) => {
  console.error(err);
  process.exit(1);
});
