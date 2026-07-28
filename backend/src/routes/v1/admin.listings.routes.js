const express = require('express');
const Joi = require('joi');
const { validateBody, validateParams, validateQuery } = require('../../middleware/validate');
const { requirePermission } = require('../../middleware/authMiddleware');
const { objectIdSchema } = require('../../validators/common.validator');
const { listingQuerySchema, moderationNoteSchema } = require('../../validators/marketplace/listing.validator');

function createAdminListingRoutes(adminListingController, middleware) {
  const router = express.Router();
  const authAdmin = middleware.authenticateAdmin();

  router.get(
    '/listings',
    authAdmin,
    requirePermission('products.view'),
    validateQuery(listingQuerySchema),
    adminListingController.list
  );
  router.patch(
    '/listings/:id/approve',
    authAdmin,
    requirePermission('products.approve'),
    validateParams(Joi.object({ id: objectIdSchema })),
    validateBody(moderationNoteSchema),
    adminListingController.approve
  );
  router.patch(
    '/listings/:id/reject',
    authAdmin,
    requirePermission('products.approve'),
    validateParams(Joi.object({ id: objectIdSchema })),
    validateBody(moderationNoteSchema),
    adminListingController.reject
  );
  router.patch(
    '/listings/:id/suspend',
    authAdmin,
    requirePermission('products.approve'),
    validateParams(Joi.object({ id: objectIdSchema })),
    validateBody(moderationNoteSchema),
    adminListingController.suspend
  );

  return router;
}

module.exports = { createAdminListingRoutes };
