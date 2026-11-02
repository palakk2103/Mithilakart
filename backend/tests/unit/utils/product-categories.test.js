const {
  categoryMatchClause,
  withCategoryMatch,
  normalizeAdditionalCategoryIds,
} = require('../../../src/utils/productCategories');
const { resolveProductIds } = require('../../../src/utils/listingQuery');

describe('product multi-category helpers', () => {
  test('matches primary OR additional category', () => {
    expect(categoryMatchClause(['a', 'b'])).toEqual({
      $or: [{ categoryId: { $in: ['a', 'b'] } }, { categoryIds: { $in: ['a', 'b'] } }],
    });
  });

  test('withCategoryMatch keeps an existing $or (search) intact', () => {
    const out = withCategoryMatch({ $or: [{ title: /x/ }], brand: 'b' }, ['a']);
    expect(out.$or).toEqual([{ title: /x/ }]);
    expect(out.$and).toEqual([categoryMatchClause(['a'])]);
  });

  test('normalize dedupes, drops primary and empties, accepts docs', () => {
    expect(normalizeAdditionalCategoryIds(['p', 'a', 'a', '', null, { _id: 'b' }, 'p'], 'p')).toEqual(['a', 'b']);
    expect(normalizeAdditionalCategoryIds(undefined, 'p')).toEqual([]);
  });

  test('resolveProductIds uses primary+additional match without clobbering productType $or', async () => {
    const findPublic = jest.fn().mockResolvedValue([{ _id: 1 }]);
    await resolveProductIds({ findPublic }, { categoryIds: ['c1'], productType: 'veg' });
    const filter = findPublic.mock.calls[0][0];
    expect(filter.$and).toEqual([categoryMatchClause(['c1'])]);
    expect(filter.$or).toHaveLength(2); // productType tag/title clause preserved
    expect(filter.categoryId).toBeUndefined();
  });

  test('legacy single-category products (no categoryIds) still match via categoryId', () => {
    const clause = categoryMatchClause(['c1']);
    expect(clause.$or[0]).toEqual({ categoryId: { $in: ['c1'] } });
  });
});
