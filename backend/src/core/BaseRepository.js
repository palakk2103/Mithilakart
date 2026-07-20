const { AppError } = require('../utils/AppError');

class BaseRepository {
  constructor(model) {
    if (!model) {
      throw new Error('Model is required for BaseRepository');
    }

    this.model = model;
  }

  _applySession(query, session) {
    return session ? query.session(session) : query;
  }

  async findById(id, options = {}) {
    const query = this.model.findById(id);
    return this._applySession(query, options.session).exec();
  }

  async findOne(filter, options = {}) {
    const query = this.model.findOne(filter);
    return this._applySession(query, options.session).exec();
  }

  async find(filter = {}, options = {}) {
    const query = this.model.find(filter);

    if (options.sort) {
      query.sort(options.sort);
    }

    if (options.skip !== undefined) {
      query.skip(options.skip);
    }

    if (options.limit !== undefined) {
      query.limit(options.limit);
    }

    if (options.select) {
      query.select(options.select);
    }

    return this._applySession(query, options.session).exec();
  }

  async create(data, session = null) {
    if (session) {
      const [document] = await this.model.create([data], { session });
      return document;
    }

    return this.model.create(data);
  }

  async updateById(id, data, session = null) {
    const query = this.model.findByIdAndUpdate(id, data, {
      new: true,
      runValidators: true,
    });

    const document = await this._applySession(query, session).exec();

    if (!document) {
      throw AppError.notFound('Resource not found');
    }

    return document;
  }

  async softDelete(id, session = null) {
    return this.updateById(id, { deletedAt: new Date() }, session);
  }

  async deleteById(id, session = null) {
    const query = this.model.findByIdAndDelete(id);
    const document = await this._applySession(query, session).exec();

    if (!document) {
      throw AppError.notFound('Resource not found');
    }

    return document;
  }

  async count(filter = {}, session = null) {
    const query = this.model.countDocuments(filter);
    return this._applySession(query, session).exec();
  }

  async exists(filter = {}, session = null) {
    const query = this.model.exists(filter);
    const result = await this._applySession(query, session).exec();
    return Boolean(result);
  }
}

module.exports = {
  BaseRepository,
};
