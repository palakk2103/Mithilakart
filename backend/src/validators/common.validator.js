const Joi = require('joi');
const { PAGINATION } = require('../constants');

const paginationQuerySchema = Joi.object({
  page: Joi.number().integer().min(PAGINATION.MIN_PAGE).default(PAGINATION.DEFAULT_PAGE),
  limit: Joi.number().integer().min(PAGINATION.MIN_LIMIT).max(PAGINATION.MAX_LIMIT).default(PAGINATION.DEFAULT_LIMIT),
  sort: Joi.string().trim().optional(),
  search: Joi.string().trim().allow('').optional(),
  cursor: Joi.string().trim().optional(),
});

const objectIdSchema = Joi.string().trim().hex().length(24);

const dateRangeQuerySchema = Joi.object({
  from: Joi.date().iso().optional(),
  to: Joi.date().iso().optional(),
}).and('from', 'to');

module.exports = {
  paginationQuerySchema,
  objectIdSchema,
  dateRangeQuerySchema,
};
