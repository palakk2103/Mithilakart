const { parseListingQuery, quickDeliveryCondition } = require('../../../src/utils/listingQuery');

describe('listingQuery', () => {
  it('parses sort direction and whitelists fields', () => {
    expect(parseListingQuery({ sort: '-price' })).toMatchObject({ sortField: 'price', dir: -1 });
    expect(parseListingQuery({ sort: 'rating' })).toMatchObject({ sortField: 'rating', dir: 1 });
    expect(parseListingQuery({ sort: 'password;drop' }).sortField).toBeNull();
  });
  it('builds price range and ignores invalid numbers', () => {
    expect(parseListingQuery({ minPrice: '10', maxPrice: '20' }).price).toEqual({ $gte: 10, $lte: 20 });
    expect(parseListingQuery({ minPrice: 'x' }).price).toBeNull();
  });
  it('clamps rating and parses booleans / product type', () => {
    const p = parseListingQuery({ minRating: '9', quickDelivery: 'true', discountOnly: '1', productType: 'VEG' });
    expect(p).toMatchObject({ minRating: 5, quickDelivery: true, discountOnly: true, productType: 'veg' });
    expect(parseListingQuery({ productType: 'weird' }).productType).toBeNull();
  });
  it('quick delivery is fixed-promise within 30 minutes, optionally plus fast sellers', () => {
    expect(quickDeliveryCondition().deliveryPromiseMinutes).toEqual({ $ne: null, $lte: 30 });
    expect(quickDeliveryCondition(['s1']).$or).toHaveLength(2);
  });
});
