const { ProductService } = require('../../../src/services/catalog/ProductService');
const { SellerProductService } = require('../../../src/services/seller/SellerProductService');
const { sellerProductCreateSchema, sellerProductUpdateSchema } = require('../../../src/validators/seller/seller.validator');

const cat = (id) => ({ _id: id, deletedAt: null });

describe('product multi-category assignment', () => {
  describe('validator', () => {
    const base = { title: 'Lassi', sku: 'L1', price: 20, mrp: 25, categoryId: 'c1' };
    it('accepts categoryIds and keeps legacy payloads (without it) valid', () => {
      expect(sellerProductCreateSchema.validate({ ...base, categoryIds: ['c2', 'c3'] }).error).toBeUndefined();
      expect(sellerProductCreateSchema.validate(base).error).toBeUndefined();
      expect(sellerProductUpdateSchema.validate({ categoryIds: [] }).error).toBeUndefined();
    });
  });

  describe('SellerProductService', () => {
    const build = (categories) => {
      const productRepository = {
        findOne: jest.fn().mockResolvedValue(null),
        create: jest.fn(async (doc) => ({ _id: 'p1', ...doc })),
        updateById: jest.fn(async (id, doc) => ({ _id: id, ...doc })),
      };
      const categoryRepository = { findById: jest.fn(async (id) => categories[id] || null) };
      const svc = new SellerProductService({ productRepository, productVariantRepository: {}, categoryRepository, cacheService: null });
      svc._syncListings = jest.fn().mockResolvedValue();
      return { svc, productRepository, categoryRepository };
    };

    it('stores ONE product with deduped additional categories, excluding the primary', async () => {
      const { svc, productRepository } = build({ c1: cat('c1'), c2: cat('c2'), c3: cat('c3') });
      await svc.create('s1', { title: 'Lassi', sku: 'L1', price: 20, mrp: 25, categoryId: 'c1', categoryIds: ['c2', 'c2', 'c1', 'c3'] });
      expect(productRepository.create).toHaveBeenCalledTimes(1);
      const saved = productRepository.create.mock.calls[0][0];
      expect(saved.categoryId).toBe('c1');
      expect(saved.categoryIds).toEqual(['c2', 'c3']);
    });

    it('rejects an additional category that does not exist or is deleted', async () => {
      const { svc, productRepository } = build({ c1: cat('c1'), c2: { _id: 'c2', deletedAt: new Date() } });
      await expect(
        svc.create('s1', { title: 'x', sku: 'x', price: 1, mrp: 1, categoryId: 'c1', categoryIds: ['c2'] })
      ).rejects.toThrow(/Category not found/);
      expect(productRepository.create).not.toHaveBeenCalled();
    });

    it('legacy payload without categoryIds saves an empty list', async () => {
      const { svc, productRepository } = build({ c1: cat('c1') });
      await svc.create('s1', { title: 'x', sku: 'x', price: 1, mrp: 1, categoryId: 'c1' });
      expect(productRepository.create.mock.calls[0][0].categoryIds).toEqual([]);
    });

    it('update changes only the assignments requested; moving the primary drops it from extras', async () => {
      const { svc, productRepository } = build({ c1: cat('c1'), c2: cat('c2'), c3: cat('c3') });
      productRepository.findOne.mockResolvedValue({ _id: 'p1', categoryId: 'c1', categoryIds: ['c2', 'c3'], title: 't' });
      await svc.update('s1', 'p1', { categoryIds: ['c3'] });
      expect(productRepository.updateById.mock.calls[0][1].categoryIds).toEqual(['c3']);

      await svc.update('s1', 'p1', { categoryId: 'c2' });
      expect(productRepository.updateById.mock.calls[1][1].categoryIds).toEqual(['c3']); // c2 is now primary
    });

    it('update that does not touch categories leaves categoryIds out of the write', async () => {
      const { svc, productRepository } = build({});
      productRepository.findOne.mockResolvedValue({ _id: 'p1', categoryId: 'c1', categoryIds: ['c2'] });
      await svc.update('s1', 'p1', { price: 99 });
      expect(productRepository.updateById.mock.calls[0][1]).not.toHaveProperty('categoryIds');
    });
  });

  describe('ProductService.listPublic category filter', () => {
    it('matches primary OR additional category over the whole subtree, without clobbering search $or', async () => {
      const productRepository = { findPublic: jest.fn().mockResolvedValue([]), countPublic: jest.fn().mockResolvedValue(0) };
      const categoryRepository = { findSubtreeIds: jest.fn().mockResolvedValue(['dairy', 'lassi']) };
      const svc = new ProductService(productRepository, {}, categoryRepository, { get: async () => null, set: async () => {} }, null);
      await svc.listPublic({ categoryId: 'dairy', q: 'lassi' });
      const filter = productRepository.findPublic.mock.calls[0][0];
      expect(filter.$and).toEqual([{ $or: [{ categoryId: { $in: ['dairy', 'lassi'] } }, { categoryIds: { $in: ['dairy', 'lassi'] } }] }]);
      expect(filter.categoryId).toBeUndefined();
    });
  });
});
