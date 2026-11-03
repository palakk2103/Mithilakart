const { CategoryLandingService } = require('../../../src/services/cms/CategoryLandingService');

const CAT = '64b000000000000000000001';
const SEC_A = '64b0000000000000000000a1';
const SEC_B = '64b0000000000000000000a2';

function build(overrides = {}) {
  const store = new Map();
  const deps = {
    bannerRepository: {
      findActive: jest.fn().mockResolvedValue([{ _id: 'b1', title: 'Fashion sale', imageUrl: '/f.jpg' }]),
      find: jest.fn().mockResolvedValue([]),
    },
    sectionRepository: {
      findForCategory: jest.fn().mockResolvedValue([
        { _id: SEC_A, title: 'Trending', sectionType: 'best_sellers', productLimit: 2 },
        { _id: SEC_B, title: 'Empty one', sectionType: 'manual', productIds: [], productLimit: 4 },
      ]),
      count: jest.fn().mockResolvedValue(0),
      create: jest.fn(async (d) => ({ _id: SEC_A, ...d })),
      findById: jest.fn(),
      updateById: jest.fn(),
      softDelete: jest.fn(),
    },
    configRepository: {
      findByCategory: jest.fn().mockResolvedValue(null),
      upsertByCategory: jest.fn(async (id, d) => ({ categoryId: id, ...d })),
    },
    categoryRepository: {
      findById: jest.fn().mockResolvedValue({ _id: CAT, parentIds: [], parentId: null, deletedAt: null }),
      findSubtreeIds: jest.fn().mockResolvedValue([CAT, 'sub1']),
    },
    categoryService: {
      listPublicTree: jest.fn().mockResolvedValue([
        { id: CAT, name: 'Fashion', children: [{ id: 'sub1', name: 'Men', children: [] }] },
        { id: 'other', name: 'Mobiles', children: [{ id: 'sub2', name: 'Phones', children: [] }] },
      ]),
    },
    productRepository: { findAdmin: jest.fn().mockResolvedValue([]) },
    marketplaceListingService: {
      listPublicForTab: jest.fn().mockResolvedValue({ items: [{ productId: 'p1' }, { productId: 'p2' }, { productId: 'p3' }] }),
      listPublicByProductIds: jest.fn().mockResolvedValue([]),
    },
    cacheService: {
      get: jest.fn(async (k) => store.get(k) || null),
      set: jest.fn(async (k, v) => store.set(k, v)),
      delByPattern: jest.fn().mockResolvedValue(),
    },
    ...overrides,
  };
  return { service: new CategoryLandingService(deps), deps };
}

describe('CategoryLandingService (public)', () => {
  it('returns banner, only own subcategories and non-empty sections in natural order', async () => {
    const { service, deps } = build();
    const out = await service.getPublicLanding(CAT, 'en');
    expect(out.enabled).toBe(true);
    expect(out.blocks.map((b) => b.type)).toEqual(['banner', 'subcategories', 'section']);
    expect(out.blocks[1].items.map((i) => i.name)).toEqual(['Men']); // never Mobiles' children
    expect(out.blocks[2].products).toHaveLength(2); // limited to productLimit
    expect(deps.marketplaceListingService.listPublicForTab).toHaveBeenCalledWith(
      expect.objectContaining({ marketplaceTab: 'mithilak', categoryId: CAT, sort: '-popularity' })
    );
  });

  it('honours saved block order and drops unknown keys', async () => {
    const { service, deps } = build();
    deps.configRepository.findByCategory.mockResolvedValue({ enabled: true, blockOrder: [`section:${SEC_A}`, 'ghost', 'banner'] });
    const out = await service.getPublicLanding(CAT);
    expect(out.blocks.map((b) => b.type)).toEqual(['section', 'banner', 'subcategories']);
  });

  it('returns enabled:false without content when admin disabled the landing', async () => {
    const { service, deps } = build();
    deps.configRepository.findByCategory.mockResolvedValue({ enabled: false, blockOrder: [] });
    const out = await service.getPublicLanding(CAT);
    expect(out).toMatchObject({ enabled: false, blocks: [] });
    expect(deps.bannerRepository.findActive).not.toHaveBeenCalled();
  });

  it('404s for a category that is not visible on the tab', async () => {
    const { service } = build();
    await expect(service.getPublicLanding('64b0000000000000000000ff')).rejects.toMatchObject({ statusCode: 404 });
  });

  it('survives a failing section and skips products already shown above', async () => {
    const { service, deps } = build();
    deps.sectionRepository.findForCategory.mockResolvedValue([
      { _id: SEC_A, title: 'One', sectionType: 'best_sellers', productLimit: 2 },
      { _id: SEC_B, title: 'Two', sectionType: 'new_arrivals', productLimit: 5 },
    ]);
    const out = await service.getPublicLanding(CAT);
    const sections = out.blocks.filter((b) => b.type === 'section');
    expect(sections[0].products.map((p) => p.productId)).toEqual(['p1', 'p2']);
    expect(sections[1].products.map((p) => p.productId)).toEqual(['p3']);

    deps.marketplaceListingService.listPublicForTab.mockRejectedValue(new Error('boom'));
    deps.cacheService.get.mockResolvedValue(null);
    const out2 = await service.getPublicLanding(CAT, 'hi');
    expect(out2.blocks.map((b) => b.type)).toEqual(['banner', 'subcategories']);
  });

  it('serves from cache on the second call', async () => {
    const { service, deps } = build();
    await service.getPublicLanding(CAT);
    await service.getPublicLanding(CAT);
    expect(deps.categoryService.listPublicTree).toHaveBeenCalledTimes(1);
  });
});

describe('CategoryLandingService (admin)', () => {
  it('rejects landing config for a subcategory', async () => {
    const { service, deps } = build();
    deps.categoryRepository.findById.mockResolvedValue({ _id: 'sub1', parentId: CAT, parentIds: [CAT] });
    await expect(service.createSection('sub1', { title: 'x', sectionType: 'manual' })).rejects.toMatchObject({ statusCode: 422 });
  });

  it('rejects products outside the category subtree', async () => {
    const { service, deps } = build();
    deps.productRepository.findAdmin.mockResolvedValue([{ _id: 'p9', categoryId: 'elsewhere', categoryIds: [] }]);
    await expect(service.createSection(CAT, { title: 'Pick', sectionType: 'manual', productIds: ['p9'] }))
      .rejects.toMatchObject({ statusCode: 422 });
  });

  it('rejects unknown product ids and bad schedules', async () => {
    const { service } = build();
    await expect(service.createSection(CAT, { title: 'Pick', productIds: ['pX'] })).rejects.toMatchObject({ statusCode: 422 });
    await expect(service.createSection(CAT, { title: 'S', startDate: '2026-02-01', endDate: '2026-01-01' }))
      .rejects.toMatchObject({ statusCode: 422 });
  });

  it('creates a section and invalidates the landing cache', async () => {
    const { service, deps } = build();
    await service.createSection(CAT, { title: 'Best Sellers', sectionType: 'best_sellers' });
    expect(deps.sectionRepository.create).toHaveBeenCalledWith(expect.objectContaining({ categoryId: CAT, sortOrder: 0 }));
    expect(deps.cacheService.delByPattern).toHaveBeenCalledWith('cache:storefront:landing:*');
  });

  it('validates block order keys', async () => {
    const { service } = build();
    await expect(service.updateConfig(CAT, { blockOrder: ['banner', '<script>'] })).rejects.toMatchObject({ statusCode: 422 });
    await expect(service.updateConfig(CAT, { blockOrder: ['subcategories', 'banner'] })).resolves.toBeDefined();
  });

  it('delete is safe for missing sections and cleans the saved order', async () => {
    const { service, deps } = build();
    deps.sectionRepository.findById.mockResolvedValueOnce(null);
    await expect(service.deleteSection(SEC_A)).rejects.toMatchObject({ statusCode: 404 });

    deps.sectionRepository.findById.mockResolvedValueOnce({ _id: SEC_A, categoryId: CAT });
    deps.configRepository.findByCategory.mockResolvedValue({ blockOrder: ['banner', `section:${SEC_A}`] });
    await service.deleteSection(SEC_A);
    expect(deps.configRepository.upsertByCategory).toHaveBeenCalledWith(CAT, { blockOrder: ['banner'] });
  });
});

describe('CategoryLandingService (tabs)', () => {
  it('scopes the tree, products and cache to the requested tab', async () => {
    const { service, deps } = build();
    await service.getPublicLanding(CAT, 'en', 'mithilakart');
    expect(deps.categoryService.listPublicTree).toHaveBeenCalledWith(null, 'mithilakart', 'en');
    expect(deps.marketplaceListingService.listPublicForTab).toHaveBeenCalledWith(expect.objectContaining({ marketplaceTab: 'mithilakart' }));
    expect(deps.cacheService.set).toHaveBeenCalledWith(expect.stringContaining(`${CAT}:mithilakart:en`), expect.anything(), expect.anything());
  });

  it('rejects unknown tabs', async () => {
    const { service } = build();
    await expect(service.getPublicLanding(CAT, 'en', 'quick_shop')).rejects.toMatchObject({ statusCode: 422 });
  });
});
