const { BaseRepository } = require('../core/BaseRepository');
const PlatformSetting = require('../models/PlatformSetting');

class PlatformSettingRepository extends BaseRepository {
  constructor() { super(PlatformSetting); }

  async findByKey(key) {
    return this.findOne({ key, deletedAt: null });
  }
}

module.exports = { PlatformSettingRepository };
