const express = require('express');
const Joi = require('joi');
const { validateBody, validateParams } = require('../../middleware/validate');
const { objectIdSchema } = require('../../validators/common.validator');

function createNotificationsRoutes(controller, middleware) {
  const router = express.Router();
  const auth = middleware.authenticateCustomer();

  router.get('/', auth, controller.list);
  router.patch('/read-all', auth, controller.markAllRead);
  router.patch('/:id/read', auth, validateParams(Joi.object({ id: objectIdSchema })), controller.markRead);
  router.put('/preferences', auth, controller.updatePreferences);
  router.post('/devices', auth, validateBody(Joi.object({
    deviceId: Joi.string().required(),
    fcmToken: Joi.string().required(),
    platform: Joi.string().valid('web', 'android', 'ios').optional(),
  })), controller.registerDevice);

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
