const { buildListFilters } = require('../../../src/utils/filter');

describe('filter utils', () => {
  it('builds exact and date range filters', () => {
    const filter = buildListFilters(
      {
        status: 'active,pending',
        from: '2026-01-01',
        to: '2026-07-20',
        minPrice: '100',
        maxPrice: '500',
      },
      {
        exactFields: ['status'],
        rangeFields: [{ minKey: 'minPrice', maxKey: 'maxPrice', field: 'price' }],
        dateRange: { fromKey: 'from', toKey: 'to', field: 'createdAt' },
        baseFilter: { deletedAt: null },
      }
    );

    expect(filter.status).toEqual({ $in: ['active', 'pending'] });
    expect(filter.price.$gte).toBe(100);
    expect(filter.price.$lte).toBe(500);
    expect(filter.createdAt.$gte).toEqual(new Date('2026-01-01'));
    expect(filter.createdAt.$lte).toEqual(new Date('2026-07-20'));
    expect(filter.deletedAt).toBeNull();
  });
});
