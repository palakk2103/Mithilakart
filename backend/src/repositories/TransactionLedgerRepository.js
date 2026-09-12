const mongoose = require('mongoose');
const { BaseRepository } = require('../core/BaseRepository');
const TransactionLedger = require('../models/TransactionLedger');

class TransactionLedgerRepository extends BaseRepository {
  constructor() {
    super(TransactionLedger);
  }

  _toObjectId(id) {
    if (!id) return null;
    return id instanceof mongoose.Types.ObjectId ? id : new mongoose.Types.ObjectId(String(id));
  }

  async findByParty(party, partyId, options = {}) {
    return this.find(
      {
        party,
        partyId: this._toObjectId(partyId),
        deletedAt: null,
      },
      options
    );
  }

  async sumByPartyAndType(party, partyId, type, filter = {}) {
    const match = {
      party,
      partyId: this._toObjectId(partyId),
      type,
      deletedAt: null,
      ...filter,
    };
    const result = await this.model.aggregate([
      { $match: match },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);
    return result[0]?.total || 0;
  }

  async recordCodDue({ party = 'delivery_partner', partyId, amount, metadata = {} }, session = null) {
    const data = {
      orderId: metadata.orderId ? this._toObjectId(metadata.orderId) : null,
      party,
      partyId: this._toObjectId(partyId),
      amount,
      type: 'cod_due',
      status: 'pending',
      metadata,
    };
    return this.create(data, session);
  }
}

module.exports = { TransactionLedgerRepository };
