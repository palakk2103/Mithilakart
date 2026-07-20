const { parsePagination, buildPaginationMeta } = require('../../../src/utils/pagination');

describe('pagination utils', () => {
  it('parses page and limit with defaults', () => {
    const result = parsePagination({});

    expect(result.page).toBe(1);
    expect(result.limit).toBe(20);
    expect(result.skip).toBe(0);
  });

  it('caps limit at maximum', () => {
    const result = parsePagination({ page: '2', limit: '500' });

    expect(result.page).toBe(2);
    expect(result.limit).toBe(100);
    expect(result.skip).toBe(100);
  });

  it('builds pagination meta', () => {
    const meta = buildPaginationMeta(2, 20, 45);

    expect(meta).toEqual({
      page: 2,
      limit: 20,
      total: 45,
      totalPages: 3,
    });
  });
});
