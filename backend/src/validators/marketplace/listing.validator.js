const Joi = require('joi');
const { objectIdSchema } = require('../common.validator');
const {
  MARKETPLACE_TAB_VALUES,
  DELIVERY_PROMISE_MINUTES,
  LISTING_STATUS_VALUES,
} = require('../../constants/marketplace');

const createListingSchema = Joi.object({
  marketplaceTab: Joi.string().valid(...MARKETPLACE_TAB_VALUES).required(),
  price: Joi.number().min(0).required(),
  mrp: Joi.number().min(0).required(),
  maxOrderQuantity: Joi.number().integer().min(1).optional(),
  deliveryPromiseMinutes: Joi.number().valid(...DELIVERY_PROMISE_MINUTES).optional(),
  promotionTags: Joi.array().items(Joi.string().trim()).optional(),
  sortBoost: Joi.number().optional(),
});

const updateListingSchema = Joi.object({
  price: Joi.number().min(0).optional(),
  mrp: Joi.number().min(0).optional(),
  maxOrderQuantity: Joi.number().integer().min(1).allow(null).optional(),
  deliveryPromiseMinutes: Joi.number().valid(...DELIVERY_PROMISE_MINUTES).allow(null).optional(),
  promotionTags: Joi.array().items(Joi.string().trim()).optional(),
  sortBoost: Joi.number().optional(),
}).min(1);

const listingQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).optional(),
  limit: Joi.number().integer().min(1).max(100).optional(),
  marketplaceTab: Joi.string().optional(),
  commerceFlow: Joi.string().optional(),
  listingStatus: Joi.string().valid(...LISTING_STATUS_VALUES).optional(),
  categoryId: objectIdSchema.optional(),
});

const moderationNoteSchema = Joi.object({
  note: Joi.string().trim().max(500).optional().allow(null, ''),
});

module.exports = {
  createListingSchema,
  updateListingSchema,
  listingQuerySchema,
  moderationNoteSchema,
};
