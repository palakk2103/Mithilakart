require('dotenv').config();

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
const { connectDatabase, disconnectDatabase } = require('../../src/config/database');

describe('health endpoints', () => {
  let app;

  beforeAll(async () => {
    app = createApp();
    await connectDatabase();
  });

  afterAll(async () => {
    await disconnectDatabase();
  });

  it('GET /health returns liveness payload', async () => {
    const response = await request(app).get('/health');

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.status).toBe('ok');
    expect(response.body.requestId).toBeDefined();
  });

  it('GET /ready returns readiness when MongoDB is connected', async () => {
    const response = await request(app).get('/ready');

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.isReady).toBe(true);
    expect(response.body.data.checks.database.status).toBe('up');
  });

  it('GET /api/v1 returns version stub', async () => {
    const response = await request(app).get('/api/v1');

    expect(response.status).toBe(200);
    expect(response.body.data.phase).toBe(10);
  });

  it('returns standard 404 envelope for unknown routes', async () => {
    const response = await request(app).get('/api/v1/unknown-route');

    expect(response.status).toBe(404);
    expect(response.body.success).toBe(false);
    expect(response.body.error.code).toBe('NOT_FOUND');
    expect(response.body.requestId).toBeDefined();
  });
});
