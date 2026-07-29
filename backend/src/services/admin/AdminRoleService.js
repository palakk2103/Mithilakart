const { BaseService } = require('../../core/BaseService');
const { AppError } = require('../../utils/AppError');
const { parsePagination, buildPaginationMeta } = require('../../utils/pagination');
const { PERMISSION_GROUPS, ALL_PERMISSIONS } = require('../../constants/permissions');

class AdminRoleService extends BaseService {
  constructor({ roleRepository, adminUserRepository }) {
    super();
    this.roleRepository = roleRepository;
    this.adminUserRepository = adminUserRepository;
  }

  listPermissions() {
    return { groups: PERMISSION_GROUPS, all: ALL_PERMISSIONS };
  }

  async list(query = {}) {
    const pagination = parsePagination(query);
    const filter = { deletedAt: null };
    const [items, total] = await Promise.all([
      this.roleRepository.find(filter, { sort: 'name', skip: pagination.skip, limit: pagination.limit }),
      this.roleRepository.count(filter),
    ]);
    return { items, meta: buildPaginationMeta(pagination.page, pagination.limit, total) };
  }

  async getById(id) {
    const role = await this.roleRepository.findById(id);
    if (!role || role.deletedAt) throw AppError.notFound('Role not found');
    return role;
  }

  async create(data) {
    const existing = await this.roleRepository.findByName(data.name);
    if (existing) throw AppError.conflict('Role name already exists');
    const permissions = (data.permissions || []).filter((p) => ALL_PERMISSIONS.includes(p));
    return this.roleRepository.create({ ...data, permissions });
  }

  async update(id, data) {
    await this.getById(id);
    const role = await this.roleRepository.findById(id);
    if (role.isSystem) throw AppError.conflict('System roles cannot be modified');

    const update = { ...data };
    if (update.permissions) {
      update.permissions = update.permissions.filter((p) => ALL_PERMISSIONS.includes(p));
    }
    return this.roleRepository.updateById(id, update);
  }

  async remove(id) {
    const role = await this.getById(id);
    if (role.isSystem) throw AppError.conflict('System roles cannot be deleted');
    return this.roleRepository.updateById(id, { deletedAt: new Date() });
  }
}

module.exports = { AdminRoleService };
