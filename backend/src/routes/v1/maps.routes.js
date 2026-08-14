const express = require('express');
const Joi = require('joi');
const { validateBody, validateQuery } = require('../../middleware/validate');

const coordsQuerySchema = Joi.object({
  lat: Joi.number().required(),
  lng: Joi.number().required(),
  latitude: Joi.number().optional(),
  longitude: Joi.number().optional(),
  radiusKm: Joi.number().min(1).max(100).optional(),
});

const nearbyProductsQuerySchema = coordsQuerySchema.keys({
  page: Joi.number().integer().min(1).optional(),
  limit: Joi.number().integer().min(1).max(100).optional(),
  commerceFlow: Joi.string().valid('standard', 'quick_shop', 'fresh_grocery', 'mithilak').optional(),
  categoryId: Joi.string().optional(),
});

const geocodeBodySchema = Joi.object({
  addressLine: Joi.string().trim().required(),
  city: Joi.string().trim().optional().allow(null, ''),
  state: Joi.string().trim().optional().allow(null, ''),
  pincode: Joi.string().trim().optional().allow(null, ''),
});

function createMapsRoutes(mapsController) {
  const router = express.Router();

  router.get('/reverse-geocode', validateQuery(coordsQuerySchema), mapsController.reverseGeocode);
  router.post('/geocode', validateBody(geocodeBodySchema), mapsController.geocode);
  router.get('/nearby/sellers', validateQuery(coordsQuerySchema), mapsController.nearbySellers);
  router.get('/nearby/products', validateQuery(nearbyProductsQuerySchema), mapsController.nearbyProducts);

  return router;
}

module.exports = { createMapsRoutes };
