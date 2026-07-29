const { BaseService } = require('../../core/BaseService');
const { AppError } = require('../../utils/AppError');
const { parsePagination, buildPaginationMeta } = require('../../utils/pagination');
const { SUPPORT_TICKET_STATUS } = require('../../constants/admin');

class AdminSupportService extends BaseService {
  constructor({ supportTicketRepository }) {
    super();
    this.supportTicketRepository = supportTicketRepository;
  }

  async list(query = {}) {
    const pagination = parsePagination(query);
    const filter = { deletedAt: null };
    if (query.status) filter.status = query.status;

    const [items, total] = await Promise.all([
      this.supportTicketRepository.find(filter, { sort: '-createdAt', skip: pagination.skip, limit: pagination.limit }),
      this.supportTicketRepository.count(filter),
    ]);

    return { items, meta: buildPaginationMeta(pagination.page, pagination.limit, total) };
  }

  async getById(id) {
    const ticket = await this.supportTicketRepository.findById(id);
    if (!ticket || ticket.deletedAt) throw AppError.notFound('Ticket not found');
    return ticket;
  }

  async reply(id, adminId, message) {
    const ticket = await this.getById(id);
    const replies = [...(ticket.replies || []), {
      authorType: 'admin',
      authorId: adminId,
      message,
      createdAt: new Date(),
    }];

    return this.supportTicketRepository.updateById(id, {
      replies,
      status: SUPPORT_TICKET_STATUS.IN_PROGRESS,
    });
  }

  async close(id) {
    await this.getById(id);
    return this.supportTicketRepository.updateById(id, {
      status: SUPPORT_TICKET_STATUS.CLOSED,
      closedAt: new Date(),
    });
  }

  async createByUser(userId, payload) {
    return this.supportTicketRepository.create({
      userId,
      subject: payload.subject,
      message: payload.message,
      priority: payload.priority || 'medium',
    });
  }

  async listByUser(userId, query = {}) {
    const pagination = parsePagination(query);
    const [items, total] = await Promise.all([
      this.supportTicketRepository.findByUser(userId, { sort: '-createdAt', skip: pagination.skip, limit: pagination.limit }),
      this.supportTicketRepository.count({ userId, deletedAt: null }),
    ]);
    return { items, meta: buildPaginationMeta(pagination.page, pagination.limit, total) };
  }
}

module.exports = { AdminSupportService };
