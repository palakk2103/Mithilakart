const express = require('express');
const Joi = require('joi');
const { validateBody, validateParams } = require('../../middleware/validate');
const { objectIdSchema } = require('../../validators/common.validator');
const { requirePermission } = require('../../middleware/authMiddleware');
const { REFUND_METHOD_VALUES } = require('../../constants/wallet');

function createAdminOperationsRoutes({ returnController, refundController }, middleware) {
  const router = express.Router();
  const authAdmin = middleware.authenticateAdmin();

  router.get('/operations/returns', authAdmin, requirePermission('returns.view'), returnController.list);
  router.get('/operations/returns/:id', authAdmin, requirePermission('returns.view'), validateParams(Joi.object({ id: objectIdSchema })), returnController.getById);
  router.patch('/operations/returns/:id/approve', authAdmin, requirePermission('returns.approve'), validateParams(Joi.object({ id: objectIdSchema })), validateBody(Joi.object({ note: Joi.string().optional() })), returnController.approve);
  router.patch('/operations/returns/:id/reject', authAdmin, requirePermission('returns.edit'), validateParams(Joi.object({ id: objectIdSchema })), validateBody(Joi.object({ note: Joi.string().optional() })), returnController.reject);

  router.get('/operations/refunds', authAdmin, requirePermission('returns.view'), refundController.list);
  router.get('/operations/refunds/:id', authAdmin, requirePermission('returns.view'), validateParams(Joi.object({ id: objectIdSchema })), refundController.getById);
  router.post('/operations/refunds/process', authAdmin, requirePermission('returns.approve'), validateBody(Joi.object({
    returnId: objectIdSchema.required(),
    method: Joi.string().valid(...REFUND_METHOD_VALUES).default('wallet'),
    idempotencyKey: Joi.string().optional(),
  })), refundController.process);

  return router;
}

module.exports = { createAdminOperationsRoutes };
