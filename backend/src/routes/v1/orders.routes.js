const express = require('express');
const Joi = require('joi');
const { validateBody, validateParams, validateQuery } = require('../../middleware/validate');
const { objectIdSchema, idOrOrderNumberSchema } = require('../../validators/common.validator');
const { placeOrderSchema, cancelOrderSchema, listOrdersQuerySchema } = require('../../validators/orders/orders.validator');

function createOrdersRoutes({ orderController, returnController }, middleware) {
  const router = express.Router();
  const authCustomer = middleware.authenticateCustomer();

  router.post('/', authCustomer, validateBody(placeOrderSchema), orderController.placeOrder);

  router.get('/', authCustomer, validateQuery(listOrdersQuerySchema), orderController.listOrders);
  router.get('/:id', authCustomer, validateParams(Joi.object({ id: idOrOrderNumberSchema })), orderController.getOrderDetail);
  router.get('/:id/tracking', authCustomer, validateParams(Joi.object({ id: idOrOrderNumberSchema })), orderController.getOrderTracking);
  router.post('/:id/cancel', authCustomer, validateParams(Joi.object({ id: idOrOrderNumberSchema })), validateBody(cancelOrderSchema), orderController.cancelOrder);
  router.post('/:id/returns', authCustomer, validateParams(Joi.object({ id: idOrOrderNumberSchema })), validateBody(Joi.object({
    orderItemId: objectIdSchema.required(),
    quantity: Joi.number().integer().min(1).required(),
    reason: Joi.string().trim().optional().allow(null, ''),
    images: Joi.array().items(Joi.string()).optional(),
  })), returnController.initiateReturn);

  return router;
}

module.exports = {
  createOrdersRoutes,
};

