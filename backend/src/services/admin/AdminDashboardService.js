const { BaseService } = require('../../core/BaseService');
const { parsePagination } = require('../../utils/pagination');
const Order = require('../../models/Order');
const User = require('../../models/User');
const Seller = require('../../models/Seller');
const Product = require('../../models/Product');

class AdminDashboardService extends BaseService {
  constructor({ orderRepository, cacheService }) {
    super();
    this.orderRepository = orderRepository;
    this.cacheService = cacheService;
  }

  async getStats() {
    const cacheKey = 'admin:dashboard:stats';
    const cached = await this.cacheService.get(cacheKey);
    if (cached) return cached;

    const [userCount, sellerCount, productCount, orderStats] = await Promise.all([
      User.countDocuments({ deletedAt: null }),
      Seller.countDocuments({ deletedAt: null }),
      Product.countDocuments({ deletedAt: null }),
      Order.aggregate([
        { $match: { deletedAt: null } },
        {
          $group: {
            _id: null,
            totalOrders: { $sum: 1 },
            totalRevenue: { $sum: '$total' },
            pendingOrders: {
              $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] },
            },
          },
        },
      ]),
    ]);

    const stats = {
      users: userCount,
      sellers: sellerCount,
      products: productCount,
      totalOrders: orderStats[0]?.totalOrders || 0,
      totalRevenue: orderStats[0]?.totalRevenue || 0,
      pendingOrders: orderStats[0]?.pendingOrders || 0,
    };

    await this.cacheService.set(cacheKey, stats, 120);
    return stats;
  }

  async getRecentOrders(limit = 10) {
    return this.orderRepository.find({}, { sort: '-createdAt', limit });
  }

  async getRevenueChart(days = 30) {
    const since = new Date();
    since.setDate(since.getDate() - days);

    return Order.aggregate([
      { $match: { createdAt: { $gte: since }, paymentStatus: 'paid' } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          revenue: { $sum: '$total' },
          orders: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);
  }

  async getActivities(limit = 20) {
    const pagination = parsePagination({ page: 1, limit });
    return this.orderRepository.find({}, { sort: '-updatedAt', limit: pagination.limit });
  }
}

module.exports = { AdminDashboardService };
