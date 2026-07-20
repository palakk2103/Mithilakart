const express = require('express');
const Joi = require('joi');
const { validateBody, validateParams } = require('../../middleware/validate');
const { objectIdSchema } = require('../../validators/common.validator');
const { addCartItemSchema, updateCartItemSchema } = require('../../validators/cart/cart.validator');

function createCartRoutes(cartController, middleware) {
  const router = express.Router();

  const optionalCustomerAuth = middleware.authenticateCustomer({ optional: true });

  router.get('/', optionalCustomerAuth, cartController.getCart);
  router.post('/items', optionalCustomerAuth, validateBody(addCartItemSchema), cartController.addItem);
  router.patch('/items/:id', optionalCustomerAuth, validateParams(Joi.object({ id: objectIdSchema })), validateBody(updateCartItemSchema), cartController.updateItem);
  router.delete('/items/:id', optionalCustomerAuth, validateParams(Joi.object({ id: objectIdSchema })), cartController.removeItem);
  router.delete('/', optionalCustomerAuth, cartController.clearCart);

  return router;
}

module.exports = {
  createCartRoutes,
};

