const express = require('express');
const Joi = require('joi');
const { validateBody, validateParams, validateQuery } = require('../../middleware/validate');
const { objectIdSchema } = require('../../validators/common.validator');
const { requireSellerContext } = require('../../helpers/sellerScope');
const { requireActiveSeller } = require('../../middleware/authMiddleware');
const {
  createListingSchema,
  updateListingSchema,
  listingQuerySchema,
} = require('../../validators/marketplace/listing.validator');

function createSellerListingRoutes(sellerListingController, middleware) {
  const router = express.Router();
  const authSeller = middleware.authenticateSeller();
  const sellerScope = [authSeller, requireActiveSeller(), requireSellerContext()];

  router.get('/listings', ...sellerScope, validateQuery(listingQuerySchema), sellerListingController.list);
  router.get(
    '/listings/:id',
    ...sellerScope,
    validateParams(Joi.object({ id: objectIdSchema })),
    sellerListingController.getById
  );
  router.post(
    '/products/:productId/listings',
    ...sellerScope,
    validateParams(Joi.object({ productId: objectIdSchema })),
    validateBody(createListingSchema),
    sellerListingController.createForProduct
  );
  router.get(
    '/products/:productId/listings',
    ...sellerScope,
    validateParams(Joi.object({ productId: objectIdSchema })),
    sellerListingController.listByProduct
  );
  router.put(
    '/listings/:id',
    ...sellerScope,
    validateParams(Joi.object({ id: objectIdSchema })),
    validateBody(updateListingSchema),
    sellerListingController.update
  );
  router.patch(
    '/listings/:id/publish',
    ...sellerScope,
    validateParams(Joi.object({ id: objectIdSchema })),
    sellerListingController.publish
  );
  router.patch(
    '/listings/:id/unpublish',
    ...sellerScope,
    validateParams(Joi.object({ id: objectIdSchema })),
    sellerListingController.unpublish
  );
  router.delete(
    '/listings/:id',
    ...sellerScope,
    validateParams(Joi.object({ id: objectIdSchema })),
    sellerListingController.remove
  );

  return router;
}

module.exports = { createSellerListingRoutes };
