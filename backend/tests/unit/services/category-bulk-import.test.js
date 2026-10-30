/**
 * Category tab visibility + admin bulk category import.
 *
 * Regressions covered (customer app showed wrong / missing subcategories):
 *  - a subcategory created without explicit tabs got the schema default
 *    ['mithilakart'] and vanished from its parent's tab;
 *  - a subcategory enabled for "all tabs" pulled its parent into every tab;
 *  - a child of a deleted parent was rendered as a top-level category;
 *  - 3-level category hierarchy: Category -> Subcategory -> Childcategory.
 */
const { CategoryService } = require('../../../src/services/catalog/CategoryService');
const { CategoryBulkImportService } = require('../../../src/services/catalog/CategoryBulkImportService');
const { MemoryRedisClient } = require('../../../src/core/redis/MemoryRedisClient');
const { CacheService } = require('../../../src/services/CacheService');

const cat = (id, name, extra = {}) => ({
  _id: id,
  name,
  slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
  parentId: null,
  sortOrder: 0,
  isActive: true,
  deletedAt: null,
  visibleTabs: ['mithilakart'],
  commerceFlows: ['standard'],
  ...extra,
});

function makeRepo(seed) {
  const docs = seed.map((d) => ({ ...d }));
  let nextId = 1000;
  return {
    docs,
    findActive: jest.fn(async () => docs.filter((d) => !d.deletedAt)),
    findById: jest.fn(async (id) => docs.find((d) => String(d._id) === String(id)) || null),
    create: jest.fn(async (data) => {
      const doc = { _id: String(nextId++), deletedAt: null, ...data };
      docs.push(doc);
      return doc;
    }),
    updateById: jest.fn(async (id, data) => {
      const doc = docs.find((d) => String(d._id) === String(id));
      Object.assign(doc, data);
      return doc;
    }),
  };
}

const newService = (repo) => new CategoryService(repo, new CacheService(new MemoryRedisClient()));

describe('CategoryService tab visibility', () => {
  const groceries = cat('g', 'Groceries Root', { visibleTabs: ['groceries_fresh'], commerceFlows: ['fresh_grocery'] });

  it('shows a subcategory carrying the old default tab under a Groceries-only parent', async () => {
    const repo = makeRepo([groceries, cat('c1', 'Fresh Fruits', { parentId: 'g' })]);
    const tree = await newService(repo).listPublicTree(null, 'groceries_fresh');
    expect(tree).toHaveLength(1);
    expect(tree[0].children.map((c) => c.name)).toEqual(['Fresh Fruits']);
  });

  it('does not pull a parent into other tabs because a child is enabled there', async () => {
    const repo = makeRepo([
      groceries,
      cat('c1', 'Fresh Fruits', {
        parentId: 'g',
        visibleTabs: ['mithilakart', 'mithilak', 'quick_shop', 'groceries_fresh'],
      }),
    ]);
    const tree = await newService(repo).listPublicTree(null, 'mithilakart');
    expect(tree).toHaveLength(0);
  });

  it('hides children whose parent is missing instead of promoting them to top level', async () => {
    const repo = makeRepo([cat('c1', 'Orphan', { parentId: 'deleted-parent' })]);
    const tree = await newService(repo).listPublicTree(null, 'mithilakart');
    expect(tree).toHaveLength(0);
  });

  it('respects a per-child exclusion that overlaps the parent tabs', async () => {
    const parent = cat('p', 'Snacks', { visibleTabs: ['quick_shop', 'groceries_fresh'] });
    const repo = makeRepo([parent, cat('c1', 'Chips', { parentId: 'p', visibleTabs: ['quick_shop'] })]);
    const service = newService(repo);
    expect((await service.listPublicTree(null, 'quick_shop'))[0].children).toHaveLength(1);
    expect((await service.listPublicTree(null, 'groceries_fresh'))[0].children).toHaveLength(0);
  });

  it('new subcategories inherit the parent tabs when none are given', async () => {
    const repo = makeRepo([groceries]);
    repo.slugExists = jest.fn(async () => false);
    await newService(repo).create({ name: 'Dairy', slug: 'dairy', parentId: 'g' });
    expect(repo.create).toHaveBeenCalledWith(expect.objectContaining({
      visibleTabs: ['groceries_fresh'],
      commerceFlows: ['fresh_grocery'],
    }));
  });
});

describe('CategoryBulkImportService', () => {
  const setup = (seed = []) => {
    const repo = makeRepo(seed);
    const categoryService = newService(repo);
    return { repo, importer: new CategoryBulkImportService({ categoryRepository: repo, categoryService }) };
  };

  it('dry run plans creates without writing anything', async () => {
    const { repo, importer } = setup();
    const result = await importer.import({
      marketplaceTab: 'groceries_fresh',
      dryRun: true,
      rows: [
        { category: 'Fruits & Vegetables', subcategory: 'Fresh Fruits', imageUrl: 'https://cdn.x/f.png' },
        { category: 'Fruits & Vegetables', subcategory: 'Fresh Vegetables' },
        { category: 'Dairy' },
      ],
    });

    expect(repo.create).not.toHaveBeenCalled();
    expect(result.summary).toMatchObject({
      totalRows: 3, validRows: 3, errorRows: 0, categoriesToCreate: 2, subcategoriesToCreate: 2,
    });
    expect(result.rows[0]).toMatchObject({ categoryAction: 'create', subcategoryAction: 'create', status: 'ok' });
    expect(result.rows[0].nodes).toBeUndefined();
  });

  it('commit creates parents before children and links them to the tab', async () => {
    const { repo, importer } = setup();
    await importer.import({
      marketplaceTab: 'groceries_fresh',
      dryRun: false,
      rows: [
        { category: 'Fruits & Vegetables', subcategory: 'Fresh Fruits', imageUrl: 'https://cdn.x/f.png' },
        { category: 'fruits & vegetables', subcategory: 'Fresh Vegetables' },
      ],
    });

    const parent = repo.docs.find((d) => d.name === 'Fruits & Vegetables');
    const children = repo.docs.filter((d) => d.parentId === parent._id);
    expect(repo.docs).toHaveLength(3); // case-insensitive match reused the parent
    expect(children.map((c) => c.name)).toEqual(['Fresh Fruits', 'Fresh Vegetables']);
    expect(children[0].imageUrl).toBe('https://cdn.x/f.png');
    expect(parent.visibleTabs).toEqual(['groceries_fresh']);
    expect(parent.commerceFlows).toEqual(['fresh_grocery']);
  });

  it('reuses an existing category and adds the tab instead of duplicating it', async () => {
    const existing = cat('e1', 'Snacks', { visibleTabs: ['quick_shop'], commerceFlows: ['quick_shop'] });
    const { repo, importer } = setup([existing]);
    const result = await importer.import({
      marketplaceTab: 'groceries_fresh',
      dryRun: false,
      rows: [{ category: 'Snacks', subcategory: 'Chips' }],
    });

    expect(result.rows[0].categoryAction).toBe('add-to-tab');
    expect(repo.docs.filter((d) => d.name === 'Snacks')).toHaveLength(1);
    expect(repo.docs[0].visibleTabs.sort()).toEqual(['groceries_fresh', 'quick_shop']);
    expect(repo.docs.find((d) => d.name === 'Chips').parentId).toBe('e1');
  });

  it('avoids slug collisions with categories in other tabs', async () => {
    const { repo, importer } = setup([cat('x', 'Chips', { parentId: null })]);
    await importer.import({
      marketplaceTab: 'groceries_fresh',
      dryRun: false,
      rows: [{ category: 'Snacks', subcategory: 'Chips' }],
    });
    const child = repo.docs.find((d) => d.name === 'Chips' && d.parentId);
    expect(child.slug).toBe('snacks-chips');
  });

  it('reports per-row errors and skips only those rows', async () => {
    const { repo, importer } = setup();
    const result = await importer.import({
      marketplaceTab: 'mithilak',
      dryRun: false,
      rows: [
        { category: '', subcategory: 'Lonely' },
        { category: 'Art', imageUrl: 'not-a-url' },
        { category: 'Art', sortOrder: -1 },
        { category: 'Handicrafts', isActive: 'maybe' },
        { category: 'Books' },
        {},
      ],
    });

    expect(result.rows.map((r) => r.status)).toEqual(['error', 'error', 'error', 'error', 'ok', 'skipped']);
    expect(repo.docs.map((d) => d.name)).toEqual(['Books']);
  });

  it('correctly creates 3 levels: Category -> Subcategory -> Childcategory', async () => {
    const { repo, importer } = setup();
    const result = await importer.import({
      marketplaceTab: 'groceries_fresh',
      dryRun: false,
      rows: [
        { category: 'Pooja Needs', subcategory: 'Pooja Prasad & Bhog', childCategory: 'Sweets', sortOrder: 0 },
        { category: 'Pooja Needs', subcategory: 'Pooja Prasad & Bhog', childCategory: 'Dry-Fruits', sortOrder: 1 },
        { category: 'Pooja Needs', subcategory: 'Pooja Prasad & Bhog', childCategory: 'Panchamrit', sortOrder: 2 },
      ],
    });

    expect(result.summary).toMatchObject({
      totalRows: 3,
      validRows: 3,
      errorRows: 0,
      categoriesToCreate: 1,
      subcategoriesToCreate: 1,
      childCategoriesToCreate: 3,
    });

    const root = repo.docs.find((d) => d.name === 'Pooja Needs');
    expect(root).toBeDefined();
    expect(root.parentId).toBeNull();

    const sub = repo.docs.find((d) => d.name === 'Pooja Prasad & Bhog');
    expect(sub).toBeDefined();
    expect(sub.parentId).toBe(root._id);

    const sweets = repo.docs.find((d) => d.name === 'Sweets');
    const dryFruits = repo.docs.find((d) => d.name === 'Dry-Fruits');
    const panchamrit = repo.docs.find((d) => d.name === 'Panchamrit');

    expect(sweets).toBeDefined();
    expect(sweets.parentId).toBe(sub._id);
    expect(dryFruits).toBeDefined();
    expect(dryFruits.parentId).toBe(sub._id);
    expect(panchamrit).toBeDefined();
    expect(panchamrit.parentId).toBe(sub._id);
  });

  it('reuses existing root and subcategory when importing new childcategories', async () => {
    const root = cat('root1', 'Pooja Needs', { visibleTabs: ['groceries_fresh'], commerceFlows: ['fresh_grocery'] });
    const sub = cat('sub1', 'Pooja Prasad & Bhog', { parentId: 'root1', visibleTabs: ['groceries_fresh'], commerceFlows: ['fresh_grocery'] });
    const { repo, importer } = setup([root, sub]);

    const result = await importer.import({
      marketplaceTab: 'groceries_fresh',
      dryRun: false,
      rows: [
        { category: 'Pooja Needs', subcategory: 'Pooja Prasad & Bhog', childCategory: 'Sweets' },
      ],
    });

    expect(result.rows[0].categoryAction).toBe('unchanged');
    expect(result.rows[0].subcategoryAction).toBe('unchanged');
    expect(result.rows[0].childCategoryAction).toBe('create');

    const createdSweets = repo.docs.find((d) => d.name === 'Sweets');
    expect(createdSweets).toBeDefined();
    expect(createdSweets.parentId).toBe('sub1');
    expect(repo.docs.filter((d) => d.name === 'Pooja Needs')).toHaveLength(1);
    expect(repo.docs.filter((d) => d.name === 'Pooja Prasad & Bhog')).toHaveLength(1);
  });

  it('supports custom slug in CSV rows and allows same-name subcategories under different categories', async () => {
    const { repo, importer } = setup();

    const result = await importer.import({
      marketplaceTab: 'mithilakart',
      dryRun: false,
      rows: [
        { category: 'Men', subcategory: 'Shirts', slug: 'men-shirts' },
        { category: 'Women', subcategory: 'Shirts', slug: 'women-shirts' },
      ],
    });

    expect(result.summary.validRows).toBe(2);
    expect(result.summary.errorRows).toBe(0);

    const menShirts = repo.docs.find((d) => d.slug === 'men-shirts');
    const womenShirts = repo.docs.find((d) => d.slug === 'women-shirts');

    expect(menShirts).toBeDefined();
    expect(menShirts.name).toBe('Shirts');
    expect(womenShirts).toBeDefined();
    expect(womenShirts.name).toBe('Shirts');
    expect(menShirts.parentId).not.toBe(womenShirts.parentId);
  });

  it('updates an existing category slug if requested in CSV', async () => {
    const existing = cat('e1', 'Kurtas', { slug: 'old-kurtas-slug', visibleTabs: ['mithilakart'] });
    const { repo, importer } = setup([existing]);

    const result = await importer.import({
      marketplaceTab: 'mithilakart',
      dryRun: false,
      rows: [
        { category: 'Kurtas', slug: 'new-kurtas-slug' },
      ],
    });

    expect(result.rows[0].categoryAction).toBe('update');
    const updated = repo.docs.find((d) => d._id === 'e1');
    expect(updated.slug).toBe('new-kurtas-slug');
  });
});
