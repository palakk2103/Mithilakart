const RATE_LIMIT_WINDOWS = {
  MINUTE: 60,
  FIFTEEN_MINUTES: 900,
  HOUR: 3600,
};

const RATE_LIMITS = {
  public: { limit: 100, windowSeconds: RATE_LIMIT_WINDOWS.MINUTE, name: 'public' },
  authenticated: { limit: 200, windowSeconds: RATE_LIMIT_WINDOWS.MINUTE, name: 'authenticated' },
  admin: { limit: 300, windowSeconds: RATE_LIMIT_WINDOWS.MINUTE, name: 'admin' },
  authLogin: { limit: 10, windowSeconds: RATE_LIMIT_WINDOWS.FIFTEEN_MINUTES, name: 'auth_login' },
  upload: { limit: 20, windowSeconds: RATE_LIMIT_WINDOWS.HOUR, name: 'upload' },
  reportExport: { limit: 5, windowSeconds: RATE_LIMIT_WINDOWS.HOUR, name: 'report_export' },
};

const RATE_LIMIT_SKIP_PATHS = [
  '/health',
  '/ready',
  '/metrics',
  '/api/docs',
];

function resolveRateLimitRule(req) {
  const path = req.originalUrl.split('?')[0];

  if (RATE_LIMIT_SKIP_PATHS.some((skip) => path === skip || path.startsWith(`${skip}/`))) {
    return null;
  }

  if (/\/auth\/login$/.test(path) || /\/auth\/send-phone-otp$/.test(path)) {
    return RATE_LIMITS.authLogin;
  }

  if (/\/reports\/export\//.test(path)) {
    return RATE_LIMITS.reportExport;
  }

  if (req.method === 'POST' && /\/uploads/.test(path)) {
    return RATE_LIMITS.upload;
  }

  if (path.startsWith('/api/v1/admin')) {
    return RATE_LIMITS.admin;
  }

  if (req.headers.authorization?.startsWith('Bearer ')) {
    return RATE_LIMITS.authenticated;
  }

  return RATE_LIMITS.public;
}

module.exports = {
  RATE_LIMIT_WINDOWS,
  RATE_LIMITS,
  RATE_LIMIT_SKIP_PATHS,
  resolveRateLimitRule,
};
