const express = require('express');
const Joi = require('joi');
const { validateBody, validateParams } = require('../../middleware/validate');
const { objectIdSchema } = require('../../validators/common.validator');
const { requireDeliveryContext } = require('../../helpers/deliveryScope');
const { requireApprovedPartner } = require('../../middleware/authMiddleware');

function createDeliveryRoutes(controllers, middleware) {
  const router = express.Router();
  const authDelivery = middleware.authenticateDelivery();
  const deliveryScope = [authDelivery, requireApprovedPartner(), requireDeliveryContext()];

  router.get('/dashboard', ...deliveryScope, controllers.dashboard.getDashboard);
  router.patch('/status', ...deliveryScope, validateBody(Joi.object({ isOnline: Joi.boolean().required() })), controllers.dashboard.updateStatus);

  router.get('/orders', ...deliveryScope, controllers.orders.listOrders);
  router.post('/orders/:id/accept', ...deliveryScope, validateParams(Joi.object({ id: objectIdSchema })), controllers.orders.acceptOrder);
  router.post('/orders/:id/pickup', ...deliveryScope, validateParams(Joi.object({ id: objectIdSchema })), validateBody(Joi.object({ otp: Joi.string().length(4).required() })), controllers.orders.confirmPickup);
  router.post('/orders/:id/deliver', ...deliveryScope, validateParams(Joi.object({ id: objectIdSchema })), validateBody(Joi.object({ otp: Joi.string().length(4).required() })), controllers.orders.confirmDelivery);

  router.get('/earnings', ...deliveryScope, controllers.earnings.list);
  router.patch('/profile', ...deliveryScope, validateBody(Joi.object({
    name: Joi.string().trim().optional(),
    vehicleType: Joi.string().optional(),
  })), controllers.orders.updateProfile);

  router.patch('/location', ...deliveryScope, validateBody(Joi.object({
    latitude: Joi.number().required(),
    longitude: Joi.number().required(),
  })), controllers.orders.updateLocation);

  router.post('/devices', ...deliveryScope, validateBody(Joi.object({
    deviceId: Joi.string().required(),
    fcmToken: Joi.string().required(),
    platform: Joi.string().valid('web', 'android', 'ios').optional(),
  })), controllers.orders.registerDevice);

  return router;
}

module.exports = { createDeliveryRoutes };
