require('dotenv').config();

const request = require('supertest');

jest.mock('../../../src/config/database', () => ({
  connectDatabase: jest.fn().mockResolvedValue(undefined),
  disconnectDatabase: jest.fn().mockResolvedValue(undefined),
  getDatabaseState: jest.fn(() => ({
    readyState: 1,
    status: 'connected',
    isConnected: true,
  })),
  isDatabaseReady: jest.fn(() => true),
  mongoose: {},
}));

jest.mock('../../../src/config/redis', () => {
  const { MemoryRedisClient } = require('../../../src/core/redis/MemoryRedisClient');
  const client = new MemoryRedisClient();

  return {
    connectRedis: jest.fn().mockResolvedValue(client),
    disconnectRedis: jest.fn().mockResolvedValue(undefined),
    getRedisClient: jest.fn(() => client),
    isRedisReady: jest.fn(() => true),
  };
});

const { createApp } = require('../../../src/app');
const { resetContainer } = require('../../../src/bootstrap/container');
const { connectRedis } = require('../../../src/config/redis');
const User = require('../../../src/models/User');
const Seller = require('../../../src/models/Seller');
const AdminUser = require('../../../src/models/AdminUser');
const DeliveryPartner = require('../../../src/models/DeliveryPartner');
const { PasswordService } = require('../../../src/services/PasswordService');

describe('auth endpoints', () => {
  let app;
  let passwordService;

  beforeAll(async () => {
    passwordService = new PasswordService();
    await connectRedis({ redis: { useMemory: true } });
    app = createApp();
  });

  beforeEach(() => {
    resetContainer();
    jest.clearAllMocks();

    User.findOne = jest.fn();
    User.create = jest.fn();
    User.prototype.save = jest.fn().mockResolvedValue(true);

    Seller.findOne = jest.fn();
    AdminUser.findOne = jest.fn();
    DeliveryPartner.findOne = jest.fn();
    DeliveryPartner.create = jest.fn();
  });

  it('POST /api/v1/auth/send-phone-otp returns expiry metadata', async () => {
    const response = await request(app)
      .post('/api/v1/auth/send-phone-otp')
      .send({ countryCode: '+91', phone: '9876543210' });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.expiresInSeconds).toBe(300);
  });

  it('POST /api/v1/seller/auth/login rejects invalid credentials', async () => {
    Seller.findOne = jest.fn().mockReturnValue({
      session: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValue(null),
    });

    const response = await request(app)
      .post('/api/v1/seller/auth/login')
      .send({ email: 'missing@mithilakart.com', password: 'Seller@12345' });

    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe('UNAUTHORIZED');
  });

  it('POST /api/v1/admin/auth/login returns permissions payload', async () => {
    const passwordHash = await passwordService.hash('Admin@12345');
    const role = {
      _id: 'role123',
      name: 'Super Admin',
      permissions: ['dashboard.view', 'users.view'],
    };

    jest.spyOn(require('../../../src/repositories/AdminUserRepository').AdminUserRepository.prototype, 'findByEmailWithRole')
      .mockResolvedValue({
        _id: 'admin123',
        name: 'Admin',
        email: 'admin@mithilakart.com',
        passwordHash,
        status: 'active',
        isSuperAdmin: true,
        roleId: role,
        failedLoginAttempts: 0,
        lockUntil: null,
      });

    jest.spyOn(require('../../../src/repositories/AdminUserRepository').AdminUserRepository.prototype, 'resetFailedAttempts')
      .mockResolvedValue(true);

    jest.spyOn(require('../../../src/repositories/AuditLogRepository').AuditLogRepository.prototype, 'logAdminAuthAttempt')
      .mockResolvedValue(true);

    jest.spyOn(require('../../../src/repositories/RefreshTokenRepository').RefreshTokenRepository.prototype, 'revokeOldestSessions')
      .mockResolvedValue([]);

    jest.spyOn(require('../../../src/repositories/RefreshTokenRepository').RefreshTokenRepository.prototype, 'createToken')
      .mockResolvedValue(true);

    jest.spyOn(require('../../../src/repositories/UserDeviceRepository').UserDeviceRepository.prototype, 'upsertDevice')
      .mockResolvedValue(true);

    const response = await request(app)
      .post('/api/v1/admin/auth/login')
      .send({ email: 'admin@mithilakart.com', password: 'Admin@12345' });

    expect(response.status).toBe(200);
    expect(response.body.data.admin.permissions).toContain('all');
    expect(response.body.data.tokens.accessToken).toBeDefined();
  });
});
