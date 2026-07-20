const { InventoryService } = require('../../../src/services/inventory/InventoryService');
const { INVENTORY_CHANGE_REASON } = require('../../../src/constants/pricing');

describe('InventoryService', () => {
  it('appends inventory history on manual stock update', async () => {
    const sellerId = 'seller1';
    const productId = 'prod1';
    const product = {
      _id: productId,
      sellerId,
      stock: 20,
    };

    const productRepository = {
      findOne: jest.fn().mockResolvedValue(product),
      updateStock: jest.fn().mockResolvedValue({ ...product, stock: 15 }),
    };

    const inventoryHistoryRepository = {
      create: jest.fn().mockResolvedValue(true),
    };

    const stockAlertRepository = {
      create: jest.fn(),
      model: {
        updateMany: jest.fn().mockResolvedValue({ modifiedCount: 1 }),
      },
    };

    const service = new InventoryService({
      productRepository,
      inventoryHistoryRepository,
      stockAlertRepository,
    });

    await service.updateStock(sellerId, productId, 15, 'Manual adjustment');

    expect(inventoryHistoryRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        productId,
        sellerId,
        previousStock: 20,
        newStock: 15,
        change: -5,
        reason: INVENTORY_CHANGE_REASON.MANUAL,
        note: 'Manual adjustment',
      })
    );
  });
});
