const express = require('express');
const { validateParams, validateQuery } = require('../../middleware/validate');
const { objectIdSchema } = require('../../validators/common.validator');
const Joi = require('joi');
const { listProductsQuerySchema } = require('../../validators/catalog/catalog.validator');

function createCatalogRoutes(categoryController, productController) {
  const router = express.Router();

  router.get('/categories', categoryController.list);
  router.get('/categories/:id/products', validateParams(Joi.object({ id: objectIdSchema })), validateQuery(listProductsQuerySchema), productController.listByCategory);
  router.get('/products', validateQuery(listProductsQuerySchema), productController.list);
  router.get('/products/search', validateQuery(listProductsQuerySchema), productController.search);
  router.get('/products/:id', validateParams(Joi.object({ id: objectIdSchema })), productController.getById);

  return router;
}

module.exports = {
  createCatalogRoutes,
};
