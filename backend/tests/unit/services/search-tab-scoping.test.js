/**
 * Production readiness audit Pass 2 (2026-08-25) — search tab-scoping.
 *
 * Real, LIVE-confirmed bug (found by probing the actual running backend, not
 * just reading code): ProductService.searchPublic() never routed to the
 * tab-scoped MarketplaceListing path at all — it only ever queried Product
 * directly via the legacy commerceFlow filter, and `applyCommerceFlowFilter`
 * only reads `query.commerceFlow`, never `query.marketplaceTab`.
 *
 * Live proof, before the fix:
 *   GET /products/search?q=Atta&marketplaceTab=mithilak  -> 4 results
 *   GET /products/search?q=Atta                          -> 4 results (identical)
 * "Atta" is a quick_shop-only seeded product (catalogKey CR002TEST-ATTA-5KG).
 * Searching it while explicitly scoped to `mithilak` returned it anyway.
 *
 * This is the same root defect as the /products and /categories/:id/products
 * leak fixed earlier in this pass (product-tab-scoping.test.js), in a fourth
 * call site that audit missed.
 */
const { ProductService } = require('../../../src/services/catalog/ProductService');
const { MarketplaceListingService } = require('../../../src/services/marketplace/MarketplaceListingService');

describe('production-readiness — search marketplaceTab scoping', () => {
  describe('ProductService.searchPublic routes to the tab-scoped path when a tab is present', () => {
    function buildService() {
      const marketplaceListingService = { listPublicForTab: jest.fn(async () => ({ items: [], meta: {} })) };
      const productRepository = {
        searchPublic: jest.fn(async () => []),
        countPublic: jest.fn(async () => 0),
      };
      const service = new ProductService(
        productRepository, null, null, null, marketplaceListingService
      );
      return { service, marketplaceListingService, productRepository };
    }

    it('with marketplaceTab present, uses the tab-scoped path — not the unscoped legacy search', async () => {
      const { service, marketplaceListingService, productRepository } = buildService();

      await service.searchPublic({ q: 'Atta', marketplaceTab: 'mithilak' });

      expect(marketplaceListingService.listPublicForTab).toHaveBeenCalledWith(
        expect.objectContaining({ q: 'Atta', marketplaceTab: 'mithilak' })
      );
      expect(productRepository.searchPublic).not.toHaveBeenCalled();
    });

    it('with commerceFlow present (legacy alias), also uses the tab-scoped path', async () => {
      const { service, marketplaceListingService, productRepository } = buildService();

      await service.searchPublic({ q: 'Atta', commerceFlow: 'quick_shop' });

      expect(marketplaceListingService.listPublicForTab).toHaveBeenCalledTimes(1);
      expect(productRepository.searchPublic).not.toHaveBeenCalled();
    });

    it('WITHOUT any tab param, still falls through to the legacy unscoped search (unchanged behaviour)', async () => {
      const { service, marketplaceListingService, productRepository } = buildService();

      await service.searchPublic({ q: 'Atta' });

      expect(marketplaceListingService.listPublicForTab).not.toHaveBeenCalled();
      expect(productRepository.searchPublic).toHaveBeenCalledTimes(1);
    });

    it('still requires a search term regardless of tab presence', async () => {
      const { service } = buildService();
      await expect(service.searchPublic({ marketplaceTab: 'quick_shop' }))
        .rejects.toMatchObject({ code: 'VALIDATION_ERROR' });
    });
  });

  describe('MarketplaceListingService.listPublicForTab actually filters by search term', () => {
    function buildService() {
      const marketplaceListingRepository = {
        findPublic: jest.fn(async () => []),
        countPublic: jest.fn(async () => 0),
      };
      const productRepository = {
        findPublic: jest.fn(async () => []),
        searchPublic: jest.fn(async () => []),
        getAvailableStock: jest.fn(() => 5),
      };
      const marketplaceEngineService = {
        assertTabActive: jest.fn(async () => true),
      };
      const service = new MarketplaceListingService({
        marketplaceListingRepository,
        marketplaceEngineService,
        productRepository,
        categoryRepository: null,
        sellerRepository: null,
      });
      return { service, marketplaceListingRepository, productRepository };
    }

    it('intersects search matches with the tab filter — the actual bug this closes', async () => {
      const { service, marketplaceListingRepository, productRepository } = buildService();
      const attaId = 'prod-atta-quickshop';

      // Product-level text search finds it (it exists, just on a different tab).
      productRepository.searchPublic.mockResolvedValue([{ _id: attaId }]);

      await service.listPublicForTab({ q: 'Atta', marketplaceTab: 'mithilak' });

      // The MarketplaceListing query must be scoped to BOTH the tab AND the
      // search-matched product ids — proving the intersection actually happens,
      // not just a tab filter that search-matched ids get ignored by.
      expect(marketplaceListingRepository.findPublic).toHaveBeenCalledWith(
        expect.objectContaining({
          marketplaceTab: 'mithilak',
          productId: { $in: [attaId] },
        }),
        expect.anything()
      );
    });

    it('returns empty (not everything) when the search term matches no product at all', async () => {
      const { service, marketplaceListingRepository, productRepository } = buildService();
      productRepository.searchPublic.mockResolvedValue([]);

      const result = await service.listPublicForTab({ q: 'nonexistent-xyz', marketplaceTab: 'quick_shop' });

      expect(result.items).toEqual([]);
      expect(marketplaceListingRepository.findPublic).not.toHaveBeenCalled();
    });

    it('combines category AND search filters correctly (intersection of both, not either)', async () => {
      const { service, marketplaceListingRepository, productRepository } = buildService();

      // Category branch finds these two products.
      productRepository.findPublic.mockResolvedValueOnce([{ _id: 'in-category-1' }, { _id: 'in-category-2' }]);
      // Search branch finds a different, overlapping set.
      productRepository.searchPublic.mockResolvedValue([{ _id: 'in-category-1' }, { _id: 'not-in-category' }]);

      await service.listPublicForTab({ q: 'Atta', categoryId: 'cat-1', marketplaceTab: 'quick_shop' });

      const [filter] = marketplaceListingRepository.findPublic.mock.calls[0];
      expect(filter.productId.$in).toEqual(['in-category-1']);
    });
  });
});
