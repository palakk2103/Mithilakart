const { PAGINATION } = require('../constants');

function parsePagination(query = {}, overrides = {}) {
  const page = Math.max(
    PAGINATION.MIN_PAGE,
    parseInt(query.page, 10) || overrides.page || PAGINATION.DEFAULT_PAGE
  );

  const rawLimit = parseInt(query.limit, 10) || overrides.limit || PAGINATION.DEFAULT_LIMIT;
  const limit = Math.min(
    PAGINATION.MAX_LIMIT,
    Math.max(PAGINATION.MIN_LIMIT, rawLimit)
  );

  const skip = (page - 1) * limit;

  return {
    page,
    limit,
    skip,
  };
}

function buildPaginationMeta(page, limit, total) {
  const totalPages = limit > 0 ? Math.ceil(total / limit) : 0;

  return {
    page,
    limit,
    total,
    totalPages,
  };
}

function parseCursorPagination(query = {}, overrides = {}) {
  const limit = Math.min(
    PAGINATION.MAX_LIMIT,
    Math.max(
      PAGINATION.MIN_LIMIT,
      parseInt(query.limit, 10) || overrides.limit || PAGINATION.DEFAULT_LIMIT
    )
  );

  return {
    cursor: query.cursor || null,
    limit,
  };
}

module.exports = {
  parsePagination,
  buildPaginationMeta,
  parseCursorPagination,
};
