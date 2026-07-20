const Joi = require('joi');
const { VEHICLE_TYPES } = require('../../constants/auth');

const countryCodeSchema = Joi.string().trim().pattern(/^\+?\d{1,4}$/).default('+91');
const phoneSchema = Joi.string().trim().pattern(/^\d{10}$/).required();
const otpSchema = Joi.string().trim().pattern(/^\d{6}$/).required();

const sendOtpSchema = Joi.object({
  countryCode: countryCodeSchema,
  phone: phoneSchema,
});

const verifyOtpSchema = Joi.object({
  countryCode: countryCodeSchema,
  phone: phoneSchema,
  otp: otpSchema,
  deviceId: Joi.string().trim().max(100).optional(),
});

const signupSchema = Joi.object({
  name: Joi.string().trim().min(2).max(100).required(),
  countryCode: countryCodeSchema,
  phone: phoneSchema,
  vehicleType: Joi.string().valid(...VEHICLE_TYPES).required(),
  aadharNumber: Joi.string().trim().pattern(/^\d{12}$/).required(),
  drivingLicenseNumber: Joi.string().trim().min(5).max(20).required(),
  vehicleRegistrationNumber: Joi.string().trim().min(4).max(20).required(),
});

const refreshTokenSchema = Joi.object({
  refreshToken: Joi.string().trim().required(),
  deviceId: Joi.string().trim().max(100).optional(),
});

const logoutSchema = Joi.object({
  refreshToken: Joi.string().trim().optional(),
});

module.exports = {
  sendOtpSchema,
  verifyOtpSchema,
  signupSchema,
  refreshTokenSchema,
  logoutSchema,
};
