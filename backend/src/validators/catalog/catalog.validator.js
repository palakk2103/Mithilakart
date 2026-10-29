const Joi = require('joi');
const { objectIdSchema } = require('../common.validator');
const { COMMERCE_FLOW_VALUES, PRODUCT_STATUS_VALUES } = require('../../constants/catalog');
const { MARKETPLACE_TAB_VALUES } = require('../../constants/marketplace');

const mediaUrlSchema = Joi.string().trim().custom((value, helpers) => {
  if (!value) return value;
  if (value.startsWith('/') || value.startsWith('http://') || value.startsWith('https://')) {
    return value;
  }
  return helpers.error('any.invalid');
}, 'media url').messages({ 'any.invalid': 'Must be a valid URL or path starting with /' });

const categoryCreateSchema = Joi.object({
  name: Joi.string().trim().min(2).max(100).required(),
  slug: Joi.string().trim().lowercase().pattern(/^[a-z0-9-]+$/).required(),
  description: Joi.string().allow('').optional(),
  parentId: objectIdSchema.optional().allow(null),
  parentIds: Joi.array().items(objectIdSchema).optional().allow(null),
  imageUrl: mediaUrlSchema.optional().allow(null, ''),
  iconUrl: mediaUrlSchema.optional().allow(null, ''),
  sortOrder: Joi.number().integer().min(0).optional(),
  isActive: Joi.boolean().optional(),
  commerceFlows: Joi.array().items(Joi.string().valid(...COMMERCE_FLOW_VALUES)).optional(),
  visibleTabs: Joi.array().items(Joi.string().valid(...require('../../constants/marketplace').MARKETPLACE_TAB_VALUES)).min(1).optional(),
});

const categoryUpdateSchema = categoryCreateSchema.fork(['name', 'slug'], (field) => field.optional());

// Cells are validated row-by-row by CategoryBulkImportService so the admin
// gets a per-row report instead of one 422 for the whole sheet.
const sheetCell = Joi.alternatives().try(Joi.string().allow(''), Joi.number(), Joi.boolean()).allow(null);

const categoryBulkImportSchema = Joi.object({
  marketplaceTab: Joi.string().valid(...MARKETPLACE_TAB_VALUES).required(),
  dryRun: Joi.boolean().default(true),
  rows: Joi.array().items(Joi.object({
    category: sheetCell,
    subcategory: sheetCell,
    childCategory: sheetCell,
    childcategory: sheetCell,
    description: sheetCell,
    imageUrl: sheetCell,
    iconUrl: sheetCell,
    sortOrder: sheetCell,
    isActive: sheetCell,
  })).min(1).max(2000).required(),
});

const productBulkSchema = Joi.object({
  ids: Joi.array().items(objectIdSchema).min(1).max(100).required(),
  action: Joi.string().valid('approve', 'reject', 'delete').required(),
});

const productRejectSchema = Joi.object({
  moderationNote: Joi.string().trim().min(3).max(500).required(),
});

const listProductsQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).optional(),
  limit: Joi.number().integer().min(1).max(500).optional(),
  sort: Joi.string().optional(),
  search: Joi.string().allow('').optional(),
  q: Joi.string().allow('').optional(),
  categoryId: objectIdSchema.optional(),
  commerceFlow: Joi.string().valid(...COMMERCE_FLOW_VALUES).optional(),
  // Canonical tab param — resolveTabFromQuery() prefers this over commerceFlow.
  // Was missing here: Joi's stripUnknown:true silently dropped it from every
  // /products and /categories/:id/products request, so the frontend tab-scope
  // fix (docs/production-readiness) could never actually take effect.
  marketplaceTab: Joi.string().allow('').optional(),
  tab: Joi.string().allow('').optional(),
  flow: Joi.string().allow('').optional(),
  status: Joi.string().valid(...PRODUCT_STATUS_VALUES).optional(),
  minPrice: Joi.number().min(0).optional(),
  maxPrice: Joi.number().min(0).optional(),
  brand: Joi.string().optional(),
  from: Joi.date().iso().optional(),
  to: Joi.date().iso().optional(),
});

module.exports = {
  categoryCreateSchema,
  categoryUpdateSchema,
  categoryBulkImportSchema,
  sheetCell,
  productBulkSchema,
  productRejectSchema,
  listProductsQuerySchema,
};
