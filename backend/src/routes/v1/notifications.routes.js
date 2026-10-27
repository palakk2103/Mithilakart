const express = require('express');
const Joi = require('joi');
const { validateBody, validateParams } = require('../../middleware/validate');
const { objectIdSchema } = require('../../validators/common.validator');

function createNotificationsRoutes(controller, middleware) {
  const router = express.Router();
  const auth = middleware.authenticateCustomer();

  // Direct FCM test endpoint (No auth required - ideal for Postman & mobile testing)
  router.post('/fcm/send-direct', validateBody(Joi.object({
    fcmToken: Joi.string().required(),
    title: Joi.string().optional().default('Mithilakart Push Notification'),
    body: Joi.string().optional().default('Test notification from Mithilakart backend'),
    platform: Joi.string().trim().max(50).optional().default('app'),
    deviceId: Joi.string().optional(),
    saveToDb: Joi.boolean().optional().default(false),
    portal: Joi.string().valid('customer', 'seller', 'delivery', 'admin').optional().default('customer'),
    userId: Joi.string().optional(),
    data: Joi.object().optional(),
  })), controller.directFcmTest);

  router.get('/', auth, controller.list);
  router.patch('/read-all', auth, controller.markAllRead);
  router.patch('/:id/read', auth, validateParams(Joi.object({ id: objectIdSchema })), controller.markRead);
  router.put('/preferences', auth, controller.updatePreferences);
  router.post('/devices', auth, validateBody(Joi.object({
    deviceId: Joi.string().required(),
    fcmToken: Joi.string().required(),
    platform: Joi.string().trim().max(50).optional().default('web'),
  })), controller.registerDevice);
  router.post('/test-push', auth, validateBody(Joi.object({
    title: Joi.string().optional(),
    body: Joi.string().optional(),
    data: Joi.object().optional(),
  })), controller.testPush);

  return router;
}

function createSupportRoutes(controller, middleware) {
  const router = express.Router();
  const auth = middleware.authenticateCustomer();

  router.get('/tickets', auth, controller.listTickets);
  router.post('/tickets', auth, validateBody(Joi.object({
    subject: Joi.string().required(),
    message: Joi.string().required(),
    priority: Joi.string().valid('low', 'medium', 'high').optional(),
  })), controller.createTicket);

  return router;
}

module.exports = { createNotificationsRoutes, createSupportRoutes };
