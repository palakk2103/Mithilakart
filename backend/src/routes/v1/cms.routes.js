const express = require('express');
const { LEGAL_PAGE_TYPE_VALUES } = require('../../constants/catalog');
const Joi = require('joi');
const { validateParams } = require('../../middleware/validate');

function createCmsRoutes(controller) {
  const router = express.Router();

  router.get('/legal/:type', validateParams(Joi.object({
    type: Joi.string().valid(...LEGAL_PAGE_TYPE_VALUES).required(),
  })), controller.getLegalPage);
  router.get('/:slug', controller.getPage);

  return router;
}

module.exports = {
  createCmsRoutes,
};
