const express = require('express');
const Joi = require('joi');
const { validateBody, validateParams } = require('../../middleware/validate');
const { objectIdSchema } = require('../../validators/common.validator');
const { requirePermission } = require('../../middleware/authMiddleware');

function createAdminContentRoutes(controller, middleware) {
  const router = express.Router();
  const authAdmin = middleware.authenticateAdmin();

  router.get('/content/reviews', authAdmin, requirePermission('products.approve'), controller.listReviews);
  router.patch('/content/reviews/:id', authAdmin, requirePermission('products.approve'), validateParams(Joi.object({ id: objectIdSchema })), validateBody(Joi.object({
    action: Joi.string().valid('approve', 'reject', 'hide').required(),
    note: Joi.string().optional().allow(null, ''),
  })), controller.moderateReview);

  router.get('/content/qna', authAdmin, requirePermission('products.approve'), controller.listQuestions);
  router.patch('/content/qna/:id', authAdmin, requirePermission('products.approve'), validateParams(Joi.object({ id: objectIdSchema })), validateBody(Joi.object({
    action: Joi.string().valid('hide').required(),
  })), controller.moderateQuestion);

  return router;
}

module.exports = { createAdminContentRoutes };
