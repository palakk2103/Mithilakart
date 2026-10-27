const express = require('express');
const { validateQuery } = require('../../middleware/validate');
const Joi = require('joi');

function createSearchRoutes(searchController) {
  const router = express.Router();

  router.get('/search', validateQuery(Joi.object({
    q: Joi.string().allow('').optional(),
    search: Joi.string().allow('').optional(),
    page: Joi.number().optional(),
    limit: Joi.number().optional(),
    tab: Joi.string().allow('').optional(),
    marketplaceTab: Joi.string().allow('').optional(),
    commerceFlow: Joi.string().allow('').optional(),
    flow: Joi.string().allow('').optional(),
  })), searchController.search);

  return router;
}

module.exports = { createSearchRoutes };
