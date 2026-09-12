const express = require('express');
const Joi = require('joi');
const { validateBody, validateParams } = require('../../middleware/validate');
const { objectIdSchema, idOrOrderNumberSchema } = require('../../validators/common.validator');
const { requireDeliveryContext } = require('../../helpers/deliveryScope');
const { requireApprovedPartner } = require('../../middleware/authMiddleware');

function createDeliveryRoutes(controllers, middleware) {
  const router = express.Router();
  const authDelivery = middleware.authenticateDelivery();
  const deliveryScope = [authDelivery, requireApprovedPartner(), requireDeliveryContext()];

  router.get('/dashboard', ...deliveryScope, controllers.dashboard.getDashboard);
  router.patch('/status', ...deliveryScope, validateBody(Joi.object({ isOnline: Joi.boolean().required() })), controllers.dashboard.updateStatus);

  router.get('/orders', ...deliveryScope, controllers.orders.listOrders);
  router.get('/orders/:id', ...deliveryScope, validateParams(Joi.object({ id: idOrOrderNumberSchema })), controllers.orders.getOrderDetail);
  router.post('/orders/:id/accept', ...deliveryScope, validateParams(Joi.object({ id: idOrOrderNumberSchema })), controllers.orders.acceptOrder);
  router.post('/orders/:id/pickup', ...deliveryScope, validateParams(Joi.object({ id: idOrOrderNumberSchema })), validateBody(Joi.object({ otp: Joi.string().min(4).max(6).pattern(/^\d+$/).required() })), controllers.orders.confirmPickup);
  router.post('/orders/:id/deliver', ...deliveryScope, validateParams(Joi.object({ id: idOrOrderNumberSchema })), validateBody(Joi.object({ otp: Joi.string().min(4).max(6).pattern(/^\d+$/).required() })), controllers.orders.confirmDelivery);
  router.post('/orders/:id/reject', ...deliveryScope, validateParams(Joi.object({ id: idOrOrderNumberSchema })), validateBody(Joi.object({ reason: Joi.string().trim().max(500).optional().allow('', null) })), controllers.orders.rejectOrder);
  router.post('/orders/:id/failed', ...deliveryScope, validateParams(Joi.object({ id: idOrOrderNumberSchema })), validateBody(Joi.object({ reason: Joi.string().trim().max(500).optional().allow('', null) })), controllers.orders.markDeliveryFailed);

  router.get('/earnings', ...deliveryScope, controllers.earnings.list);
  router.get('/profile', ...deliveryScope, controllers.orders.getProfile);
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
