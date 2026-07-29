const helmet = require('helmet');
const cors = require('cors');
const config = require('../config');

function createHelmetMiddleware() {
  const base = {
    contentSecurityPolicy: config.isProduction ? {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'https:'],
        connectSrc: ["'self'"],
      },
    } : false,
    crossOriginEmbedderPolicy: false,
    hsts: config.isProduction ? { maxAge: 31536000, includeSubDomains: true } : false,
  };

  return helmet(base);
}

function createCorsMiddleware() {
  const origins = config.cors.origins;

  return cors({
    origin(origin, callback) {
      if (!origin || origins.includes('*') || origins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error(`Origin ${origin} is not allowed by CORS`));
    },
    credentials: true,
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-Id', 'If-None-Match'],
    exposedHeaders: ['X-RateLimit-Limit', 'X-RateLimit-Remaining', 'X-RateLimit-Reset', 'Retry-After', 'ETag'],
  });
}

module.exports = {
  createHelmetMiddleware,
  createCorsMiddleware,
};
