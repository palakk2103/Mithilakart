const { BaseService } = require('../../core/BaseService');
const { AppError } = require('../../utils/AppError');
const { parsePagination, buildPaginationMeta } = require('../../utils/pagination');

class AdminVendorService extends BaseService {
  constructor({ sellerRepository, productRepository, orderItemRepository, sellerEarningRepository }) {
    super();
    this.sellerRepository = sellerRepository;
    this.productRepository = productRepository;
    this.orderItemRepository = orderItemRepository;
    this.sellerEarningRepository = sellerEarningRepository;
  }

  async list(query = {}) {
    const pagination = parsePagination(query);
    const filter = { deletedAt: null };
    if (query.status) filter.status = query.status;
    if (query.kycStatus) filter.kycStatus = query.kycStatus;

    const [items, total] = await Promise.all([
      this.sellerRepository.find(filter, { sort: '-createdAt', skip: pagination.skip, limit: pagination.limit }),
      this.sellerRepository.count(filter),
    ]);

    return { items, meta: buildPaginationMeta(pagination.page, pagination.limit, total) };
  }

  async getById(id) {
    const seller = await this.sellerRepository.findById(id);
    if (!seller || seller.deletedAt) throw AppError.notFound('Seller not found');
    return seller;
  }

  async approve(id) {
    await this.getById(id);
    return this.sellerRepository.updateById(id, { kycStatus: 'approved', status: 'active' });
  }

  async reject(id) {
    await this.getById(id);
    return this.sellerRepository.updateById(id, { kycStatus: 'rejected', status: 'inactive' });
  }

  async suspend(id) {
    await this.getById(id);
    return this.sellerRepository.updateById(id, { status: 'suspended' });
  }

  async activate(id) {
    await this.getById(id);
    return this.sellerRepository.updateById(id, { status: 'active' });
  }

  async getProducts(id, query = {}) {
    await this.getById(id);
    const pagination = parsePagination(query);
    const [items, total] = await Promise.all([
      this.productRepository.findBySeller(id, {}, { skip: pagination.skip, limit: pagination.limit }),
      this.productRepository.countBySeller(id),
    ]);
    return { items, meta: buildPaginationMeta(pagination.page, pagination.limit, total) };
  }

  async getEarnings(id) {
    await this.getById(id);
    return this.sellerEarningRepository.sumNetBySeller(id);
  }
}

module.exports = { AdminVendorService };
