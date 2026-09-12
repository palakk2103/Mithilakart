const express = require('express');
const Joi = require('joi');
const { validateBody } = require('../../middleware/validate');

function createCouponsRoutes(couponController, middleware) {
  const router = express.Router();
  const authCustomer = middleware.authenticateCustomer({ optional: true });

  router.get('/', authCustomer, couponController.listPublic);
  router.post('/validate', authCustomer, validateBody(Joi.object({
    code: Joi.string().required(),
    subtotal: Joi.number().min(0).required(),
  })), couponController.validate);

  return router;
}

module.exports = { createCouponsRoutes };
