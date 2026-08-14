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
      maxFileSizeMb: parseInteger('UPLOAD_MAX_FILE_SIZE_MB', process.env.UPLOAD_MAX_FILE_SIZE_MB, 50),
      allowedMimeTypes: parseCsv(process.env.UPLOAD_ALLOWED_MIME_TYPES, [
        'image/jpeg',
        'image/png',
        'image/webp',
        'application/pdf',
        'video/mp4',
        'video/webm',
        'video/ogg',
        'video/quicktime',
      ]),
    },
    storage: {
      provider: optional('STORAGE_PROVIDER', process.env.STORAGE_PROVIDER, 'local'),
      cloudinary: {
        cloudName: optional('CLOUDINARY_CLOUD_NAME', process.env.CLOUDINARY_CLOUD_NAME, null),
        apiKey: optional('CLOUDINARY_API_KEY', process.env.CLOUDINARY_API_KEY, null),
        apiSecret: optional('CLOUDINARY_API_SECRET', process.env.CLOUDINARY_API_SECRET, null),
      },
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
      exposeOtpInDev: parseBoolean(process.env.EXPOSE_OTP_IN_DEV, !isProduction && !isTest),
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
      timeoutMs: parseInteger('GEOCODING_TIMEOUT_MS', process.env.GEOCODING_TIMEOUT_MS, 5000),
      get enabled() {
        return Boolean(this.apiKey);
      },
    },
    shiprocket: {
      email: optional('SHIPROCKET_EMAIL', process.env.SHIPROCKET_EMAIL, null),
      password: optional('SHIPROCKET_PASSWORD', process.env.SHIPROCKET_PASSWORD, null),
      apiBaseUrl: optional('SHIPROCKET_API_BASE_URL', process.env.SHIPROCKET_API_BASE_URL, 'https://apiv2.shiprocket.in'),
      pickupLocation: optional('SHIPROCKET_PICKUP_LOCATION', process.env.SHIPROCKET_PICKUP_LOCATION, 'Primary'),
      pickupPincode: optional('SHIPROCKET_PICKUP_PINCODE', process.env.SHIPROCKET_PICKUP_PINCODE, null),
      channelId: optional('SHIPROCKET_CHANNEL_ID', process.env.SHIPROCKET_CHANNEL_ID, null),
      webhookSecret: optional('SHIPROCKET_WEBHOOK_SECRET', process.env.SHIPROCKET_WEBHOOK_SECRET, null),
      defaultWeightKg: Number(optional('SHIPROCKET_DEFAULT_WEIGHT_KG', process.env.SHIPROCKET_DEFAULT_WEIGHT_KG, '0.5')),
      defaultDimensions: {
        length: parseInteger('SHIPROCKET_DEFAULT_LENGTH_CM', process.env.SHIPROCKET_DEFAULT_LENGTH_CM, 10),
        breadth: parseInteger('SHIPROCKET_DEFAULT_BREADTH_CM', process.env.SHIPROCKET_DEFAULT_BREADTH_CM, 10),
        height: parseInteger('SHIPROCKET_DEFAULT_HEIGHT_CM', process.env.SHIPROCKET_DEFAULT_HEIGHT_CM, 10),
      },
      get enabled() {
        return Boolean(this.email && this.password);
      },
    },
    shipping: {
      provider: optional('SHIPPING_PROVIDER', process.env.SHIPPING_PROVIDER, 'mock'),
    },
    sms: {
      provider: optional('SMS_PROVIDER', process.env.SMS_PROVIDER, null),
      apiKey: optional('SMS_API_KEY', process.env.SMS_API_KEY, null),
      senderId: optional('SMS_SENDER_ID', process.env.SMS_SENDER_ID, null),
      entityId: optional('SMS_ENTITY_ID', process.env.SMS_ENTITY_ID, null),
      dltTemplateId: optional('SMS_DLT_TEMPLATE_ID', process.env.SMS_DLT_TEMPLATE_ID, null),
      route: optional('SMS_ROUTE', process.env.SMS_ROUTE, '2'),
      otpTemplate: optional('SMS_OTP_TEMPLATE', process.env.SMS_OTP_TEMPLATE, null),
      otpBrandName: optional('SMS_OTP_BRAND_NAME', process.env.SMS_OTP_BRAND_NAME, 'Mithilakart'),
      channel: optional('SMS_CHANNEL', process.env.SMS_CHANNEL, '2'),
      gatewayUrl: optional(
        'SMS_GATEWAY_URL',
        process.env.SMS_GATEWAY_URL,
        'https://cloud.smsindiahub.in/vendorsms/pushsms.aspx'
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
