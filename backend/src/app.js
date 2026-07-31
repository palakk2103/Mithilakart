const path = require('path');
const express = require('express');
const compression = require('compression');
const swaggerUi = require('swagger-ui-express');
const cookieParser = require('cookie-parser');

const config = require('./config');
const { openApiSpec } = require('./config/swagger');
const healthRoutes = require('./routes/health.routes');
const metricsRoutes = require('./routes/metrics.routes');
const { requestIdMiddleware } = require('./middleware/requestId');
const { requestLogger } = require('./middleware/requestLogger');
const { createHelmetMiddleware, createCorsMiddleware } = require('./middleware/security');
const { createRateLimiterMiddleware } = require('./middleware/rateLimiter');
const { createMetricsMiddleware } = require('./middleware/metrics');
const { notFoundHandler, errorHandler } = require('./middleware/errorHandler');
const { ensureUploadDirectory } = require('./middleware/upload');

function createApp() {
  const app = express();

  app.disable('x-powered-by');
  app.set('trust proxy', 1);

  ensureUploadDirectory();

  app.use(requestIdMiddleware);
  app.use(createMetricsMiddleware());
  app.use(requestLogger);
  app.use(createHelmetMiddleware());
  app.use(createCorsMiddleware());
  app.use(createRateLimiterMiddleware());
  app.use(compression());
  app.use(cookieParser());

  const webhookPath = `${config.api.basePath}/${config.api.version}/webhooks/razorpay`;
  app.use(webhookPath, express.raw({ type: 'application/json', limit: '1mb' }), (req, _res, next) => {
    req.rawBody = req.body;
    try {
      req.body = req.body && req.body.length ? JSON.parse(req.body.toString('utf8')) : {};
    } catch {
      req.body = {};
    }
    next();
  });

  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  app.use(
    config.upload.publicBaseUrl,
    express.static(path.isAbsolute(config.upload.destination)
      ? config.upload.destination
      : path.join(process.cwd(), config.upload.destination))
  );

  app.use(config.api.docsPath, swaggerUi.serve, swaggerUi.setup(openApiSpec, {
    explorer: true,
    customSiteTitle: 'Mithilakart API Docs',
  }));

  app.use(healthRoutes);
  app.use(metricsRoutes);
  app.use(config.api.basePath, require('./routes'));

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

module.exports = {
  createApp,
};
