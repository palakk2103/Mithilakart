const { BaseRepository } = require('../core/BaseRepository');
const Role = require('../models/Role');

class RoleRepository extends BaseRepository {
  constructor() {
    super(Role);
  }

  async findByName(name) {
    return this.findOne({ name, deletedAt: null });
  }
}

module.exports = {
  RoleRepository,
};
