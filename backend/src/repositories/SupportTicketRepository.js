const { BaseRepository } = require('../core/BaseRepository');
const SupportTicket = require('../models/SupportTicket');

class SupportTicketRepository extends BaseRepository {
  constructor() { super(SupportTicket); }

  async findByUser(userId, options = {}) {
    return this.find({ userId, deletedAt: null }, options);
  }
}

module.exports = { SupportTicketRepository };
