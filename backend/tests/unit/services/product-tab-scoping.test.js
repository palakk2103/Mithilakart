/**
 * Production readiness audit (2026-08-25) — catalog tab-scoping.
 *
 * Real, live-confirmed bug: /products and /categories/:id/products routed to
 * an UNSCOPED legacy query path whenever the caller sent no `commerceFlow` /
 * `marketplaceTab` — which every consuming frontend page did. Result: three
 * customer-facing pages (Products.jsx, CategoryProducts.jsx,
 * CategoryProductsSection.jsx on Home) returned products/categories from ALL
 * FOUR marketplace tabs mixed together, instead of only the tab the customer
 * was actually browsing. Confirmed against live Atlas data: 76 approved
 * products with no tab filter vs. 35/22/15/11 correctly split across
 * mithilakart/quick_shop/mithilak/groceries_fresh via MarketplaceListing.
 *
 * A second, independent defect compounded this: even after fixing the
 * frontend to send `?marketplaceTab=`, the Joi query schema
 * (listProductsQuerySchema) had no `marketplaceTab` field, so
 * `stripUnknown: true` silently deleted it before the controller ever saw it
 * — the frontend fix alone would have been a no-op.
 */
const { listProductsQuerySchema } = require('../../../src/validators/catalog/catalog.validator');
const { ProductService } = require('../../../src/services/catalog/ProductService');

describe('production-readiness — catalog marketplaceTab scoping', () => {
  describe('Joi schema no longer strips marketplaceTab', () => {
    it('accepts and preserves a valid marketplaceTab', () => {
      const { error, value } = listProductsQuerySchema.validate(
        { marketplaceTab: 'quick_shop', limit: 24 },
        { stripUnknown: true, convert: true }
      );
      expect(error).toBeUndefined();
      expect(value.marketplaceTab).toBe('quick_shop');
    });

    it('accepts every canonical tab value', () => {
      for (const tab of ['mithilakart', 'mithilak', 'quick_shop', 'groceries_fresh']) {
        const { error, value } = listProductsQuerySchema.validate({ marketplaceTab: tab });
        expect(error).toBeUndefined();
        expect(value.marketplaceTab).toBe(tab);
      }
    });

    it('rejects a bogus tab value rather than silently dropping it', () => {
      const { error } = listProductsQuerySchema.validate({ marketplaceTab: 'not_a_real_tab' });
      expect(error).toBeTruthy();
    });

    it('still accepts the legacy commerceFlow param unchanged', () => {
      const { error, value } = listProductsQuerySchema.validate({ commerceFlow: 'quick_shop' });
      expect(error).toBeUndefined();
      expect(value.commerceFlow).toBe('quick_shop');
    });
  });

  describe('ProductService routes to the tab-scoped path when a tab is present', () => {
    function buildService() {
      const marketplaceListingService = { listPublicForTab: jest.fn(async () => ({ items: [], meta: {} })) };
      const productRepository = {
        findPublic: jest.fn(async () => []),
        countPublic: jest.fn(async () => 0),
      };
      const service = new ProductService(
        productRepository, null, null, null, marketplaceListingService
      );
      return { service, marketplaceListingService, productRepository };
    }

    it('with marketplaceTab present, uses the tab-scoped listing path — not the unscoped legacy query', async () => {
      const { service, marketplaceListingService, productRepository } = buildService();

      await service.listPublic({ marketplaceTab: 'quick_shop', limit: 24 });

      expect(marketplaceListingService.listPublicForTab).toHaveBeenCalledTimes(1);
      expect(productRepository.findPublic).not.toHaveBeenCalled();
    });

    it('with commerceFlow present, also uses the tab-scoped path (legacy alias)', async () => {
      const { service, marketplaceListingService, productRepository } = buildService();

      await service.listPublic({ commerceFlow: 'quick_shop' });

      expect(marketplaceListingService.listPublicForTab).toHaveBeenCalledTimes(1);
      expect(productRepository.findPublic).not.toHaveBeenCalled();
    });

    it('listByCategory forwards marketplaceTab through to listPublic — the actual customer-facing bug', async () => {
      const { service, marketplaceListingService } = buildService();
      // listByCategory calls _ensureCategoryExists via categoryRepository, which
      // is null here — only reachable when categoryRepository is wired, so this
      // exercises the pass-through contract directly via listPublic with categoryId.
      service._ensureCategoryExists = jest.fn(async () => true);

      await service.listByCategory('cat-1', { marketplaceTab: 'groceries_fresh', limit: 40 });

      expect(marketplaceListingService.listPublicForTab).toHaveBeenCalledWith(
        expect.objectContaining({ marketplaceTab: 'groceries_fresh', categoryId: 'cat-1' })
      );
    });

    it('WITHOUT any tab param, still falls through to the legacy path (documents current behaviour, not a fix)', async () => {
      const { service, marketplaceListingService, productRepository } = buildService();

      await service.listPublic({ limit: 24 });

      // This is the residual risk: any FUTURE caller that forgets to pass a
      // tab still gets every product across every tab. The three known
      // frontend call sites are now fixed to always pass one — see
      // docs/production-readiness/MASTER_PRODUCTION_GAP_MATRIX.md.
      expect(marketplaceListingService.listPublicForTab).not.toHaveBeenCalled();
      expect(productRepository.findPublic).toHaveBeenCalledTimes(1);
    });
  });
});
