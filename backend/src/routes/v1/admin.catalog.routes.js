const express = require('express');
const { validateBody, validateParams, validateQuery } = require('../../middleware/validate');
const { requirePermission } = require('../../middleware/authMiddleware');
const Joi = require('joi');
const { objectIdSchema } = require('../../validators/common.validator');
const {
  categoryCreateSchema,
  categoryUpdateSchema,
  productBulkSchema,
  productRejectSchema,
  listProductsQuerySchema,
} = require('../../validators/catalog/catalog.validator');
const { HOME_SECTION_KEYS } = require('../../constants/catalog');

function createAdminCatalogRoutes(controllers, middleware) {
  const router = express.Router();
  const { categoryController, productController } = controllers;

  router.use(middleware.authenticateAdmin());

  router.get('/categories', requirePermission('categories.view'), categoryController.listAdmin);
  router.post('/categories', requirePermission('categories.edit'), validateBody(categoryCreateSchema), categoryController.create);
  router.get('/categories/:id', requirePermission('categories.view'), validateParams(Joi.object({ id: objectIdSchema })), categoryController.getById);
  router.put('/categories/:id', requirePermission('categories.edit'), validateParams(Joi.object({ id: objectIdSchema })), validateBody(categoryUpdateSchema), categoryController.update);
  router.delete('/categories/:id', requirePermission('categories.delete'), validateParams(Joi.object({ id: objectIdSchema })), categoryController.delete);
  router.patch('/categories/reorder', requirePermission('categories.edit'), validateBody(Joi.object({
    items: Joi.array().items(Joi.object({
      id: objectIdSchema.required(),
      sortOrder: Joi.number().integer().min(0).required(),
    })).min(1).required(),
  })), categoryController.reorder);

  router.get('/products', requirePermission('products.view'), validateQuery(listProductsQuerySchema), productController.listAdmin);
  router.get('/products/:id', requirePermission('products.view'), validateParams(Joi.object({ id: objectIdSchema })), productController.getAdminById);
  router.patch('/products/:id/approve', requirePermission('products.approve'), validateParams(Joi.object({ id: objectIdSchema })), productController.approve);
  router.patch('/products/:id/reject', requirePermission('products.approve'), validateParams(Joi.object({ id: objectIdSchema })), validateBody(productRejectSchema), productController.reject);
  router.delete('/products/:id', requirePermission('products.delete'), validateParams(Joi.object({ id: objectIdSchema })), productController.delete);
  router.put('/products/:id', requirePermission('products.edit'), validateParams(Joi.object({ id: objectIdSchema })), productController.update);
  router.post('/products/bulk', requirePermission('products.edit'), validateBody(productBulkSchema), productController.bulk);

  return router;
}

function createAdminCmsRoutes(controller, middleware) {
  const router = express.Router();

  router.use(middleware.authenticateAdmin());

  router.get('/banners', requirePermission('banners.view'), controller.listBanners);
  router.post('/banners', requirePermission('banners.edit'), validateBody(require('../../validators/cms/cms.validator').bannerSchema), controller.createBanner);
  router.put('/banners/:id', requirePermission('banners.edit'), validateParams(Joi.object({ id: objectIdSchema })), validateBody(require('../../validators/cms/cms.validator').bannerSchema), controller.updateBanner);
  router.delete('/banners/:id', requirePermission('banners.delete'), validateParams(Joi.object({ id: objectIdSchema })), controller.deleteBanner);

  router.get('/chips', requirePermission('banners.view'), controller.listChips);
  router.post('/chips', requirePermission('banners.edit'), validateBody(require('../../validators/cms/cms.validator').chipSchema), controller.createChip);
  router.put('/chips/:id', requirePermission('banners.edit'), validateParams(Joi.object({ id: objectIdSchema })), validateBody(require('../../validators/cms/cms.validator').chipSchema), controller.updateChip);
  router.delete('/chips/:id', requirePermission('banners.delete'), validateParams(Joi.object({ id: objectIdSchema })), controller.deleteChip);

  router.get('/sections', requirePermission('banners.view'), controller.listSections);
  router.put('/sections/:sectionKey', requirePermission('banners.edit'), validateParams(Joi.object({
    sectionKey: Joi.string().valid(...HOME_SECTION_KEYS).required(),
  })), validateBody(require('../../validators/cms/cms.validator').sectionUpdateSchema), controller.updateSection);
  router.patch('/sections/reorder', requirePermission('banners.edit'), validateBody(require('../../validators/cms/cms.validator').sectionReorderSchema), controller.reorderSections);

  router.get('/cms/legal/:type', requirePermission('settings.view'), validateParams(Joi.object({
    type: Joi.string().valid(...require('../../constants/catalog').LEGAL_PAGE_TYPE_VALUES).required(),
  })), controller.getLegalPage);
  router.put('/cms/legal/:type', requirePermission('settings.edit'), validateParams(Joi.object({
    type: Joi.string().valid(...require('../../constants/catalog').LEGAL_PAGE_TYPE_VALUES).required(),
  })), validateBody(require('../../validators/cms/cms.validator').legalPageSchema), controller.upsertLegalPage);

  router.get('/cms/:slug', requirePermission('settings.view'), controller.getAdminPage);
  router.put('/cms/:slug', requirePermission('settings.edit'), validateBody(require('../../validators/cms/cms.validator').cmsPageSchema), controller.upsertAdminPage);

  return router;
}

module.exports = {
  createAdminCatalogRoutes,
  createAdminCmsRoutes,
};
