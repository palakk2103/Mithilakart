const { BaseService } = require('../../core/BaseService');
const { AppError } = require('../../utils/AppError');
const { parsePagination, buildPaginationMeta } = require('../../utils/pagination');
const { DELIVERY_STATUS } = require('../../constants/auth');

class AdminDeliveryService extends BaseService {
  constructor({ deliveryPartnerRepository }) {
    super();
    this.deliveryPartnerRepository = deliveryPartnerRepository;
  }

  async list(query = {}) {
    const pagination = parsePagination(query);
    const filter = query.status ? { status: query.status } : {};

    const [items, total] = await Promise.all([
      this.deliveryPartnerRepository.list(filter, {
        sort: '-createdAt',
        skip: pagination.skip,
        limit: pagination.limit,
      }),
      this.deliveryPartnerRepository.count(filter),
    ]);

    return { items, meta: buildPaginationMeta(pagination.page, pagination.limit, total) };
  }

  async getById(id) {
    const partner = await this.deliveryPartnerRepository.findById(id);
    if (!partner) throw AppError.notFound('Delivery partner not found');
    return partner;
  }

  async approve(id) {
    return this._updateStatus(id, DELIVERY_STATUS.APPROVED);
  }

  async reject(id) {
    return this._updateStatus(id, DELIVERY_STATUS.REJECTED);
  }

  async suspend(id) {
    return this._updateStatus(id, DELIVERY_STATUS.SUSPENDED);
  }

  async create(data) {
    const existing = await this.deliveryPartnerRepository.findByPhone(data.phone, data.countryCode || '+91');
    if (existing) throw AppError.conflict('Partner with this phone already exists');

    return this.deliveryPartnerRepository.create({
      ...data,
      status: DELIVERY_STATUS.APPROVED,
    });
  }

  async _updateStatus(id, status) {
    const partner = await this.deliveryPartnerRepository.findById(id);
    if (!partner) throw AppError.notFound('Delivery partner not found');
    return this.deliveryPartnerRepository.updateStatus(id, status);
  }
}

module.exports = { AdminDeliveryService };
