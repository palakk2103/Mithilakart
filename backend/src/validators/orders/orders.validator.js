const Joi = require('joi');
const { objectIdSchema } = require('../common.validator');
const { PAYMENT_METHOD_VALUES } = require('../../constants/commerce');
const { COMMERCE_FLOW_VALUES_SET } = require('../../constants/commerce');

const placeOrderSchema = Joi.object({
  items: Joi.array()
    .items(
      Joi.object({
        productId: objectIdSchema.required(),
        variantId: objectIdSchema.optional().allow(null),
        quantity: Joi.number().integer().min(1).max(100).required(),
      })
    )
    .optional(),
  addressId: objectIdSchema.required(),
  paymentMethod: Joi.string().valid(...PAYMENT_METHOD_VALUES).required(),
  couponCode: Joi.string().trim().optional().allow(null, ''),
  commerceFlow: Joi.string().valid(...Array.from(COMMERCE_FLOW_VALUES_SET)).optional(),
  idempotencyKey: Joi.string().trim().min(1).max(128).optional(),
});

const cancelOrderSchema = Joi.object({});

const listOrdersQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).optional(),
  limit: Joi.number().integer().min(1).max(100).optional(),
  sort: Joi.string().optional(),
  status: Joi.string().optional(),
});

module.exports = {
  placeOrderSchema,
  cancelOrderSchema,
  listOrdersQuerySchema,
};

