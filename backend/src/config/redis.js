const { MemoryRedisClient } = require('../core/redis/MemoryRedisClient');

let redisClient = null;
let isConnected = false;

async function connectRedis(config) {
  if (redisClient && isConnected) {
    return redisClient;
  }

  if (config.redis.useMemory) {
    redisClient = new MemoryRedisClient();
    isConnected = true;
    return redisClient;
  }

  const Redis = require('ioredis');
  redisClient = new Redis(config.redis.url, {
    maxRetriesPerRequest: 1,
    connectTimeout: 2000,
    retryStrategy: () => null,
    lazyConnect: true,
  });

  redisClient.on('error', (error) => {
    const { logger } = require('../utils/logger');
    logger.error({ err: error }, 'Redis connection error');
  });

  try {
    await redisClient.connect();
    isConnected = true;
    return redisClient;
  } catch (err) {
    const { logger } = require('../utils/logger');
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
