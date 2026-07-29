const { BaseService } = require('../../core/BaseService');
const Order = require('../../models/Order');
const User = require('../../models/User');
const Seller = require('../../models/Seller');
const Product = require('../../models/Product');
const Return = require('../../models/Return');

class AdminReportService extends BaseService {
  async salesReport(query = {}) {
    const since = this._sinceDate(query.days || 30);
    return Order.aggregate([
      { $match: { createdAt: { $gte: since }, paymentStatus: 'paid' } },
      {
        $group: {
          _id: null,
          totalSales: { $sum: '$total' },
          orderCount: { $sum: 1 },
          avgOrderValue: { $avg: '$total' },
        },
      },
    ]);
  }

  async sellersReport() {
    return Seller.aggregate([
      { $match: { deletedAt: null } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);
  }

  async usersReport() {
    return User.aggregate([
      { $match: { deletedAt: null } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);
  }

  async ordersReport(query = {}) {
    const since = this._sinceDate(query.days || 30);
    return Order.aggregate([
      { $match: { createdAt: { $gte: since } } },
      { $group: { _id: '$status', count: { $sum: 1 }, revenue: { $sum: '$total' } } },
    ]);
  }

  async inventoryReport() {
    return Product.aggregate([
      { $match: { deletedAt: null } },
      {
        $group: {
          _id: null,
          totalProducts: { $sum: 1 },
          totalStock: { $sum: '$stock' },
          lowStock: { $sum: { $cond: [{ $lte: ['$stock', 10] }, 1, 0] } },
        },
      },
    ]);
  }

  async refundsReport() {
    return Return.aggregate([
      { $match: { deletedAt: null } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);
  }

  async exportReport(type, query = {}) {
    const generators = {
      sales: () => this.salesReport(query),
      sellers: () => this.sellersReport(),
      users: () => this.usersReport(),
      orders: () => this.ordersReport(query),
      inventory: () => this.inventoryReport(),
      refunds: () => this.refundsReport(),
    };

    const data = await (generators[type] || generators.orders)();
    const csv = `report,${type}\n${JSON.stringify(data)}\n`;
    return { contentType: 'text/csv', filename: `${type}-report.csv`, body: csv };
  }

  _sinceDate(days) {
    const d = new Date();
    d.setDate(d.getDate() - Number(days));
    return d;
  }
}

module.exports = { AdminReportService };
