const express = require('express');
const Joi = require('joi');
const { validateBody, validateQuery } = require('../../middleware/validate');

function createCouponsRoutes(couponController, middleware) {
  const router = express.Router();
  const authCustomer = middleware.authenticateCustomer({ optional: true });

  // Codes are for customers, not for scrapers: logged-in only.
  router.get('/', middleware.authenticateCustomer(), couponController.listPublic);
  // CART-3: coupons with Apply / Locked state for the current cart value.
  router.get('/offers', middleware.authenticateCustomer(), validateQuery(Joi.object({
    subtotal: Joi.number().min(0).max(10000000).default(0),
  })), couponController.offers);
  router.post('/validate', authCustomer, validateBody(Joi.object({
    code: Joi.string().trim().max(40).required(),
    subtotal: Joi.number().min(0).required(),
  })), couponController.validate);

  return router;
}

module.exports = { createCouponsRoutes };
