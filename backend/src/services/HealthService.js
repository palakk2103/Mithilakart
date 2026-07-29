const config = require('../config');
const { getDatabaseState, isDatabaseReady } = require('../config/database');
const { isRedisReady } = require('../config/redis');
const { queueManager } = require('../queues/QueueManager');

class HealthService {
  getLiveness() {
    return {
      status: 'ok',
      service: 'mithilakart-api',
      environment: config.env,
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.floor(process.uptime()),
    };
  }

  getReadiness() {
    const database = getDatabaseState();
    const redisReady = isRedisReady();
    const queuesHealthy = queueManager.isHealthy();
    const isReady = database.isConnected && redisReady && queuesHealthy;

    return {
      status: isReady ? 'ready' : 'not_ready',
      checks: {
        database: {
          status: database.isConnected ? 'up' : 'down',
          state: database.status,
        },
        redis: {
          status: redisReady ? 'up' : 'down',
        },
        queues: {
          status: queuesHealthy ? 'up' : 'down',
        },
      },
      timestamp: new Date().toISOString(),
      isReady,
    };
  }

  isReady() {
    return isDatabaseReady() && isRedisReady() && queueManager.isHealthy();
  }
}

module.exports = {
  HealthService,
};
