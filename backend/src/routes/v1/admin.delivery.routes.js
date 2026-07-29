const express = require('express');
const Joi = require('joi');
const { validateBody, validateParams } = require('../../middleware/validate');
const { objectIdSchema } = require('../../validators/common.validator');
const { requirePermission } = require('../../middleware/authMiddleware');
const { VEHICLE_TYPES } = require('../../constants/auth');

function createAdminDeliveryRoutes(controller, middleware) {
  const router = express.Router();
  const authAdmin = middleware.authenticateAdmin();

  router.get('/delivery', authAdmin, requirePermission('orders.view'), controller.list);
  router.get('/delivery/:id', authAdmin, requirePermission('orders.view'), validateParams(Joi.object({ id: objectIdSchema })), controller.getById);
  router.post('/delivery', authAdmin, requirePermission('orders.edit'), validateBody(Joi.object({
    name: Joi.string().required(),
    phone: Joi.string().required(),
    countryCode: Joi.string().default('+91'),
    vehicleType: Joi.string().valid(...VEHICLE_TYPES).required(),
  })), controller.create);
  router.patch('/delivery/:id/approve', authAdmin, requirePermission('orders.edit'), validateParams(Joi.object({ id: objectIdSchema })), controller.approve);
  router.patch('/delivery/:id/reject', authAdmin, requirePermission('orders.edit'), validateParams(Joi.object({ id: objectIdSchema })), controller.reject);
  router.patch('/delivery/:id/suspend', authAdmin, requirePermission('orders.edit'), validateParams(Joi.object({ id: objectIdSchema })), controller.suspend);

  return router;
}

module.exports = { createAdminDeliveryRoutes };
