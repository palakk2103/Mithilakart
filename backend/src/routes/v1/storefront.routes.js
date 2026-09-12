const express = require('express');

function createStorefrontRoutes(controller) {
  const router = express.Router();

  router.get('/home', controller.getHome);
  router.get('/config', controller.getConfig);
  router.get('/header-tabs', controller.getHeaderTabs);
  router.get('/banners', controller.getBanners);
  router.get('/:flow/home', controller.getFlowHome);

  return router;
}

module.exports = {
  createStorefrontRoutes,
};
