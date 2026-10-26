const { PromotionService } = require('../../../src/services/engagement/PromotionService');

describe('PromotionService', () => {
  let service;
  let flashSaleRepository;
  let flashSaleProductRepository;
  let featuredProductRepository;
  let productRepository;
  let couponRepository;

  beforeEach(() => {
    flashSaleRepository = {
      findActive: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
    };
    flashSaleProductRepository = {
      findByFlashSale: jest.fn(),
      findActiveForProduct: jest.fn(),
      create: jest.fn(),
    };
    featuredProductRepository = {
      findActive: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      updateById: jest.fn(),
    };
    productRepository = {
      find: jest.fn(),
      findPublicById: jest.fn(),
    };
    couponRepository = {
      find: jest.fn(),
    };

    service = new PromotionService({
      flashSaleRepository,
      flashSaleProductRepository,
      featuredProductRepository,
      productRepository,
      couponRepository,
    });
  });

  describe('getDeals', () => {
    it('returns empty array when no active flash sales exist', async () => {
      flashSaleRepository.findActive.mockResolvedValue([]);

      const deals = await service.getDeals();
      expect(deals).toEqual([]);
      expect(flashSaleRepository.findActive).toHaveBeenCalledTimes(1);
    });

    it('returns formatted flash sale deals with normalized product data', async () => {
      const mockSale = {
        _id: 'sale-1',
        title: 'Midnight Madness',
        startsAt: new Date(Date.now() - 3600000),
        endsAt: new Date(Date.now() + 3600000),
      };
      flashSaleRepository.findActive.mockResolvedValue([mockSale]);

      const mockProducts = [
        {
          _id: 'fsp-1',
          salePrice: 199,
          productId: {
            _id: 'prod-101',
            title: 'Wireless Earbuds',
            mrp: 499,
            price: 299,
            images: [{ url: 'https://example.com/earbuds.jpg' }],
            rating: 4.5,
          },
        },
      ];
      flashSaleProductRepository.findByFlashSale.mockResolvedValue(mockProducts);

      const deals = await service.getDeals();
      expect(deals).toHaveLength(1);
      expect(deals[0].type).toBe('flash_sale');
      expect(deals[0].sale).toEqual(mockSale);
      expect(deals[0].products).toHaveLength(1);

      const p = deals[0].products[0];
      expect(p.id).toBe('prod-101');
      expect(p.title).toBe('Wireless Earbuds');
      expect(p.price).toBe(199);
      expect(p.oldPrice).toBe(499);
      expect(p.discount).toBe('60% OFF');
      expect(p.image).toBe('https://example.com/earbuds.jpg');
    });
  });

  describe('getFlashSalePrice', () => {
    it('returns salePrice when product is in active flash sale', async () => {
      flashSaleProductRepository.findActiveForProduct.mockResolvedValue([{ salePrice: 150 }]);
      const price = await service.getFlashSalePrice('prod-1');
      expect(price).toBe(150);
    });

    it('returns null when product is not in active flash sale', async () => {
      flashSaleProductRepository.findActiveForProduct.mockResolvedValue([]);
      const price = await service.getFlashSalePrice('prod-1');
      expect(price).toBeNull();
    });
  });
});
