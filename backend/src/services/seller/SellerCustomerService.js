const { BaseService } = require('../../core/BaseService');
const { AppError } = require('../../utils/AppError');
const { parsePagination, buildPaginationMeta } = require('../../utils/pagination');
const mongoose = require('mongoose');
const OrderItem = require('../../models/OrderItem');

class SellerCustomerService extends BaseService {
  constructor({ userRepository }) {
    super();
    this.userRepository = userRepository;
  }

  async list(sellerId, query = {}) {
    const pagination = parsePagination(query);
    const sellerObjectId = new mongoose.Types.ObjectId(String(sellerId));

    const aggregated = await OrderItem.aggregate([
      { $match: { sellerId: sellerObjectId } },
      {
        $group: {
          _id: '$userId',
          orderCount: { $sum: 1 },
          totalSpent: { $sum: '$lineTotal' },
          lastOrderAt: { $max: '$createdAt' },
        },
      },
      { $sort: { lastOrderAt: -1 } },
      { $skip: pagination.skip },
      { $limit: pagination.limit },
    ]);

    const userIds = aggregated.map((a) => a._id);
    const users = await this.userRepository.find({ _id: { $in: userIds } });
    const userMap = new Map(users.map((u) => [String(u._id), u]));

    const items = aggregated.map((a) => {
      const user = userMap.get(String(a._id));
      return {
        id: a._id,
        name: user?.name || null,
        email: user?.email || null,
        phone: user?.phone || null,
        orderCount: a.orderCount,
        totalSpent: a.totalSpent,
        lastOrderAt: a.lastOrderAt,
      };
    });

    const countResult = await OrderItem.aggregate([
      { $match: { sellerId: sellerObjectId } },
      { $group: { _id: '$userId' } },
      { $count: 'total' },
    ]);

    const total = countResult[0]?.total || 0;
    return { items, meta: buildPaginationMeta(pagination.page, pagination.limit, total) };
  }

  async getById(sellerId, customerId) {
    const sellerObjectId = new mongoose.Types.ObjectId(String(sellerId));
    const customerObjectId = new mongoose.Types.ObjectId(String(customerId));

    const hasOrders = await OrderItem.findOne({ sellerId: sellerObjectId, userId: customerObjectId });
    if (!hasOrders) throw AppError.notFound('Customer not found');

    const user = await this.userRepository.findById(customerId);
    if (!user) throw AppError.notFound('Customer not found');

    const stats = await OrderItem.aggregate([
      { $match: { sellerId: sellerObjectId, userId: customerObjectId } },
      {
        $group: {
          _id: '$userId',
          orderCount: { $sum: 1 },
          totalSpent: { $sum: '$lineTotal' },
        },
      },
    ]);

    return {
      id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      orderCount: stats[0]?.orderCount || 0,
      totalSpent: stats[0]?.totalSpent || 0,
    };
  }
}

module.exports = { SellerCustomerService };
