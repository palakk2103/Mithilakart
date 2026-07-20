const { BaseRepository } = require('../core/BaseRepository');
const Product = require('../models/Product');
const { PRODUCT_STATUS } = require('../constants/catalog');
const { AppError } = require('../utils/AppError');

class ProductRepository extends BaseRepository {
  constructor() {
    super(Product);
  }

  _publicFilter(filter = {}) {
    return {
      ...filter,
      deletedAt: null,
      status: PRODUCT_STATUS.APPROVED,
    };
  }

  _activeFilter(filter = {}) {
    return { ...filter, deletedAt: null };
  }

  async findPublic(filter = {}, options = {}) {
    return this.find(this._publicFilter(filter), options);
  }

  async findPublicById(id) {
    return this.findOne(this._publicFilter({ _id: id }));
  }

  async findAdmin(filter = {}, options = {}) {
    return this.find(this._activeFilter(filter), options);
  }

  async countPublic(filter = {}) {
    return this.count(this._publicFilter(filter));
  }

  async countAdmin(filter = {}) {
    return this.count(this._activeFilter(filter));
  }

  async searchPublic(searchTerm, filter = {}, options = {}) {
    const query = this.model.find({
      ...this._publicFilter(filter),
      $text: { $search: searchTerm },
    });

    if (options.sort) query.sort(options.sort);
    if (options.skip !== undefined) query.skip(options.skip);
    if (options.limit !== undefined) query.limit(options.limit);

    return query.exec();
  }

  async updateStatus(id, status, moderationNote = null, session = null) {
    return this.updateById(id, { status, moderationNote }, session);
  }

  async bulkUpdateStatus(ids, status, session = null) {
    const query = this.model.updateMany(
      { _id: { $in: ids }, deletedAt: null },
      { status, ...(status === PRODUCT_STATUS.REJECTED ? { moderationNote: 'Bulk rejection' } : { moderationNote: null }) }
    );

    if (session) query.session(session);
    return query.exec();
  }

  async softDeleteMany(ids, session = null) {
    const query = this.model.updateMany(
      { _id: { $in: ids }, deletedAt: null },
      { deletedAt: new Date() }
    );

    if (session) query.session(session);
    return query.exec();
  }

  async getStockAvailable(productId) {
    const product = await this.model.findOne({ _id: productId, deletedAt: null }, { stock: 1 }).lean();
    return product ? product.stock : null;
  }

  async decrementStock(productId, quantity, session = null) {
    const query = this.model.updateOne(
      { _id: productId, deletedAt: null, stock: { $gte: quantity } },
      { $inc: { stock: -quantity } }
    );

    if (session) {
      query.session(session);
    }

    const result = await query.exec();
    if (!result || result.matchedCount === 0) {
      throw AppError.conflict('Insufficient stock', [{ field: 'quantity', message: 'Not enough stock' }]);
    }
    return result;
  }

  async incrementStock(productId, quantity, session = null) {
    const query = this.model.updateOne(
      { _id: productId, deletedAt: null },
      { $inc: { stock: quantity } }
    );

    if (session) {
      query.session(session);
    }

    return query.exec();
  }

  async findBySeller(sellerId, filter = {}, options = {}) {
    return this.find(this._activeFilter({ ...filter, sellerId }), options);
  }

  async countBySeller(sellerId, filter = {}) {
    return this.count(this._activeFilter({ ...filter, sellerId }));
  }

  async updateStock(productId, sellerId, stock, session = null) {
    const query = this.model.findOneAndUpdate(
      { _id: productId, sellerId, deletedAt: null },
      { stock },
      { new: true, runValidators: true }
    );
    if (session) query.session(session);
    return query.exec();
  }
}

module.exports = {
  ProductRepository,
};
