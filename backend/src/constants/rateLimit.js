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
  // AUTH-5: per-IP cap on OTP checks, on top of the per-number/email lock.
  authVerify: { limit: 30, windowSeconds: RATE_LIMIT_WINDOWS.FIFTEEN_MINUTES, name: 'auth_verify' },
  // Counts presigns only (one per file). The file POST and confirm each need a
  // fresh single-use presign, so they can't create extra uploads. The old
  // 20 POSTs/hour (3 per file) let a seller bulk upload only ~6 images an hour.
  // Coupon guessing: per-IP cap on top of the per-customer lock in CouponService.
  couponValidate: { limit: 30, windowSeconds: RATE_LIMIT_WINDOWS.FIFTEEN_MINUTES, name: 'coupon_validate' },
  upload: { limit: 300, windowSeconds: RATE_LIMIT_WINDOWS.HOUR, name: 'upload' },
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

  // Every endpoint that sends an OTP shares one per-IP budget (AUTH-5).
  if (/\/auth\/login$/.test(path) || /\/auth\/(send-(phone|email)-otp|register\/(start|resend))$/.test(path)) {
    return RATE_LIMITS.authLogin;
  }

  if (/\/auth\/(verify-(phone|email)-otp|register\/verify-(phone|email))$/.test(path)) {
    return RATE_LIMITS.authVerify;
  }

  if (/\/coupons\/validate$/.test(path)) {
    return RATE_LIMITS.couponValidate;
  }

  if (/\/reports\/export\//.test(path)) {
    return RATE_LIMITS.reportExport;
  }

  if (req.method === 'POST' && /\/uploads\/presign$/.test(path)) {
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
