const express = require('express');
const { validateQuery } = require('../../middleware/validate');
const Joi = require('joi');

function createSearchRoutes(searchController) {
  const router = express.Router();

  router.get('/search', validateQuery(Joi.object({
    q: Joi.string().optional(),
    search: Joi.string().optional(),
    page: Joi.number().optional(),
    limit: Joi.number().optional(),
  })), searchController.search);

  return router;
}

module.exports = { createSearchRoutes };
