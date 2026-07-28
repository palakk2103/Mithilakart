const express = require('express');
const Joi = require('joi');
const { validateParams } = require('../../middleware/validate');
const { objectIdSchema } = require('../../validators/common.validator');
const { orderTrackingStreamService } = require('../../services/realtime/OrderTrackingStreamService');
const { sellerOrderStreamService } = require('../../services/realtime/SellerOrderStreamService');
const { OrderItemRepository } = require('../../repositories/OrderItemRepository');

function createRealtimeRoutes(middleware) {
  const router = express.Router();
  const auth = middleware.authenticateCustomer();
  const authSeller = middleware.authenticateSeller();
  const orderItemRepository = new OrderItemRepository();

  router.get('/orders/:id/stream', auth, validateParams(Joi.object({ id: objectIdSchema })), (req, res) => {
    orderTrackingStreamService.subscribe(req.params.id, res);
  });

  // Seller-wide SSE feed: new orders + status updates for this seller.
  router.get('/seller/stream', authSeller, (req, res) => {
    sellerOrderStreamService.subscribe(req.user.sellerId, res);
  });

  // Seller SSE stream: sellers watch status updates for orders that include their seller sub-order.
  router.get(
    '/seller/orders/:id/stream',
    authSeller,
    validateParams(Joi.object({ id: objectIdSchema })),
    async (req, res) => {
      const canAccess = await orderItemRepository.exists({
        orderId: req.params.id,
        sellerId: req.user.sellerId,
        deletedAt: null,
      });

      if (!canAccess) {
        res.status(403).end();
        return;
      }

      orderTrackingStreamService.subscribe(req.params.id, res);
    }
  );

  return router;
}

module.exports = { createRealtimeRoutes };
