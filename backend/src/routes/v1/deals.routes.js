const express = require('express');

function createDealsRoutes(promotionController) {
  const router = express.Router();

  router.get('/deals', promotionController.getDeals);
  router.get('/offers', promotionController.getOffers);

  return router;
}

module.exports = { createDealsRoutes };
