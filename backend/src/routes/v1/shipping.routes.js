const express = require('express');
const Joi = require('joi');
const { validateQuery, validateParams } = require('../../middleware/validate');
const { objectIdSchema } = require('../../validators/common.validator');

function createShippingRoutes(shippingController, middleware) {
  const router = express.Router();
  const authCustomer = middleware.authenticateCustomer();
  const authSeller = middleware.authenticateSeller();

  router.get(
    '/serviceability',
    validateQuery(
      Joi.object({
        pincode: Joi.string().pattern(/^\d{6}$/).required(),
        weightKg: Joi.number().min(0.1).optional(),
        cod: Joi.boolean().optional(),
        pickupPincode: Joi.string().pattern(/^\d{6}$/).optional(),
      })
    ),
    shippingController.checkServiceability
  );

  router.post('/webhooks/shiprocket', shippingController.shiprocketWebhook);

  router.get(
    '/orders/:orderId/label',
    authSeller,
    validateParams(Joi.object({ orderId: objectIdSchema })),
    shippingController.getShipmentLabel
  );

  router.get(
    '/orders/:orderId/label/customer',
    authCustomer,
    validateParams(Joi.object({ orderId: objectIdSchema })),
    shippingController.getShipmentLabel
  );

  return router;
}

module.exports = { createShippingRoutes };
