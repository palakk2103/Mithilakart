const express = require('express');
const Joi = require('joi');
const { validateBody, validateParams } = require('../../middleware/validate');
const { objectIdSchema } = require('../../validators/common.validator');

function createEngagementRoutes({ reviewController, qnaController }, middleware) {
  const router = express.Router();
  const authCustomer = middleware.authenticateCustomer();

  router.post('/products/:id/reviews', authCustomer, validateParams(Joi.object({ id: objectIdSchema })), validateBody(Joi.object({
    orderId: objectIdSchema.required(),
    rating: Joi.number().integer().min(1).max(5).required(),
    title: Joi.string().trim().optional().allow(null, ''),
    body: Joi.string().trim().required(),
    images: Joi.array().items(Joi.string()).optional(),
    videos: Joi.array().items(Joi.string()).optional(),
  })), reviewController.create);

  router.get('/products/:id/reviews', validateParams(Joi.object({ id: objectIdSchema })), reviewController.listByProduct);

  router.post('/products/:id/questions', authCustomer, validateParams(Joi.object({ id: objectIdSchema })), validateBody(Joi.object({
    question: Joi.string().trim().required(),
  })), qnaController.ask);

  router.get('/products/:id/questions', validateParams(Joi.object({ id: objectIdSchema })), qnaController.listByProduct);

  return router;
}

module.exports = { createEngagementRoutes };
