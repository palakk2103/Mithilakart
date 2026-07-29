const {
  MARKETPLACE_TAB_VALUES,
  LEGACY_FLOW_TO_TAB,
  TAB_TO_LEGACY_FLOW,
  QUICK_COMMERCE_TABS,
  STANDARD_TABS,
  DELIVERY_TYPE,
} = require('../constants/marketplace');

function normalizeMarketplaceTab(value) {
  if (!value) return null;
  const key = String(value).trim().toLowerCase();
  if (MARKETPLACE_TAB_VALUES.includes(key)) return key;
  if (LEGACY_FLOW_TO_TAB[key]) return LEGACY_FLOW_TO_TAB[key];
  return null;
}

function resolveTabFromQuery(query = {}) {
  return normalizeMarketplaceTab(query.marketplaceTab || query.commerceFlow);
}

function toLegacyCommerceFlow(tab) {
  const normalized = normalizeMarketplaceTab(tab);
  return normalized ? TAB_TO_LEGACY_FLOW[normalized] || null : null;
}

function deliveryTypeForTab(tab) {
  const normalized = normalizeMarketplaceTab(tab);
  if (!normalized) return DELIVERY_TYPE.STANDARD;
  return QUICK_COMMERCE_TABS.has(normalized)
    ? DELIVERY_TYPE.FIXED_PROMISE
    : DELIVERY_TYPE.STANDARD;
}

function isQuickCommerceTab(tab) {
  const normalized = normalizeMarketplaceTab(tab);
  return normalized ? QUICK_COMMERCE_TABS.has(normalized) : false;
}

function isStandardTab(tab) {
  const normalized = normalizeMarketplaceTab(tab);
  return normalized ? STANDARD_TABS.has(normalized) : false;
}

function deliveryLabelForListing(listing) {
  if (!listing) return null;
  if (listing.deliveryType === DELIVERY_TYPE.FIXED_PROMISE && listing.deliveryPromiseMinutes) {
    return `Delivery in ${listing.deliveryPromiseMinutes} minutes`;
  }
  return 'Standard delivery';
}

module.exports = {
  normalizeMarketplaceTab,
  resolveTabFromQuery,
  toLegacyCommerceFlow,
  deliveryTypeForTab,
  isQuickCommerceTab,
  isStandardTab,
  deliveryLabelForListing,
};
