const Joi = require('joi');
const { PASSWORD } = require('../../constants/auth');

const adminLoginSchema = Joi.object({
  email: Joi.string().trim().email().required(),
  password: Joi.string().min(PASSWORD.MIN_LENGTH).required(),
  deviceId: Joi.string().trim().max(100).optional(),
});

const adminChangePasswordSchema = Joi.object({
  currentPassword: Joi.string().required(),
  newPassword: Joi.string().min(PASSWORD.MIN_LENGTH).required(),
});

const refreshTokenSchema = Joi.object({
  refreshToken: Joi.string().trim().required(),
  deviceId: Joi.string().trim().max(100).optional(),
});

const logoutSchema = Joi.object({
  refreshToken: Joi.string().trim().optional(),
});

module.exports = {
  adminLoginSchema,
  adminChangePasswordSchema,
  refreshTokenSchema,
  logoutSchema,
};
