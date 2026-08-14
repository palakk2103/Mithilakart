const OTP = {
  LENGTH: 6,
  EXPIRY_SECONDS: 5 * 60,
  MAX_SEND_PER_HOUR: 5,
  MAX_VERIFY_ATTEMPTS: 3,
  SEND_RATE_WINDOW_SECONDS: 60 * 60,
  VERIFY_RATE_WINDOW_SECONDS: 15 * 60,
  MAX_VERIFY_RATE: 10,
};

const JWT = {
  ACCESS_EXPIRY: '15m',
  REFRESH_EXPIRY: '7d',
  REFRESH_EXPIRY_SECONDS: 7 * 24 * 60 * 60,
  ALGORITHM: 'RS256',
};

const PASSWORD = {
  BCRYPT_ROUNDS: 12,
  MIN_LENGTH: 6,
  MAX_FAILED_ATTEMPTS: 5,
  LOCKOUT_MINUTES: 15,
  HISTORY_COUNT: 5,
  PATTERN: /^.{6,}$/,
};

const SESSION = {
  MAX_ACTIVE_SESSIONS: 5,
};

const USER_STATUS = {
  ACTIVE: 'active',
  BLOCKED: 'blocked',
  SUSPENDED: 'suspended',
};

const SELLER_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  SUSPENDED: 'suspended',
};

const KYC_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
};

const DELIVERY_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  SUSPENDED: 'suspended',
};

const ADMIN_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
};

const VEHICLE_TYPES = ['bike', 'scooter', 'bicycle', 'van'];

module.exports = {
  OTP,
  JWT,
  PASSWORD,
  SESSION,
  USER_STATUS,
  SELLER_STATUS,
  KYC_STATUS,
  DELIVERY_STATUS,
  ADMIN_STATUS,
  VEHICLE_TYPES,
};
