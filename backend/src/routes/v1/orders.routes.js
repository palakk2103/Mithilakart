const express = require('express');
const Joi = require('joi');
const { validateBody, validateParams, validateQuery } = require('../../middleware/validate');
const { objectIdSchema, idOrOrderNumberSchema } = require('../../validators/common.validator');
const { placeOrderSchema, cancelOrderSchema, listOrdersQuerySchema } = require('../../validators/orders/orders.validator');

function createOrdersRoutes({ orderController, returnController, gameController = null }, middleware) {
  const router = express.Router();
  const authCustomer = middleware.authenticateCustomer();

  router.post('/', authCustomer, validateBody(placeOrderSchema), orderController.placeOrder);

  router.get('/', authCustomer, validateQuery(listOrdersQuerySchema), orderController.listOrders);
  router.get('/:id', authCustomer, validateParams(Joi.object({ id: idOrOrderNumberSchema })), orderController.getOrderDetail);
  router.get('/:id/tracking', authCustomer, validateParams(Joi.object({ id: idOrOrderNumberSchema })), orderController.getOrderTracking);
  router.get('/:id/fulfillment', authCustomer, validateParams(Joi.object({ id: idOrOrderNumberSchema })), orderController.getOrderFulfillment);
  router.post('/:id/cancel', authCustomer, validateParams(Joi.object({ id: idOrOrderNumberSchema })), validateBody(cancelOrderSchema), orderController.cancelOrder);
  router.post('/:id/returns', authCustomer, validateParams(Joi.object({ id: idOrOrderNumberSchema })), validateBody(Joi.object({
    orderItemId: objectIdSchema.required(),
    quantity: Joi.number().integer().min(1).required(),
    reason: Joi.string().trim().optional().allow(null, ''),
    images: Joi.array().items(Joi.string()).optional(),
  })), returnController.initiateReturn);

  // "Catch Your Delivery" — shown on order tracking; nested here rather than
  // as a separate mount point since it is an order-scoped sub-resource.
  if (gameController) {
    router.get('/:id/game/eligibility', authCustomer, validateParams(Joi.object({ id: idOrOrderNumberSchema })), gameController.getEligibility);
    router.post('/:id/game/start', authCustomer, validateParams(Joi.object({ id: idOrOrderNumberSchema })), gameController.startSession);
    router.post('/:id/game/:sessionId/claim', authCustomer, validateParams(Joi.object({ id: idOrOrderNumberSchema, sessionId: objectIdSchema.required() })), gameController.claimSession);
  }

  return router;
}

module.exports = {
  createOrdersRoutes,
};

