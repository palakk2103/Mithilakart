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
    const [products, alerts, historyRecords] = await Promise.all([
      this.productRepository.findBySeller(sellerId, {}, { sort: { stock: 1 } }),
      this.stockAlertRepository.listBySeller(sellerId),
      this.inventoryHistoryRepository.find(
        { sellerId },
        { sort: { createdAt: -1 }, limit: 25 }
      ),
    ]);

    const productMap = new Map(products.map((product) => [String(product._id), product]));

    return {
      products,
      alerts: alerts.map((alert) => {
        const product = productMap.get(String(alert.productId));
        return {
          id: alert._id,
          productId: alert.productId,
          title: product?.title || 'Product',
          stock: alert.currentStock,
          threshold: alert.threshold,
          status: alert.currentStock === 0 ? 'out' : 'low',
        };
      }),
      history: historyRecords.map((entry) => {
        const product = productMap.get(String(entry.productId));
        return {
          id: entry._id,
          productId: entry.productId,
          title: product?.title || 'Product',
          change: entry.change,
          type: entry.change >= 0 ? 'restock' : 'sale',
          date: entry.createdAt,
        };
      }),
    };
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
