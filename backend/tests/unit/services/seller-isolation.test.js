const { SellerProductService } = require('../../../src/services/seller/SellerProductService');
const { AppError } = require('../../../src/utils/AppError');

describe('seller isolation', () => {
  const sellerA = '507f1f77bcf86cd799439011';
  const sellerB = '507f1f77bcf86cd799439012';
  const productId = '507f1f77bcf86cd799439013';

  it('prevents seller A from reading seller B product', async () => {
    const productRepository = {
      findOne: jest.fn().mockResolvedValue(null),
      findBySeller: jest.fn(),
      countBySeller: jest.fn(),
    };

    const service = new SellerProductService({
      productRepository,
      productVariantRepository: { findByProductId: jest.fn() },
      categoryRepository: {},
      cacheService: {},
    });

    await expect(service.getById(sellerA, productId)).rejects.toMatchObject({
      statusCode: AppError.notFound().statusCode,
    });

    expect(productRepository.findOne).toHaveBeenCalledWith({
      _id: productId,
      sellerId: sellerA,
      deletedAt: null,
    });
  });

  it('scopes product list queries to requesting seller', async () => {
    const productRepository = {
      findBySeller: jest.fn().mockResolvedValue([]),
      countBySeller: jest.fn().mockResolvedValue(0),
    };

    const service = new SellerProductService({
      productRepository,
      productVariantRepository: {},
      categoryRepository: {},
      cacheService: {},
    });

    await service.list(sellerB, { page: 1, limit: 10 });

    expect(productRepository.findBySeller).toHaveBeenCalledWith(
      sellerB,
      expect.any(Object),
      expect.any(Object)
    );
    expect(productRepository.countBySeller).toHaveBeenCalledWith(sellerB, expect.any(Object));
  });
});
