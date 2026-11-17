const express = require('express');
const Joi = require('joi');
const { validateBody, validateParams } = require('../../middleware/validate');
const { objectIdSchema } = require('../../validators/common.validator');
const { requirePermission } = require('../../middleware/authMiddleware');

const itemSchema = Joi.object({
  id: objectIdSchema.optional(),
  name: Joi.string().trim().min(1).max(120).required(),
  description: Joi.string().trim().allow('').max(300).optional(),
  imageUrl: Joi.string().trim().allow('').max(2048).optional(),
  price: Joi.number().min(0).max(10000000).optional(),
  isMandatory: Joi.boolean().optional(),
  sortOrder: Joi.number().integer().min(0).max(10000).optional(),
});

const packageFields = {
  name: Joi.string().trim().min(2).max(160),
  slug: Joi.string().trim().max(80).allow(''),
  description: Joi.string().trim().allow('').max(2000),
  imageUrl: Joi.string().trim().allow('').max(2048),
  productId: objectIdSchema,
  marketplaceTab: Joi.string().trim().max(40),
  fullPrice: Joi.number().min(0).max(10000000),
  minPriceAmount: Joi.number().min(0).max(10000000).allow(null),
  minPricePercent: Joi.number().min(0).max(100).allow(null),
  items: Joi.array().items(itemSchema).max(200),
  isActive: Joi.boolean(),
  sortOrder: Joi.number().integer().min(0).max(10000),
};

const createSchema = Joi.object({
  ...packageFields,
  name: packageFields.name.required(),
  productId: packageFields.productId.required(),
  fullPrice: packageFields.fullPrice.required(),
  items: packageFields.items.min(1).required(),
});
const updateSchema = Joi.object(packageFields).min(1);
const quoteSchema = Joi.object({ selectedItemIds: Joi.array().items(objectIdSchema).max(200).required() });

const idParam = validateParams(Joi.object({ id: Joi.string().trim().max(80).required() }));
const objectIdParam = validateParams(Joi.object({ id: objectIdSchema }));

function createPackageRoutes(controller, middleware) {
  const router = express.Router();
  const authAdmin = middleware.authenticateAdmin();

  // Public: browse a package and price a selection (the server is the only price authority).
  router.get('/packages', controller.list);
  router.get('/packages/:id', idParam, controller.get);
  router.post('/packages/:id/quote', idParam, validateBody(quoteSchema), controller.quote);

  // Admin: everything about a package is editable.
  router.get('/admin/packages', authAdmin, requirePermission('products.view'), controller.listAdmin);
  router.post('/admin/packages', authAdmin, requirePermission('products.edit'), validateBody(createSchema), controller.create);
  router.put('/admin/packages/:id', authAdmin, requirePermission('products.edit'), objectIdParam, validateBody(updateSchema), controller.update);
  router.delete('/admin/packages/:id', authAdmin, requirePermission('products.delete'), objectIdParam, controller.remove);

  return router;
}

module.exports = { createPackageRoutes };
