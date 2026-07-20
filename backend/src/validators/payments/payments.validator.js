const Joi = require('joi');
const { objectIdSchema } = require('../common.validator');
const { PAYMENT_METHOD_VALUES } = require('../../constants/commerce');

const initiatePaymentSchema = Joi.object({
  orderId: objectIdSchema.required(),
  paymentMethod: Joi.string().valid(...PAYMENT_METHOD_VALUES).required(),
  idempotencyKey: Joi.string().trim().min(1).optional(),
});

const verifyPaymentSchema = Joi.object({
  orderId: objectIdSchema.required(),
  providerPaymentId: Joi.string().trim().min(1).required(),
  providerOrderId: Joi.string().trim().optional().allow(null, ''),
  signature: Joi.string().trim().optional().allow(null, ''),
});

module.exports = {
  initiatePaymentSchema,
  verifyPaymentSchema,
};

