const express = require('express');
const Joi = require('joi');
const { validateBody, validateParams } = require('../../middleware/validate');
const { objectIdSchema } = require('../../validators/common.validator');
const { ORDER_STATUS_VALUES } = require('../../constants/commerce');
const { requirePermission } = require('../../middleware/authMiddleware');

function createAdminOrdersRoutes(orderController, middleware) {
  const router = express.Router();
  const authAdmin = middleware.authenticateAdmin();

  router.get('/orders', authAdmin, requirePermission('orders.view'), orderController.listOrdersForAdmin);
  router.get('/orders/:id', authAdmin, requirePermission('orders.view'), validateParams(Joi.object({ id: objectIdSchema })), orderController.getOrderDetailForAdmin);
  router.patch(
    '/orders/:id/status',
    authAdmin,
    requirePermission('orders.edit'),
    validateParams(Joi.object({ id: objectIdSchema })),
    validateBody(
      Joi.object({
        status: Joi.string().valid(...ORDER_STATUS_VALUES).required(),
        note: Joi.string().trim().optional().allow(null, ''),
      })
    ),
    orderController.updateOrderStatusAsAdmin
  );

  router.get('/orders/:id/invoice', authAdmin, requirePermission('orders.view'), validateParams(Joi.object({ id: objectIdSchema })), (req, res) => {
    res.status(501).json({ success: false, message: 'Not implemented' });
  });

  return router;
}

module.exports = {
  createAdminOrdersRoutes,
};

