const { BaseRepository } = require('../core/BaseRepository');
const LegalPage = require('../models/LegalPage');

class LegalPageRepository extends BaseRepository {
  constructor() {
    super(LegalPage);
  }

  async findByType(type) {
    return this.findOne({ type });
  }
}

module.exports = {
  LegalPageRepository,
};
