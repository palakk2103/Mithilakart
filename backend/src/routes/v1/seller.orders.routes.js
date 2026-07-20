const express = require('express');
const Joi = require('joi');
const { validateBody, validateParams } = require('../../middleware/validate');
const { objectIdSchema } = require('../../validators/common.validator');
const { ORDER_STATUS_VALUES } = require('../../constants/commerce');
const { requirePermission } = require('../../middleware/authMiddleware');

function createSellerOrdersRoutes(orderController, middleware) {
  const router = express.Router();

  const authSeller = middleware.authenticateSeller();
  const canEdit = requirePermission('orders.edit');

  router.get('/orders', authSeller, (req, res) => {
    res.status(501).json({ success: false, message: 'Not implemented' });
  });

  router.get('/orders/:id', authSeller, validateParams(Joi.object({ id: objectIdSchema })), (req, res) => {
    res.status(501).json({ success: false, message: 'Not implemented' });
  });

  router.patch(
    '/orders/:id/status',
    authSeller,
    canEdit,
    validateParams(Joi.object({ id: objectIdSchema })),
    validateBody(
      Joi.object({
        status: Joi.string().valid(...ORDER_STATUS_VALUES).required(),
        note: Joi.string().trim().optional().allow(null, ''),
      })
    ),
    orderController.updateOrderStatusAsSeller
  );

  return router;
}

module.exports = {
  createSellerOrdersRoutes,
};

