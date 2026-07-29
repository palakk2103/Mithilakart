const { applyCommerceFlowFilter } = require('../../../src/utils/filter');

describe('applyCommerceFlowFilter', () => {
  it('maps commerceFlow query param to commerceFlows array field', () => {
    const filter = applyCommerceFlowFilter({ brand: 'Acme', commerceFlow: 'quick_shop' }, {
      commerceFlow: 'quick_shop',
    });

    expect(filter.commerceFlows).toBe('quick_shop');
    expect(filter.commerceFlow).toBeUndefined();
    expect(filter.brand).toBe('Acme');
  });

  it('returns filter unchanged when commerceFlow is absent', () => {
    const filter = { brand: 'Acme' };
    expect(applyCommerceFlowFilter(filter, {})).toEqual({ brand: 'Acme' });
  });
});
