const Joi = require('joi');

const profileUpdateSchema = Joi.object({
  name: Joi.string().trim().min(2).max(100).optional(),
  email: Joi.string().trim().email().optional(),
  gender: Joi.string().valid('male', 'female', 'other').optional().allow(null),
  dob: Joi.date().iso().optional().allow(null),
  locale: Joi.string().valid('en', 'hi', 'bn', 'mai').optional(),
});

const addressSchema = Joi.object({
  type: Joi.string().valid('HOME', 'WORK', 'OTHER').default('HOME'),
  name: Joi.string().trim().required(),
  phone: Joi.string().trim().pattern(/^\d{10}$/).required(),
  addressLine: Joi.string().trim().required(),
  city: Joi.string().trim().optional().allow(null, ''),
  state: Joi.string().trim().optional().allow(null, ''),
  pincode: Joi.string().trim().pattern(/^\d{6}$/).required(),
  latitude: Joi.number().optional(),
  longitude: Joi.number().optional(),
  placeId: Joi.string().trim().optional(),
  isDefault: Joi.boolean().optional(),
});

const paymentMethodSchema = Joi.object({
  type: Joi.string().valid('VISA', 'MASTERCARD', 'RUPAY', 'UPI', 'OTHER').default('VISA'),
  last4: Joi.string().trim().pattern(/^\d{4}$/).required(),
  expiryMonth: Joi.string().trim().pattern(/^(0[1-9]|1[0-2])$/).optional().allow(null, ''),
  expiryYear: Joi.string().trim().pattern(/^\d{2,4}$/).optional().allow(null, ''),
  holderName: Joi.string().trim().required(),
  isDefault: Joi.boolean().optional(),
});

module.exports = {
  profileUpdateSchema,
  addressSchema,
  paymentMethodSchema,
};
