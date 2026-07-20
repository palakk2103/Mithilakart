const express = require('express');
const Joi = require('joi');
const { validateParams } = require('../../middleware/validate');
const { objectIdSchema } = require('../../validators/common.validator');
const { orderTrackingStreamService } = require('../../services/realtime/OrderTrackingStreamService');

function createRealtimeRoutes(middleware) {
  const router = express.Router();
  const auth = middleware.authenticateCustomer();

  router.get('/orders/:id/stream', auth, validateParams(Joi.object({ id: objectIdSchema })), (req, res) => {
    orderTrackingStreamService.subscribe(req.params.id, res);
  });

  return router;
}

module.exports = { createRealtimeRoutes };
