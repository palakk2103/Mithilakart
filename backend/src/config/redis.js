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
    maxRetriesPerRequest: 3,
    lazyConnect: true,
  });

  redisClient.on('error', (error) => {
    const { logger } = require('../utils/logger');
    logger.error({ err: error }, 'Redis connection error');
  });

  await redisClient.connect();
  isConnected = true;
  return redisClient;
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
