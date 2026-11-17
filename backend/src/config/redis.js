const { MemoryRedisClient } = require('../core/redis/MemoryRedisClient');

let redisClient = null;
let isConnected = false;

async function connectRedis(config) {
  if (redisClient && isConnected) {
    return redisClient;
  }

  if (config.redis.useMemory) {
    if (config.env === 'production') {
      const { logger } = require('../utils/logger');
      logger.error('REDIS_USE_MEMORY is enabled in production: OTPs/sessions are per-worker and will fail across PM2 cluster workers. Set REDIS_USE_MEMORY=false.');
    }
    redisClient = new MemoryRedisClient();
    isConnected = true;
    return redisClient;
  }

  const Redis = require('ioredis');
  redisClient = new Redis(config.redis.url, {
    maxRetriesPerRequest: 3,
    connectTimeout: 5000,
    retryStrategy: (times) => Math.min(times * 100, 2000),
    lazyConnect: true,
  });

  redisClient.on('error', (error) => {
    const { logger } = require('../utils/logger');
    logger.error({ err: error }, 'Redis connection error');
  });

  redisClient.on('connect', () => {
    const { logger } = require('../utils/logger');
    logger.info('Connected to Redis successfully');
    isConnected = true;
  });

  try {
    await redisClient.connect();
    isConnected = true;
    return redisClient;
  } catch (err) {
    const { logger } = require('../utils/logger');
    // In production the API runs as a multi-worker PM2 cluster. A per-process
    // memory store would make OTPs (and sessions) invisible to other workers,
    // causing random "OTP expired or not found" errors, so fail loudly instead.
    if (config.env === 'production') {
      logger.error({ err: err?.message || err }, 'Failed to connect to Redis in production — refusing to fall back to per-process memory');
      throw err;
    }
    logger.warn({ err: err?.message || err }, 'Failed to connect to external Redis — gracefully falling back to MemoryRedisClient');
    redisClient = new MemoryRedisClient();
    isConnected = true;
    return redisClient;
  }
}

async function disconnectRedis() {
  if (!redisClient || !isConnected) {
    return;
  }

  if (typeof redisClient.quit === 'function') {
    await redisClient.quit();
  } else if (typeof redisClient.disconnect === 'function') {
    await redisClient.disconnect();
  }

  redisClient = null;
  isConnected = false;
}

function getRedisClient() {
  if (!redisClient) {
    redisClient = new MemoryRedisClient();
    isConnected = true;
  }
  return redisClient;
}

function isRedisReady() {
  if (!redisClient) {
    return false;
  }

  if (typeof redisClient.status === 'string') {
    return redisClient.status === 'ready';
  }

  return isConnected;
}

module.exports = {
  connectRedis,
  disconnectRedis,
  getRedisClient,
  isRedisReady,
};
