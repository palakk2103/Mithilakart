const express = require('express');
const Joi = require('joi');
const { validateParams } = require('../../middleware/validate');
const { objectIdSchema } = require('../../validators/common.validator');

function createStorefrontRoutes(controller, categoryLandingController = null) {
  const router = express.Router();

  router.get('/home', controller.getHome);
  router.get('/config', controller.getConfig);
  router.get('/header-tabs', controller.getHeaderTabs);
  router.get('/you-popup', controller.getYouPopup);
  router.get('/banners', controller.getBanners);
  if (categoryLandingController) {
    router.get(
      '/category-landing/:categoryId',
      validateParams(Joi.object({ categoryId: objectIdSchema })),
      categoryLandingController.getPublic
    );
  }
  router.get('/:flow/home', controller.getFlowHome);

  return router;
}

module.exports = {
  createStorefrontRoutes,
};
