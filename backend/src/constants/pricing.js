const PRICING = {
  DEFAULT_TAX_RATE: 0, // configurable later via admin finance
  DEFAULT_COMMISSION_RATE: 0.1, // 10% platform commission placeholder
};

const COUPON_TYPE = {
  PERCENT: 'percent',
  FIXED: 'fixed',
};

const COUPON_TYPE_VALUES = Object.values(COUPON_TYPE);

const COUPON_SCOPE = {
  PLATFORM: 'platform',
  SELLER: 'seller',
};

const COUPON_SCOPE_VALUES = Object.values(COUPON_SCOPE);

const RETURN_STATUS = {
  REQUESTED: 'requested',
  SELLER_APPROVED: 'seller_approved',
  SELLER_REJECTED: 'seller_rejected',
  ADMIN_APPROVED: 'admin_approved',
  ADMIN_REJECTED: 'admin_rejected',
  REFUNDED: 'refunded',
  CANCELLED: 'cancelled',
};

const RETURN_STATUS_VALUES = Object.values(RETURN_STATUS);

const INVENTORY_CHANGE_REASON = {
  MANUAL: 'manual',
  ORDER: 'order',
  RETURN: 'return',
  CANCEL: 'cancel',
};

module.exports = {
  PRICING,
  COUPON_TYPE,
  COUPON_TYPE_VALUES,
  COUPON_SCOPE,
  COUPON_SCOPE_VALUES,
  RETURN_STATUS,
  RETURN_STATUS_VALUES,
  INVENTORY_CHANGE_REASON,
};
