const { BaseService } = require('../../core/BaseService');
const { ORDER_STATUS } = require('../../constants/commerce');

class SellerDashboardService extends BaseService {
  constructor({ productRepository, orderItemRepository, orderRepository, returnRepository, sellerEarningRepository, cacheService }) {
    super();
    this.productRepository = productRepository;
    this.orderItemRepository = orderItemRepository;
    this.orderRepository = orderRepository;
    this.returnRepository = returnRepository;
    this.sellerEarningRepository = sellerEarningRepository;
    this.cacheService = cacheService;
  }

  async getDashboard(sellerId) {
    const cacheKey = `seller:dashboard:${sellerId}`;
    const cached = await this.cacheService.get(cacheKey);
    if (cached) return cached;

    const [productCount, orderItems, pendingReturns, earnings] = await Promise.all([
      this.productRepository.countBySeller(sellerId),
      this.orderItemRepository.find({ sellerId }),
      this.returnRepository.countBySeller(sellerId, { status: 'requested' }),
      this.sellerEarningRepository.sumNetBySeller(sellerId),
    ]);

    const totalOrders = new Set(orderItems.map((it) => String(it.orderId))).size;
    const totalRevenue = orderItems.reduce((sum, it) => sum + (it.lineTotal || 0), 0);

    const payload = {
      productCount,
      totalOrders,
      totalRevenue,
      pendingReturns,
      totalEarnings: earnings,
    };

    await this.cacheService.set(cacheKey, payload, 300);
    return payload;
  }

  async getStats(sellerId) {
    const dashboard = await this.getDashboard(sellerId);
    const recentItems = await this.orderItemRepository.find(
      { sellerId },
      { sort: { createdAt: -1 }, limit: 10 }
    );

    const pendingOrders = await this.orderRepository.count({
      'sellerSubOrders.sellerId': sellerId,
      'sellerSubOrders.status': {
        $nin: [ORDER_STATUS.DELIVERED, ORDER_STATUS.CANCELLED],
      },
    });

    return {
      ...dashboard,
      recentOrderItems: recentItems.length,
      activeProducts: await this.productRepository.countBySeller(sellerId, { status: 'approved' }),
      pendingOrders,
    };
  }
}

module.exports = { SellerDashboardService };
