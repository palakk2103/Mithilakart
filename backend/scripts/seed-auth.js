require('dotenv').config();

const { connectDatabase, disconnectDatabase } = require('../src/config/database');
const { connectRedis, disconnectRedis } = require('../src/config/redis');
const config = require('../src/config');
const { ALL_PERMISSIONS } = require('../src/constants/permissions');
const { PasswordService } = require('../src/services/PasswordService');
const Role = require('../src/models/Role');
const AdminUser = require('../src/models/AdminUser');
const Seller = require('../src/models/Seller');
const DeliveryPartner = require('../src/models/DeliveryPartner');

async function seedAuth() {
  await connectDatabase();
  await connectRedis(config);

  const passwordService = new PasswordService();
  const defaultPassword = process.env.SEED_ADMIN_PASSWORD || 'Admin@12345';
  const sellerPassword = process.env.SEED_SELLER_PASSWORD || 'Seller@12345';
  const passwordHash = await passwordService.hash(defaultPassword);
  const sellerPasswordHash = await passwordService.hash(sellerPassword);

  const superAdminRole = await Role.findOneAndUpdate(
    { name: 'Super Admin' },
    {
      name: 'Super Admin',
      description: 'Full platform access',
      permissions: ALL_PERMISSIONS,
      isSystem: true,
      deletedAt: null,
    },
    { upsert: true, new: true }
  );

  await AdminUser.findOneAndUpdate(
    { email: 'admin@mithilakart.com' },
    {
      name: 'Super Admin',
      email: 'admin@mithilakart.com',
      passwordHash,
      roleId: superAdminRole._id,
      status: 'active',
      isSuperAdmin: true,
      failedLoginAttempts: 0,
      lockUntil: null,
      deletedAt: null,
    },
    { upsert: true, new: true }
  );

  await Seller.findOneAndUpdate(
    { email: 'seller@mithilakart.com' },
    {
      name: 'Demo Seller',
      email: 'seller@mithilakart.com',
      passwordHash: sellerPasswordHash,
      storeName: 'Mithila Heritage Store',
      phone: '9876543210',
      addressLine: 'Palasia Square, Indore',
      city: 'Indore',
      state: 'Madhya Pradesh',
      pincode: '452001',
      latitude: 22.7248,
      longitude: 75.8839,
      location: { type: 'Point', coordinates: [75.8839, 22.7248] },
      status: 'active',
      kycStatus: 'approved',
      mithilakEligible: true,
      quickCommerceEligible: true,
      groceryEligible: true,
      failedLoginAttempts: 0,
      lockUntil: null,
      deletedAt: null,
    },
    { upsert: true, new: true }
  );

  await DeliveryPartner.findOneAndUpdate(
    { phone: '9123456789', countryCode: '+91' },
    {
      name: 'Demo Delivery Partner',
      phone: '9123456789',
      countryCode: '+91',
      vehicleType: 'bike',
      documents: {
        aadharNumber: '123456789012',
        drivingLicenseNumber: 'BR-1234567890',
        vehicleRegistrationNumber: 'BR01AB1234',
      },
      status: 'approved',
      deletedAt: null,
    },
    { upsert: true, new: true }
  );

  process.stdout.write('Auth seed completed\n');
  process.stdout.write(`Admin login: admin@mithilakart.com / ${defaultPassword}\n`);
  process.stdout.write(`Seller login: seller@mithilakart.com / ${sellerPassword}\n`);
  process.stdout.write('Delivery OTP phone: +91 9123456789 (approved partner)\n');

  await disconnectDatabase();
  await disconnectRedis();
}

seedAuth().catch((error) => {
  process.stderr.write(`${error.message}\n`);
  process.exit(1);
});
