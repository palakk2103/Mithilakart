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
});
