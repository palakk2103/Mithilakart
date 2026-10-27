const { SellerProductBulkImportService } = require('../../../src/services/seller/SellerProductBulkImportService');
const { CategoryService } = require('../../../src/services/catalog/CategoryService');

const categories = [
  { _id: 'fv', name: 'Fruits & Vegetables', parentId: null, isActive: true, visibleTabs: ['groceries_fresh', 'quick_shop'] },
  { _id: 'ff', name: 'Fresh Fruits', parentId: 'fv', isActive: true, visibleTabs: ['groceries_fresh', 'quick_shop'] },
  { _id: 'art', name: 'Mithila Art', parentId: null, isActive: true, visibleTabs: ['mithilak'] },
];

function setup({ existingSkus = [], hasLocation = true } = {}) {
  const sellerProductService = {
    create: jest.fn(async (sellerId, data) => ({ _id: `new-${data.sku}`, status: 'approved' })),
    update: jest.fn(async (sellerId, id) => ({ _id: id, status: 'approved' })),
  };
  const importer = new SellerProductBulkImportService({
    sellerProductService,
    productRepository: {
      find: jest.fn(async () => existingSkus.map((sku, i) => ({ _id: `p${i}`, sku }))),
    },
    categoryRepository: { findActive: jest.fn(async () => categories) },
    categoryService: new CategoryService({}, {}),
    sellerRepository: {
      findById: jest.fn(async () => (hasLocation ? { latitude: 25.1, longitude: 85.3 } : {})),
    },
  });
  return { importer, sellerProductService };
}

const validRow = {
  title: 'Alphonso Mango 1kg',
  sku: 'MANGO-1KG',
  price: '₹249',
  mrp: '299',
  stock: '40',
  category: 'Fruits & Vegetables',
  subcategory: 'Fresh Fruits',
  tabs: 'Groceries & Fresh, quick_shop',
  imageUrls: ['https://cdn.x/mango.jpg'],
  deliveryPromiseMinutes: '20',
  specifications: 'Origin: Ratnagiri; Grade: A',
  dimensionsCm: '20x15x10',
};

describe('SellerProductBulkImportService', () => {
  it('dry run resolves category/tabs and builds the product payload without saving', async () => {
    const { importer, sellerProductService } = setup();
    const result = await importer.import('seller1', { dryRun: true, rows: [validRow] });

    expect(sellerProductService.create).not.toHaveBeenCalled();
    expect(result.summary).toMatchObject({ validRows: 1, toCreate: 1, errorRows: 0 });
    expect(result.rows[0]).toMatchObject({
      status: 'ok',
      action: 'create',
      price: 249,
      mrp: 299,
      stock: 40,
      categoryId: 'ff',
      categoryPath: 'Fruits & Vegetables › Fresh Fruits',
      tabs: ['groceries_fresh', 'quick_shop'],
    });
    expect(result.rows[0].payload).toBeUndefined();
  });

  it('commit creates new SKUs and updates known SKUs with the listing delivery promise', async () => {
    const { importer, sellerProductService } = setup({ existingSkus: ['mango-1kg'] });
    const result = await importer.import('seller1', {
      dryRun: false,
      rows: [validRow, { ...validRow, sku: 'BANANA-12', title: 'Banana 12pc' }],
    });

    expect(sellerProductService.update).toHaveBeenCalledWith(
      'seller1', 'p0',
      expect.objectContaining({
        categoryId: 'ff',
        commerceFlows: ['fresh_grocery', 'quick_shop'],
        attributes: { Origin: 'Ratnagiri', Grade: 'A', dimensions: { length: 20, width: 15, height: 10 } },
        images: [{ url: 'https://cdn.x/mango.jpg', alt: 'Alphonso Mango 1kg', sortOrder: 0 }],
      }),
      { deliveryPromiseMinutes: 20 }
    );
    expect(sellerProductService.create).toHaveBeenCalledTimes(1);
    expect(result.rows.map((r) => r.productId)).toEqual(['p0', 'new-BANANA-12']);
  });

  it('rejects rows whose category is not shown in a selected tab', async () => {
    const { importer } = setup();
    const result = await importer.import('seller1', {
      dryRun: true,
      rows: [{ ...validRow, tabs: 'mithilakart' }],
    });
    expect(result.rows[0].status).toBe('error');
    expect(result.rows[0].errors.join()).toMatch(/not shown in Mithilakart/);
  });

  it('accepts a subcategory name alone in the Category column', async () => {
    const { importer } = setup();
    const result = await importer.import('seller1', {
      dryRun: true,
      rows: [{ ...validRow, category: 'fresh fruits', subcategory: '' }],
    });
    expect(result.rows[0].categoryId).toBe('ff');
  });

  it('collects every problem on a row and never saves invalid rows', async () => {
    const { importer, sellerProductService } = setup({ hasLocation: false });
    const result = await importer.import('seller1', {
      dryRun: false,
      rows: [
        { ...validRow, price: '500', mrp: '300', category: 'Nope', imageUrls: ['mango.jpg'], deliveryPromiseMinutes: '17' },
        { ...validRow, sku: 'DUP' },
        { ...validRow, sku: 'dup' },
        { ...validRow, sku: 'X1', imageUrls: ['/pending-upload/x.jpg'] },
      ],
    });

    const [bad, first, dup, pending] = result.rows;
    expect(bad.errors.join(' | ')).toEqual(expect.stringContaining('higher than MRP'));
    expect(bad.errors.join(' | ')).toEqual(expect.stringContaining('Category "Nope" not found'));
    expect(bad.errors.join(' | ')).toEqual(expect.stringContaining('store location'));
    expect(bad.errors.join(' | ')).toEqual(expect.stringContaining('is not a URL'));
    expect(bad.errors.join(' | ')).toEqual(expect.stringContaining('Delivery promise'));
    expect(first.status).toBe('error'); // store location missing
    expect(dup.errors.join()).toMatch(/SKU repeats row 3/);
    expect(pending.errors.join()).toMatch(/was not uploaded/);
    expect(sellerProductService.create).not.toHaveBeenCalled();
  });
});
