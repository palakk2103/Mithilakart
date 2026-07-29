require('dotenv').config();
process.env.METRICS_ENABLED = 'true';

const request = require('supertest');

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

const { createApp } = require('../../src/app');

describe('metrics endpoint', () => {
  let app;

  beforeAll(() => {
    app = createApp();
  });

  it('GET /metrics returns Prometheus payload', async () => {
    const response = await request(app).get('/metrics');

    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toContain('text/plain');
    expect(response.text).toContain('mithilakart_http_requests_total');
  });
});
