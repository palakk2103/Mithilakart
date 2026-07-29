const express = require('express');
const Joi = require('joi');
const { validateParams, validateQuery } = require('../../middleware/validate');
const { objectIdSchema } = require('../../validators/common.validator');
const { listingQuerySchema } = require('../../validators/marketplace/listing.validator');

function createMarketplaceRoutes(marketplaceController) {
  const router = express.Router();

  router.get('/tabs', marketplaceController.listTabs);
  router.get('/listings', validateQuery(listingQuerySchema), marketplaceController.listListings);
  router.get(
    '/listings/:id',
    validateParams(Joi.object({ id: objectIdSchema })),
    marketplaceController.getListing
  );
  router.get(
    '/products/:id',
    validateParams(Joi.object({ id: objectIdSchema })),
    validateQuery(listingQuerySchema),
    marketplaceController.getProductWithListing
  );

  return router;
}

module.exports = { createMarketplaceRoutes };
