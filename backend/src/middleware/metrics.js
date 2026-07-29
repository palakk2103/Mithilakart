const client = require('prom-client');
const config = require('../config');

const register = new client.Registry();

client.collectDefaultMetrics({
  register,
  prefix: 'mithilakart_',
});

const httpRequestDuration = new client.Histogram({
  name: 'mithilakart_http_request_duration_seconds',
  help: 'HTTP request duration in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.05, 0.1, 0.25, 0.5, 1, 2, 5],
  registers: [register],
});

const httpRequestTotal = new client.Counter({
  name: 'mithilakart_http_requests_total',
  help: 'Total HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register],
});

function normalizeRoute(req) {
  if (req.route?.path) {
    return `${req.baseUrl || ''}${req.route.path}`;
  }
  return req.path || 'unknown';
}

function createMetricsMiddleware() {
  if (!config.metrics.enabled) {
    return (_req, _res, next) => next();
  }

  return (req, res, next) => {
    const start = process.hrtime.bigint();

    res.on('finish', () => {
      const durationSeconds = Number(process.hrtime.bigint() - start) / 1e9;
      const route = normalizeRoute(req);
      const labels = {
        method: req.method,
        route,
        status_code: String(res.statusCode),
      };

      httpRequestDuration.observe(labels, durationSeconds);
      httpRequestTotal.inc(labels);
    });

    next();
  };
}

async function getMetricsPayload() {
  return register.metrics();
}

function getMetricsContentType() {
  return register.contentType;
}

module.exports = {
  createMetricsMiddleware,
  getMetricsPayload,
  getMetricsContentType,
  metricsRegister: register,
};
