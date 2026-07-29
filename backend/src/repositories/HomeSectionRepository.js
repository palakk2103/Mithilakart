const { BaseRepository } = require('../core/BaseRepository');
const HomeSection = require('../models/HomeSection');

class HomeSectionRepository extends BaseRepository {
  constructor() {
    super(HomeSection);
  }

  async findByFlow(commerceFlow) {
    return this.find({ commerceFlow, isActive: true }, { sort: { sortOrder: 1 } });
  }

  async findByKey(sectionKey, commerceFlow) {
    return this.findOne({ sectionKey, commerceFlow });
  }
}

module.exports = {
  HomeSectionRepository,
};
