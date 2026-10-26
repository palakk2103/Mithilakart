const { BaseService } = require('../../core/BaseService');
const { AppError } = require('../../utils/AppError');
const { parsePagination, buildPaginationMeta } = require('../../utils/pagination');
const { DELIVERY_STATUS } = require('../../constants/auth');

class AdminDeliveryService extends BaseService {
  constructor({ deliveryPartnerRepository, transactionLedgerRepository = null }) {
    super();
    this.deliveryPartnerRepository = deliveryPartnerRepository;
    this.transactionLedgerRepository = transactionLedgerRepository;
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

  async getDues(id) {
    const partner = await this.deliveryPartnerRepository.findById(id);
    if (!partner) throw AppError.notFound('Delivery partner not found');

    let ledger = [];
    if (this.transactionLedgerRepository) {
      ledger = await this.transactionLedgerRepository.findByParty('delivery_partner', id);
    }

    return {
      partnerId: partner._id,
      name: partner.name || partner.fullName,
      phone: partner.phone,
      codDuesBalance: partner.codDuesBalance || 0,
      totalCodCollected: partner.totalCodCollected || 0,
      totalEarnings: partner.totalEarnings || partner.balance || 0,
      ledger,
    };
  }

  async settleDues(id, { amount, notes = null, settledBy = null }) {
    const partner = await this.deliveryPartnerRepository.findById(id);
    if (!partner) throw AppError.notFound('Delivery partner not found');

    const currentDues = partner.codDuesBalance || 0;
    const settleAmount = amount != null ? Number(amount) : currentDues;
    if (settleAmount <= 0) {
      throw AppError.validation('Settlement amount must be greater than zero');
    }

    const remainingDues = Math.max(0, currentDues - settleAmount);
    await this.deliveryPartnerRepository.updateById(id, { codDuesBalance: remainingDues });

    let ledgerEntry = null;
    if (this.transactionLedgerRepository) {
      ledgerEntry = await this.transactionLedgerRepository.recordSettlement({
        party: 'delivery_partner',
        partyId: id,
        amount: settleAmount,
        settledBy,
        metadata: {
          previousDues: currentDues,
          remainingDues,
          notes,
        },
      });
    }

    return {
      settled: true,
      settledAmount: settleAmount,
      remainingDues,
      ledgerEntry,
    };
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
