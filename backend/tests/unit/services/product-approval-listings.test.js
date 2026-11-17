const { MarketplaceListingService } = require('../../../src/services/marketplace/MarketplaceListingService');
const { ProductService } = require('../../../src/services/catalog/ProductService');

// Regression: approving a product only changed Product.status, so the pending / invisible
// marketplace listing it was created with never reached the storefront ("added Raw Pumpkin to
// Kadima but it is not seen").
describe('product moderation keeps marketplace listings in step', () => {
  const makeListingService = () => {
    const updateMany = jest.fn().mockResolvedValue({ modifiedCount: 2 });
    const service = new MarketplaceListingService({
      marketplaceListingRepository: { model: { updateMany } },
    });
    return { service, updateMany };
  };

  it('approving a product approves + shows its pending/draft listings only', async () => {
    const { service, updateMany } = makeListingService();
    const res = await service.syncListingsWithProductStatus(['p1', 'p2'], 'approved');

    const [filter, update] = updateMany.mock.calls[0];
    expect(filter.productId).toEqual({ $in: ['p1', 'p2'] });
    expect(filter.deletedAt).toBeNull();
    // listings an admin explicitly rejected or suspended are NOT resurrected
    expect(filter.listingStatus).toEqual({ $in: ['pending', 'draft'] });
    expect(update.$set).toMatchObject({ listingStatus: 'approved', isVisible: true, rejectedAt: null });
    expect(res.modified).toBe(2);
  });

  it('rejecting a product hides every live listing', async () => {
    const { service, updateMany } = makeListingService();
    await service.syncListingsWithProductStatus('p1', 'rejected', 'blurry photo');
    const [filter, update] = updateMany.mock.calls[0];
    expect(filter.productId).toEqual({ $in: ['p1'] });
    expect(update.$set).toMatchObject({ listingStatus: 'rejected', isVisible: false, moderationNote: 'blurry photo' });
  });

  it('does nothing for other statuses or empty input', async () => {
    const { service, updateMany } = makeListingService();
    await service.syncListingsWithProductStatus([], 'approved');
    await service.syncListingsWithProductStatus(['p1'], 'pending');
    expect(updateMany).not.toHaveBeenCalled();
  });

  it('ProductService.approve / bulk approve / reject all propagate to listings', async () => {
    const sync = jest.fn().mockResolvedValue({ modified: 1 });
    const repo = {
      findAdminById: jest.fn(),
      updateStatus: jest.fn().mockResolvedValue({}),
      updateById: jest.fn().mockResolvedValue({}),
      bulkUpdateStatus: jest.fn().mockResolvedValue({}),
    };
    const service = new ProductService(repo, {}, {}, { del: jest.fn().mockResolvedValue(true) }, { syncListingsWithProductStatus: sync });
    service.getAdminById = jest.fn().mockResolvedValue({ status: 'pending' });
    service._invalidateProductCache = jest.fn().mockResolvedValue();

    await service.approve('p1', 'admin');
    expect(sync).toHaveBeenLastCalledWith(['p1'], 'approved', null);

    await service.reject('p1', 'nope', 'admin');
    expect(sync).toHaveBeenLastCalledWith(['p1'], 'rejected', 'nope');

    await service.bulkAction(['p1', 'p2'], 'approve');
    expect(sync).toHaveBeenLastCalledWith(['p1', 'p2'], 'approved', null);
  });

  it('a failing listing sync never undoes the moderation decision', async () => {
    const repo = { updateStatus: jest.fn().mockResolvedValue({}), updateById: jest.fn().mockResolvedValue({}) };
    const service = new ProductService(repo, {}, {}, {}, { syncListingsWithProductStatus: jest.fn().mockRejectedValue(new Error('db down')) });
    service.getAdminById = jest.fn().mockResolvedValue({ status: 'pending' });
    service._invalidateProductCache = jest.fn().mockResolvedValue();
    await expect(service.approve('p1', 'admin')).resolves.toBeDefined();
  });
});
