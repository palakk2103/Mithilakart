const {
  normalizeMarketplaceTab,
  deliveryTypeForTab,
  isQuickCommerceTab,
} = require('../../../src/utils/marketplaceTab');

describe('marketplaceTab utils', () => {
  it('normalizes legacy commerceFlow to marketplaceTab', () => {
    expect(normalizeMarketplaceTab('standard')).toBe('mithilakart');
    expect(normalizeMarketplaceTab('fresh_grocery')).toBe('groceries_fresh');
    expect(normalizeMarketplaceTab('quick_shop')).toBe('quick_shop');
  });

  it('detects delivery type per tab', () => {
    expect(deliveryTypeForTab('quick_shop')).toBe('fixed_promise');
    expect(deliveryTypeForTab('mithilakart')).toBe('standard');
    expect(isQuickCommerceTab('groceries_fresh')).toBe(true);
    expect(isQuickCommerceTab('mithilak')).toBe(false);
  });
});
