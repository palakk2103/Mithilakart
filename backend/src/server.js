require('dotenv').config();

const { bootstrapProviders } = require('./core/providers/bootstrapProviders');
bootstrapProviders();

const http = require('http');
const config = require('./config');
const { createApp } = require('./app');
const { connectDatabase, disconnectDatabase } = require('./config/database');
const { connectRedis, disconnectRedis } = require('./config/redis');
const { resetContainer } = require('./bootstrap/container');
const { logger } = require('./utils/logger');
const { eventBus, EVENT_TYPES } = require('./events/EventBus');

let server = null;
let isShuttingDown = false;

async function startServer() {
  await connectDatabase();
  await connectRedis(config);
  resetContainer();

  const app = createApp();
  server = http.createServer(app);

  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(config.port, resolve);
  });

  eventBus.publish(EVENT_TYPES.SYSTEM.STARTUP, {
    port: config.port,
    environment: config.env,
  });

  logger.info(
    {
      port: config.port,
      environment: config.env,
      docs: config.api.docsPath,
    },
    'Mithilakart API server started'
  );

  return server;
}

async function shutdown(signal) {
  if (isShuttingDown) {
    return;
  }

  isShuttingDown = true;
  logger.info({ signal }, 'Graceful shutdown initiated');

  eventBus.publish(EVENT_TYPES.SYSTEM.SHUTDOWN, { signal });

  const forceExitTimer = setTimeout(() => {
    logger.error('Graceful shutdown timed out — forcing exit');
    process.exit(1);
  }, config.shutdown.timeoutMs);

  forceExitTimer.unref();

  try {
    if (server) {
      await new Promise((resolve, reject) => {
        server.close((error) => {
          if (error) {
            reject(error);
            return;
          }
          resolve();
        });
      });
    }

    await disconnectDatabase();
    await disconnectRedis();
    logger.info('Graceful shutdown completed');
    process.exit(0);
  } catch (error) {
    logger.error({ err: error }, 'Graceful shutdown failed');
    process.exit(1);
  }
}

function registerProcessHandlers() {
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  process.on('unhandledRejection', (reason) => {
    logger.error({ err: reason }, 'Unhandled promise rejection');
  });

  process.on('uncaughtException', (error) => {
    logger.error({ err: error }, 'Uncaught exception');
    shutdown('uncaughtException');
  });
}

if (require.main === module) {
  registerProcessHandlers();

  startServer().catch((error) => {
    logger.error({ err: error }, 'Failed to start server');
    process.exit(1);
  });
}

module.exports = {
  startServer,
  shutdown,
};
