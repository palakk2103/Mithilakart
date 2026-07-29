const pino = require('pino');
const config = require('../config');

const redactPaths = [
  'req.headers.authorization',
  'req.headers.cookie',
  'password',
  'token',
  'refreshToken',
  'accessToken',
  'otp',
  'cardNumber',
  'cvv',
];

const logger = pino({
  level: config.logging.level,
  redact: {
    paths: redactPaths,
    censor: '[REDACTED]',
  },
  ...(config.logging.pretty && config.env !== 'production'
    ? {
        transport: {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'SYS:standard',
            ignore: 'pid,hostname',
          },
        },
      }
    : {}),
});

function createChildLogger(bindings = {}) {
  return logger.child(bindings);
}

module.exports = {
  logger,
  createChildLogger,
};
