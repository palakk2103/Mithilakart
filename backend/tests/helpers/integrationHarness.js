jest.mock('../../src/config/database', () => ({
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

jest.mock('../../src/config/redis', () => {
  const { MemoryRedisClient } = require('../../src/core/redis/MemoryRedisClient');
  const client = new MemoryRedisClient();

  return {
    connectRedis: jest.fn().mockResolvedValue(client),
    disconnectRedis: jest.fn().mockResolvedValue(undefined),
    getRedisClient: jest.fn(() => client),
    isRedisReady: jest.fn(() => true),
  };
});

const { bootstrapProviders } = require('../../src/core/providers/bootstrapProviders');
const { createApp } = require('../../src/app');
const { resetContainer } = require('../../src/bootstrap/container');
const { connectRedis } = require('../../src/config/redis');

async function createIntegrationApp() {
  process.env.SHIPPING_PROVIDER = 'mock';
  process.env.PAYMENT_PROVIDER = 'mock';
  bootstrapProviders();
  await connectRedis({ redis: { useMemory: true } });
  return createApp();
}

function resetIntegrationState() {
  resetContainer();
  jest.clearAllMocks();
}

module.exports = {
  createIntegrationApp,
  resetIntegrationState,
};
