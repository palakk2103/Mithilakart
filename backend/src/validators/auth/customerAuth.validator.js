const Joi = require('joi');

const countryCodeSchema = Joi.string().trim().pattern(/^\+?\d{1,4}$/).required();
const phoneSchema = Joi.string().trim().pattern(/^\d{8,11}$/).required();
const emailSchema = Joi.string().trim().email().required();
const otpSchema = Joi.string().trim().pattern(/^\d{6}$/).required();

const sendPhoneOtpSchema = Joi.object({
  countryCode: countryCodeSchema.default('+91'),
  phone: phoneSchema,
});

const verifyPhoneOtpSchema = Joi.object({
  countryCode: countryCodeSchema.default('+91'),
  phone: phoneSchema,
  otp: otpSchema,
  name: Joi.string().trim().min(2).max(100).optional(),
  deviceId: Joi.string().trim().max(100).optional(),
});

const sendEmailOtpSchema = Joi.object({
  email: emailSchema,
});

const verifyEmailOtpSchema = Joi.object({
  email: emailSchema,
  otp: otpSchema,
  name: Joi.string().trim().min(2).max(100).optional(),
  deviceId: Joi.string().trim().max(100).optional(),
});

const refreshTokenSchema = Joi.object({
  refreshToken: Joi.string().trim().required(),
  deviceId: Joi.string().trim().max(100).optional(),
});

const logoutSchema = Joi.object({
  refreshToken: Joi.string().trim().optional(),
});

module.exports = {
  sendPhoneOtpSchema,
  verifyPhoneOtpSchema,
  sendEmailOtpSchema,
  verifyEmailOtpSchema,
  refreshTokenSchema,
  logoutSchema,
};
