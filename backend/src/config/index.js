function required(name, value) {
  if (value === undefined || value === null || value === '') {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function optional(name, value, defaultValue) {
  if (value === undefined || value === null || value === '') {
    return defaultValue;
  }
  return value;
}

function parseInteger(name, value, defaultValue) {
  if (value === undefined || value === null || value === '') {
    return defaultValue;
  }

  const parsed = parseInt(value, 10);
  if (Number.isNaN(parsed)) {
    throw new Error(`Environment variable ${name} must be a valid integer`);
  }

  return parsed;
}

function parseBoolean(value, defaultValue = false) {
  if (value === undefined || value === null || value === '') {
    return defaultValue;
  }

  return ['true', '1', 'yes', 'on'].includes(String(value).toLowerCase());
}

function parseCsv(value, defaultValue = []) {
  if (!value) {
    return defaultValue;
  }

  return String(value)
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

const { buildJwtConfig } = require('./jwt');

function loadConfig() {
  const env = optional('NODE_ENV', process.env.NODE_ENV, 'development');
  const isProduction = env === 'production';
  const isTest = env === 'test';

  const config = {
    env,
    isProduction,
    isDevelopment: env === 'development',
    isTest,
    port: parseInteger('PORT', process.env.PORT, 3000),
    api: {
      version: optional('API_VERSION', process.env.API_VERSION, 'v1'),
      basePath: '/api',
      docsPath: '/api/docs',
    },
    mongodb: {
      uri: required('MONGODB_URI', process.env.MONGODB_URI),
    },
    redis: {
      url: optional('REDIS_URL', process.env.REDIS_URL, 'redis://localhost:6379'),
      useMemory: isTest || parseBoolean(process.env.REDIS_USE_MEMORY, false),
    },
    jwt: buildJwtConfig(isTest),
    logging: {
      level: optional('LOG_LEVEL', process.env.LOG_LEVEL, isProduction ? 'info' : 'debug'),
      pretty: parseBoolean(process.env.LOG_PRETTY, !isProduction),
    },
    upload: {
      destination: optional('UPLOAD_DESTINATION', process.env.UPLOAD_DESTINATION, 'uploads'),
      publicBaseUrl: optional('UPLOAD_PUBLIC_BASE_URL', process.env.UPLOAD_PUBLIC_BASE_URL, '/uploads'),
      maxFileSizeMb: parseInteger('UPLOAD_MAX_FILE_SIZE_MB', process.env.UPLOAD_MAX_FILE_SIZE_MB, 10),
      allowedMimeTypes: parseCsv(process.env.UPLOAD_ALLOWED_MIME_TYPES, [
        'image/jpeg',
        'image/png',
        'image/webp',
        'application/pdf',
      ]),
    },
    cors: {
      origin: optional('CORS_ORIGIN', process.env.CORS_ORIGIN, '*'),
      origins: parseCsv(process.env.CORS_ORIGIN, ['*']),
    },
    rateLimit: {
      enabled: parseBoolean(process.env.RATE_LIMIT_ENABLED, !isTest),
    },
    metrics: {
      enabled: parseBoolean(process.env.METRICS_ENABLED, !isTest),
      path: '/metrics',
    },
    cdn: {
      baseUrl: optional('CDN_BASE_URL', process.env.CDN_BASE_URL, ''),
    },
    cache: {
      searchTtlSeconds: parseInteger('CACHE_SEARCH_TTL_SECONDS', process.env.CACHE_SEARCH_TTL_SECONDS, 120),
    },
    shutdown: {
      timeoutMs: parseInteger('SHUTDOWN_TIMEOUT_MS', process.env.SHUTDOWN_TIMEOUT_MS, 10000),
    },
    auth: {
      exposeOtpInDev: parseBoolean(
        process.env.EXPOSE_OTP_IN_DEV,
        !isProduction && !isTest && !(
          process.env.SMS_PROVIDER === 'smsindiahub'
          && process.env.SMS_API_KEY
          && process.env.SMS_SENDER_ID
          && process.env.SMS_ENTITY_ID
          && process.env.SMS_DLT_TEMPLATE_ID
        )
      ),
    },
    razorpay: {
      keyId: optional('RAZORPAY_KEY_ID', process.env.RAZORPAY_KEY_ID, null),
      keySecret: optional('RAZORPAY_KEY_SECRET', process.env.RAZORPAY_KEY_SECRET, null),
      webhookSecret: optional('RAZORPAY_WEBHOOK_SECRET', process.env.RAZORPAY_WEBHOOK_SECRET, null),
      get enabled() {
        return Boolean(this.keyId && this.keySecret);
      },
    },
    fcm: {
      projectId: optional('FCM_PROJECT_ID', process.env.FCM_PROJECT_ID, null),
      serviceAccountPath: optional(
        'FCM_SERVICE_ACCOUNT_PATH',
        process.env.FCM_SERVICE_ACCOUNT_PATH,
        'keys/firebase-service-account.json'
      ),
      get enabled() {
        return Boolean(this.projectId);
      },
    },
    maps: {
      apiKey: optional('GOOGLE_MAPS_API_KEY', process.env.GOOGLE_MAPS_API_KEY, null),
      get enabled() {
        return Boolean(this.apiKey);
      },
    },
    sms: {
      provider: optional('SMS_PROVIDER', process.env.SMS_PROVIDER, null),
      apiKey: optional('SMS_API_KEY', process.env.SMS_API_KEY, null),
      senderId: optional('SMS_SENDER_ID', process.env.SMS_SENDER_ID, null),
      entityId: optional('SMS_ENTITY_ID', process.env.SMS_ENTITY_ID, null),
      dltTemplateId: optional('SMS_DLT_TEMPLATE_ID', process.env.SMS_DLT_TEMPLATE_ID, null),
      otpTemplate: optional('SMS_OTP_TEMPLATE', process.env.SMS_OTP_TEMPLATE, null),
      otpBrandName: optional('SMS_OTP_BRAND_NAME', process.env.SMS_OTP_BRAND_NAME, 'Mithilakart'),
      channel: optional('SMS_CHANNEL', process.env.SMS_CHANNEL, 'Trans'),
      gatewayUrl: optional(
        'SMS_GATEWAY_URL',
        process.env.SMS_GATEWAY_URL,
        'https://cloud.smsindiahub.in/api/mt/SendSMS'
      ),
      forceSend: parseBoolean(process.env.SMS_FORCE_SEND, false),
      get enabled() {
        return this.provider === 'smsindiahub' && Boolean(this.apiKey && this.senderId && this.entityId && this.dltTemplateId);
      },
    },
  };

  if (!config.redis.useMemory && isProduction && !process.env.REDIS_URL) {
    throw new Error('Missing required environment variable: REDIS_URL');
  }

  return config;
}

module.exports = loadConfig();
