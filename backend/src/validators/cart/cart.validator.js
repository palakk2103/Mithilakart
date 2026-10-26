const Joi = require('joi');
const { objectIdSchema } = require('../common.validator');
const { COMMERCE_FLOW_VALUES_SET } = require('../../constants/commerce');
const { MARKETPLACE_TAB_VALUES } = require('../../constants/marketplace');

const ALLOWED_COMMERCE_FLOWS = [
  ...Array.from(COMMERCE_FLOW_VALUES_SET),
  'quickshop',
  'freshgrocery',
  'mithilakart',
];

const addCartItemSchema = Joi.object({
  productId: objectIdSchema.optional(),
  listingId: objectIdSchema.optional(),
  variantId: objectIdSchema.optional().allow(null),
  quantity: Joi.number().integer().min(1).max(100).required(),
  commerceFlow: Joi.string().valid(...ALLOWED_COMMERCE_FLOWS).optional(),
  marketplaceTab: Joi.string().valid(...MARKETPLACE_TAB_VALUES).optional(),
}).or('productId', 'listingId');

const updateCartItemSchema = Joi.object({
  quantity: Joi.number().integer().min(1).max(100).required(),
  commerceFlow: Joi.string().valid(...ALLOWED_COMMERCE_FLOWS).optional(),
});

const clearCartSchema = Joi.object({});

module.exports = {
  addCartItemSchema,
  updateCartItemSchema,
  clearCartSchema,
};

