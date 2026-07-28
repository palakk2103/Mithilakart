const Joi = require('joi');
const { objectIdSchema } = require('../common.validator');
const { COMMERCE_FLOW_VALUES, PRODUCT_STATUS_VALUES } = require('../../constants/catalog');
const { COUPON_TYPE_VALUES } = require('../../constants/pricing');

const sellerProductCreateSchema = Joi.object({
  title: Joi.string().trim().min(2).max(200).required(),
  description: Joi.string().allow('').optional(),
  sku: Joi.string().trim().required(),
  price: Joi.number().min(0).required(),
  mrp: Joi.number().min(0).required(),
  stock: Joi.number().integer().min(0).optional(),
  categoryId: objectIdSchema.required(),
  images: Joi.array().items(Joi.object({
    url: Joi.string().uri().required(),
    alt: Joi.string().allow('').optional(),
    sortOrder: Joi.number().integer().min(0).optional(),
  })).optional(),
  tags: Joi.array().items(Joi.string()).optional(),
  commerceFlows: Joi.array().items(Joi.string().valid(...COMMERCE_FLOW_VALUES)).min(1).optional(),
  brand: Joi.string().allow('').optional(),
  attributes: Joi.object().optional(),
});

const sellerProductUpdateSchema = sellerProductCreateSchema.fork(
  ['title', 'sku', 'price', 'mrp', 'categoryId'],
  (field) => field.optional()
);

const sellerProductStatusSchema = Joi.object({
  status: Joi.string().valid(...PRODUCT_STATUS_VALUES).required(),
});

const sellerCouponSchema = Joi.object({
  code: Joi.string().trim().uppercase().min(3).max(30).required(),
  description: Joi.string().allow('').optional(),
  type: Joi.string().valid(...COUPON_TYPE_VALUES).required(),
  value: Joi.number().min(0).required(),
  minOrderAmount: Joi.number().min(0).optional(),
  maxDiscount: Joi.number().min(0).optional().allow(null),
  usageLimit: Joi.number().integer().min(1).optional().allow(null),
  startsAt: Joi.date().iso().optional().allow(null),
  expiresAt: Joi.date().iso().optional().allow(null),
  isActive: Joi.boolean().optional(),
});

const sellerSettingsProfileSchema = Joi.object({
  name: Joi.string().trim().min(2).max(100).optional(),
  storeName: Joi.string().trim().max(100).optional(),
  phone: Joi.string().pattern(/^[6-9]\d{9}$/).optional(),
});

const sellerSettingsBankSchema = Joi.object({
  accountHolder: Joi.string().trim().required(),
  accountNumber: Joi.string().trim().required(),
  ifsc: Joi.string().pattern(/^[A-Z]{4}0[A-Z0-9]{6}$/).required(),
  bankName: Joi.string().trim().required(),
  pan: Joi.string().pattern(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/).optional(),
  gstin: Joi.string().pattern(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/).optional(),
});

const sellerSettingsPasswordSchema = Joi.object({
  currentPassword: Joi.string().required(),
  newPassword: Joi.string().min(8).required(),
});

const sellerSettingsNotificationsSchema = Joi.object({
  orderUpdates: Joi.boolean().optional(),
  inventoryAlerts: Joi.boolean().optional(),
  promotions: Joi.boolean().optional(),
});

const sellerPayoutSchema = Joi.object({
  amount: Joi.number().min(100).required(),
});

const sellerStockUpdateSchema = Joi.object({
  quantity: Joi.number().integer().min(0).required(),
  note: Joi.string().trim().optional().allow(null, ''),
});

module.exports = {
  sellerProductCreateSchema,
  sellerProductUpdateSchema,
  sellerProductStatusSchema,
  sellerCouponSchema,
  sellerSettingsProfileSchema,
  sellerSettingsBankSchema,
  sellerSettingsPasswordSchema,
  sellerSettingsNotificationsSchema,
  sellerPayoutSchema,
  sellerStockUpdateSchema,
};
