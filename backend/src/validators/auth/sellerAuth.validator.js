const Joi = require('joi');

const countryCodeSchema = Joi.string().trim().pattern(/^\+?\d{1,4}$/).default('+91');
const phoneSchema = Joi.string().trim().pattern(/^\d{10}$/);

const sellerLoginSchema = Joi.object({
  email: Joi.string().trim().email().required(),
  password: Joi.string().min(6).required(),
  deviceId: Joi.string().trim().max(100).optional(),
});

const sellerSendPhoneOtpSchema = Joi.object({
  countryCode: countryCodeSchema,
  phone: phoneSchema.required(),
});

const sellerRegisterSchema = Joi.object({
  name: Joi.string().trim().min(2).max(100).required(),
  email: Joi.string().trim().email().required(),
  storeName: Joi.string().trim().min(2).max(120).required(),
  phone: phoneSchema.required(),
  countryCode: countryCodeSchema,
  password: Joi.string().min(6).required(),
  otp: Joi.string().length(6).pattern(/^\d+$/).required(),
  deviceId: Joi.string().trim().max(100).optional(),
  addressLine: Joi.string().trim().min(5).max(300).optional(),
  city: Joi.string().trim().min(2).max(100).required(),
  state: Joi.string().trim().min(2).max(100).optional(),
  pincode: Joi.string().trim().pattern(/^\d{6}$/).optional(),
  latitude: Joi.number().optional(),
  longitude: Joi.number().optional(),
  placeId: Joi.string().trim().optional(),
});

const refreshTokenSchema = Joi.object({
  refreshToken: Joi.string().trim().required(),
  deviceId: Joi.string().trim().max(100).optional(),
});

const logoutSchema = Joi.object({
  refreshToken: Joi.string().trim().optional(),
});

module.exports = {
  sellerLoginSchema,
  sellerSendPhoneOtpSchema,
  sellerRegisterSchema,
  refreshTokenSchema,
  logoutSchema,
};
