const Joi = require('joi');
const { objectIdSchema } = require('../common.validator');
const { PAYMENT_METHOD_VALUES } = require('../../constants/commerce');
const { COMMERCE_FLOW_VALUES_SET } = require('../../constants/commerce');

// Extra ways to pay, the same for the quote and the order.
const creditFields = {
  giftCardCode: Joi.string().trim().max(40).optional().allow(null, ''),
  useWallet: Joi.boolean().optional(),
};

const placeOrderSchema = Joi.object({
  ...creditFields,
  // What the customer saw on the pay button; a higher real amount is refused, not charged.
  expectedTotal: Joi.number().min(0).optional(),
  items: Joi.array()
    .items(
      Joi.object({
        productId: objectIdSchema.required(),
        // The listing the customer bought from — fixes tab, price and promise.
        listingId: objectIdSchema.optional().allow(null),
        variantId: objectIdSchema.optional().allow(null),
        quantity: Joi.number().integer().min(1).max(100).required(),
      })
    )
    .optional(),
  addressId: objectIdSchema.required(),
  paymentMethod: Joi.string().valid(...PAYMENT_METHOD_VALUES).required(),
  couponCode: Joi.string().trim().optional().allow(null, ''),
  tipAmount: Joi.number().integer().min(0).max(500).optional(),
  commerceFlow: Joi.string().valid(...Array.from(COMMERCE_FLOW_VALUES_SET)).optional(),
  idempotencyKey: Joi.string().trim().min(1).max(128).optional(),
});

const quoteOrderSchema = Joi.object({
  ...creditFields,
  items: Joi.array().items(Joi.object({
    productId: objectIdSchema.required(),
    listingId: objectIdSchema.optional().allow(null),
    variantId: objectIdSchema.optional().allow(null),
    quantity: Joi.number().integer().min(1).max(100).required(),
  })).max(100).optional(),
  paymentMethod: Joi.string().valid(...PAYMENT_METHOD_VALUES).optional().allow(null),
  couponCode: Joi.string().trim().max(40).optional().allow(null, ''),
  tipAmount: Joi.number().integer().min(0).max(500).optional(),
  commerceFlow: Joi.string().valid(...Array.from(COMMERCE_FLOW_VALUES_SET)).optional(),
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
  quoteOrderSchema,
  cancelOrderSchema,
  listOrdersQuerySchema,
};

