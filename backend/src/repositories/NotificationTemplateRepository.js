const { BaseRepository } = require('../core/BaseRepository');
const NotificationTemplate = require('../models/NotificationTemplate');

class NotificationTemplateRepository extends BaseRepository {
  constructor() { super(NotificationTemplate); }

  async findByKeyAndLocale(key, locale = 'en') {
    return this.findOne({ key, locale, isActive: true, deletedAt: null });
  }
}

module.exports = { NotificationTemplateRepository };
