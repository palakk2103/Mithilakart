const { BaseService } = require('../../core/BaseService');
const { parsePagination, buildPaginationMeta } = require('../../utils/pagination');

class AdminAuditService extends BaseService {
  constructor({ auditLogRepository }) {
    super();
    this.auditLogRepository = auditLogRepository;
  }

  async listLogs(query = {}) {
    const pagination = parsePagination(query);
    const filter = {};
    if (query.adminId) filter.adminId = query.adminId;
    if (query.action) filter.action = query.action;

    const [items, total] = await Promise.all([
      this.auditLogRepository.list(filter, { sort: '-createdAt', skip: pagination.skip, limit: pagination.limit }),
      this.auditLogRepository.count(filter),
    ]);

    return { items, meta: buildPaginationMeta(pagination.page, pagination.limit, total) };
  }

  async listLoginHistory(query = {}) {
    return this.listLogs({ ...query, action: 'admin.login' });
  }
}

module.exports = { AdminAuditService };
