const express = require('express');
const Joi = require('joi');
const { validateBody, validateParams } = require('../../middleware/validate');
const { addCartItemSchema, updateCartItemSchema } = require('../../validators/cart/cart.validator');

// A cart line is addressed by the itemKey the cart returns ("listing:<id>",
// "<productId>:<variantId>") or, from older clients, a bare product/listing id.
const cartLineIdSchema = Joi.string().trim().pattern(/^(listing:)?[a-f0-9]{24}(:([a-f0-9]{24})?)?$/i).required();

function createCartRoutes(cartController, middleware) {
  const router = express.Router();

  const optionalCustomerAuth = middleware.authenticateCustomer({ optional: true });

  router.get('/', optionalCustomerAuth, cartController.getCart);
  router.post('/items', optionalCustomerAuth, validateBody(addCartItemSchema), cartController.addItem);
  router.patch('/items/:id', optionalCustomerAuth, validateParams(Joi.object({ id: cartLineIdSchema })), validateBody(updateCartItemSchema), cartController.updateItem);
  router.delete('/items/:id', optionalCustomerAuth, validateParams(Joi.object({ id: cartLineIdSchema })), cartController.removeItem);
  router.delete('/', optionalCustomerAuth, cartController.clearCart);

  return router;
}

module.exports = {
  createCartRoutes,
};

