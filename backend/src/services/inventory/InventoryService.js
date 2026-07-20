const { BaseService } = require('../../core/BaseService');
const { AppError } = require('../../utils/AppError');
const { INVENTORY_CHANGE_REASON } = require('../../constants/pricing');

const LOW_STOCK_THRESHOLD = 10;

class InventoryService extends BaseService {
  constructor({
    productRepository,
    inventoryHistoryRepository,
    stockAlertRepository,
  }) {
    super();
    this.productRepository = productRepository;
    this.inventoryHistoryRepository = inventoryHistoryRepository;
    this.stockAlertRepository = stockAlertRepository;
  }

  async listInventory(sellerId) {
    return this.productRepository.findBySeller(sellerId, {}, { sort: { stock: 1 } });
  }

  async updateStock(sellerId, productId, quantity, note = null) {
    const product = await this.productRepository.findOne({ _id: productId, sellerId, deletedAt: null });
    if (!product) throw AppError.notFound('Product not found');

    const previousStock = product.stock;
    const updated = await this.productRepository.updateStock(productId, sellerId, quantity);

    await this.inventoryHistoryRepository.create({
      productId,
      sellerId,
      previousStock,
      newStock: quantity,
      change: quantity - previousStock,
      reason: INVENTORY_CHANGE_REASON.MANUAL,
      note,
    });

    if (quantity <= LOW_STOCK_THRESHOLD) {
      await this.stockAlertRepository.create({
        productId,
        sellerId,
        threshold: LOW_STOCK_THRESHOLD,
        currentStock: quantity,
        isResolved: false,
      });
    } else {
      await this.stockAlertRepository.model.updateMany(
        { productId, sellerId, isResolved: false },
        { isResolved: true }
      );
    }

    return updated;
  }

  async getHistory(sellerId, productId) {
    const product = await this.productRepository.findOne({ _id: productId, sellerId, deletedAt: null });
    if (!product) throw AppError.notFound('Product not found');
    return this.inventoryHistoryRepository.listByProduct(productId, sellerId);
  }
}

module.exports = { InventoryService };
