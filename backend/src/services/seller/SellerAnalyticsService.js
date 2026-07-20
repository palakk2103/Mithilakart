const { BaseService } = require('../../core/BaseService');
const mongoose = require('mongoose');
const OrderItem = require('../../models/OrderItem');

class SellerAnalyticsService extends BaseService {
  constructor({ orderItemRepository, productRepository }) {
    super();
    this.orderItemRepository = orderItemRepository;
    this.productRepository = productRepository;
  }

  _sellerObjectId(sellerId) {
    return new mongoose.Types.ObjectId(String(sellerId));
  }

  async getSales(sellerId, range = '30d') {
    const items = await this.orderItemRepository.find({ sellerId }, { sort: { createdAt: -1 } });
    const totalSales = items.reduce((sum, it) => sum + (it.lineTotal || 0), 0);
    return { range, totalSales, orderCount: items.length };
  }

  async getRevenue(sellerId) {
    const result = await OrderItem.aggregate([
      { $match: { sellerId: this._sellerObjectId(sellerId) } },
      { $group: { _id: null, revenue: { $sum: '$lineTotal' }, units: { $sum: '$quantity' } } },
    ]);
    return { revenue: result[0]?.revenue || 0, unitsSold: result[0]?.units || 0 };
  }

  async getTopProducts(sellerId) {
    return OrderItem.aggregate([
      { $match: { sellerId: this._sellerObjectId(sellerId) } },
      { $group: { _id: '$productId', totalSold: { $sum: '$quantity' }, revenue: { $sum: '$lineTotal' } } },
      { $sort: { revenue: -1 } },
      { $limit: 10 },
    ]);
  }

  async getTopCategories(sellerId) {
    const products = await this.productRepository.findBySeller(sellerId);
    const categoryMap = new Map();
    products.forEach((p) => {
      const key = String(p.categoryId);
      categoryMap.set(key, (categoryMap.get(key) || 0) + 1);
    });
    return Array.from(categoryMap.entries()).map(([categoryId, count]) => ({ categoryId, count }));
  }

  async getTopCustomers(sellerId) {
    return OrderItem.aggregate([
      { $match: { sellerId: this._sellerObjectId(sellerId) } },
      { $group: { _id: '$userId', orderCount: { $sum: 1 }, totalSpent: { $sum: '$lineTotal' } } },
      { $sort: { totalSpent: -1 } },
      { $limit: 10 },
    ]);
  }
}

module.exports = { SellerAnalyticsService };
