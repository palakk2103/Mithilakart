const { CategoryService } = require('../../../src/services/catalog/CategoryService');
const { MemoryRedisClient } = require('../../../src/core/redis/MemoryRedisClient');
const { CacheService } = require('../../../src/services/CacheService');

describe('CategoryService tree builder', () => {
  it('builds nested category tree', async () => {
    const mockRepo = {
      findActive: jest.fn().mockResolvedValue([
        { _id: '1', name: 'Root', slug: 'root', parentId: null, sortOrder: 0, commerceFlows: ['standard'] },
        { _id: '2', name: 'Child', slug: 'child', parentId: '1', sortOrder: 1, commerceFlows: ['standard'] },
      ]),
    };

    const cache = new CacheService(new MemoryRedisClient());
    const service = new CategoryService(mockRepo, cache);
    const tree = await service.listPublicTree('standard');

    expect(tree).toHaveLength(1);
    expect(tree[0].children).toHaveLength(1);
    expect(tree[0].children[0].slug).toBe('child');
  });

  it('places a child category under multiple parents when parentIds has multiple IDs', async () => {
    const mockRepo = {
      findActive: jest.fn().mockResolvedValue([
        { _id: 'dairy', name: 'Dairy Products', slug: 'dairy', parentIds: [], sortOrder: 0, commerceFlows: ['standard'] },
        { _id: 'drinks', name: 'Drinks & Beverages', slug: 'drinks', parentIds: [], sortOrder: 1, commerceFlows: ['standard'] },
        { _id: 'buttermilk', name: 'Buttermilk & Lassi', slug: 'buttermilk-lassi', parentIds: ['dairy', 'drinks'], sortOrder: 2, commerceFlows: ['standard'] },
      ]),
    };

    const cache = new CacheService(new MemoryRedisClient());
    const service = new CategoryService(mockRepo, cache);
    const tree = await service.listPublicTree('standard');

    expect(tree).toHaveLength(2);
    const dairy = tree.find((c) => c.slug === 'dairy');
    const drinks = tree.find((c) => c.slug === 'drinks');

    expect(dairy.children).toHaveLength(1);
    expect(dairy.children[0].slug).toBe('buttermilk-lassi');

    expect(drinks.children).toHaveLength(1);
    expect(drinks.children[0].slug).toBe('buttermilk-lassi');
  });
});
