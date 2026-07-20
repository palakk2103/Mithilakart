const { BaseService } = require('../../core/BaseService');
const { AppError } = require('../../utils/AppError');
const { parsePagination, buildPaginationMeta } = require('../../utils/pagination');

class AdminUserService extends BaseService {
  constructor({ userRepository, walletRepository, orderRepository }) {
    super();
    this.userRepository = userRepository;
    this.walletRepository = walletRepository;
    this.orderRepository = orderRepository;
  }

  async list(query = {}) {
    const pagination = parsePagination(query);
    const filter = { deletedAt: null };
    if (query.status) filter.status = query.status;

    const [items, total] = await Promise.all([
      this.userRepository.find(filter, { sort: '-createdAt', skip: pagination.skip, limit: pagination.limit }),
      this.userRepository.count(filter),
    ]);

    return { items, meta: buildPaginationMeta(pagination.page, pagination.limit, total) };
  }

  async getById(id) {
    const user = await this.userRepository.findById(id);
    if (!user || user.deletedAt) throw AppError.notFound('User not found');
    return user;
  }

  async updateStatus(id, status) {
    const user = await this.getById(id);
    return this.userRepository.updateById(user._id, { status });
  }

  async block(id) {
    return this.updateStatus(id, 'blocked');
  }

  async unblock(id) {
    return this.updateStatus(id, 'active');
  }

  async suspend(id) {
    return this.updateStatus(id, 'suspended');
  }

  async getWallet(id) {
    await this.getById(id);
    const wallet = await this.walletRepository.findByUserId(id);
    return wallet || { balance: 0, currency: 'INR' };
  }

  async getOrders(id, query = {}) {
    const pagination = parsePagination(query);
    const [items, total] = await Promise.all([
      this.orderRepository.findByUser(id, { sort: '-createdAt', skip: pagination.skip, limit: pagination.limit }),
      this.orderRepository.count({ userId: id }),
    ]);
    return { items, meta: buildPaginationMeta(pagination.page, pagination.limit, total) };
  }

  exportCsv(query = {}) {
    return this.list({ ...query, limit: 1000 }).then(({ items }) => {
      const header = 'id,name,email,phone,status,createdAt\n';
      const rows = items.map((u) =>
        [u._id, u.name, u.email, u.phone, u.status, u.createdAt].join(',')
      ).join('\n');
      return header + rows;
    });
  }
}

module.exports = { AdminUserService };
