const MARKETPLACE_TABS = {
  MITHILAKART: 'mithilakart',
  MITHILAK: 'mithilak',
  QUICK_SHOP: 'quick_shop',
  GROCERIES_FRESH: 'groceries_fresh',
};

const MARKETPLACE_TAB_VALUES = Object.values(MARKETPLACE_TABS);

const QUICK_COMMERCE_TABS = new Set([
  MARKETPLACE_TABS.QUICK_SHOP,
  MARKETPLACE_TABS.GROCERIES_FRESH,
]);

const STANDARD_TABS = new Set([
  MARKETPLACE_TABS.MITHILAKART,
  MARKETPLACE_TABS.MITHILAK,
]);

const DELIVERY_TYPE = {
  STANDARD: 'standard',
  FIXED_PROMISE: 'fixed_promise',
};

const DELIVERY_TYPE_VALUES = Object.values(DELIVERY_TYPE);

const DELIVERY_PROMISE_MINUTES = [15, 20, 25, 30];

const LISTING_STATUS = {
  DRAFT: 'draft',
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  SUSPENDED: 'suspended',
};

const LISTING_STATUS_VALUES = Object.values(LISTING_STATUS);

/** Legacy commerceFlow → canonical marketplaceTab */
const LEGACY_FLOW_TO_TAB = {
  standard: MARKETPLACE_TABS.MITHILAKART,
  mithilak: MARKETPLACE_TABS.MITHILAK,
  quick_shop: MARKETPLACE_TABS.QUICK_SHOP,
  fresh_grocery: MARKETPLACE_TABS.GROCERIES_FRESH,
};

/** Canonical tab → legacy commerceFlow (for backward compat) */
const TAB_TO_LEGACY_FLOW = {
  [MARKETPLACE_TABS.MITHILAKART]: 'standard',
  [MARKETPLACE_TABS.MITHILAK]: 'mithilak',
  [MARKETPLACE_TABS.QUICK_SHOP]: 'quick_shop',
  [MARKETPLACE_TABS.GROCERIES_FRESH]: 'fresh_grocery',
};

module.exports = {
  MARKETPLACE_TABS,
  MARKETPLACE_TAB_VALUES,
  QUICK_COMMERCE_TABS,
  STANDARD_TABS,
  DELIVERY_TYPE,
  DELIVERY_TYPE_VALUES,
  DELIVERY_PROMISE_MINUTES,
  LISTING_STATUS,
  LISTING_STATUS_VALUES,
  LEGACY_FLOW_TO_TAB,
  TAB_TO_LEGACY_FLOW,
};
