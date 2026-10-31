const { AlreadyBoughtService } = require('../../../src/services/users/AlreadyBoughtService');

const oid = (n) => String(n).padStart(24, '0');
const lean = (rows) => ({ lean: async () => rows });

const build = ({ aggRows, products, listings = [], variants = [] }) => new AlreadyBoughtService({
  orderItemModel: { aggregate: async () => [{ rows: aggRows, total: [{ n: aggRows.length }] }] },
  productModel: { find: () => lean(products) },
  listingModel: { find: () => lean(listings) },
  variantModel: { find: () => lean(variants) },
});

const row = (p, extra = {}) => ({
  _id: { productId: oid(p), variantId: null }, listingId: null, marketplaceTab: null,
  commerceFlow: 'standard', lastPurchasedAt: new Date(), timesBought: 2, ...extra,
});
const product = (p, extra = {}) => ({
  _id: oid(p), title: `P${p}`, status: 'approved', price: 100, mrp: 150, stock: 5, reservedStock: 1, images: [], ...extra,
});

describe('AlreadyBoughtService', () => {
  it('uses current price and flags stock', async () => {
    const svc = build({ aggRows: [row(1), row(2)], products: [product(1, { price: 90 }), product(2, { stock: 0 })] });
    const { items } = await svc.list(oid(9));
    expect(items[0]).toMatchObject({ price: 90, discountPercent: 40, inStock: true, stock: 4 });
    expect(items[1].inStock).toBe(false);
  });

  it('skips deleted/unapproved products and inactive listings', async () => {
    const svc = build({
      aggRows: [row(1), row(2), row(3, { listingId: oid(30), marketplaceTab: 'quick_shop' })],
      products: [product(2, { status: 'rejected' }), product(3)],
      listings: [{ _id: oid(30), productId: oid(3), marketplaceTab: 'quick_shop', listingStatus: 'suspended', isVisible: true, price: 1, mrp: 2 }],
    });
    expect((await svc.list(oid(9))).items).toHaveLength(0);
  });

  it('clamps page size', async () => {
    const svc = build({ aggRows: [], products: [] });
    expect((await svc.list(oid(9), { limit: 999 })).pagination.limit).toBe(24);
  });
});
