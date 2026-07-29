const Joi = require('joi');
const { objectIdSchema } = require('../common.validator');
const { COMMERCE_FLOW_VALUES, HOME_SECTION_KEYS, UPLOAD_CONTEXTS } = require('../../constants/catalog');

const mediaUrlSchema = Joi.string().trim().custom((value, helpers) => {
  if (!value) return value;
  if (value.startsWith('/') || value.startsWith('http://') || value.startsWith('https://')) {
    return value;
  }
  return helpers.error('any.invalid');
}, 'media url').messages({ 'any.invalid': 'Must be a valid URL or path starting with /' });

const bannerSchema = Joi.object({
  title: Joi.string().trim().min(2).max(120).required(),
  imageUrl: mediaUrlSchema.required(),
  linkUrl: Joi.string().trim().optional().allow(null, ''),
  commerceFlow: Joi.string().valid(...COMMERCE_FLOW_VALUES).optional(),
  startDate: Joi.date().iso().optional().allow(null),
  endDate: Joi.date().iso().optional().allow(null),
  sortOrder: Joi.number().integer().min(0).optional(),
  isActive: Joi.boolean().optional(),
});

const chipSchema = Joi.object({
  label: Joi.string().trim().min(1).max(50).required(),
  imageUrl: mediaUrlSchema.optional().allow(null, ''),
  categoryId: objectIdSchema.optional().allow(null),
  commerceFlow: Joi.string().valid(...COMMERCE_FLOW_VALUES).optional(),
  sortOrder: Joi.number().integer().min(0).optional(),
  isActive: Joi.boolean().optional(),
});

const sectionUpdateSchema = Joi.object({
  title: Joi.string().trim().min(2).max(120).required(),
  productIds: Joi.array().items(objectIdSchema).max(50).optional(),
  isActive: Joi.boolean().optional(),
  sortOrder: Joi.number().integer().min(0).optional(),
});

const sectionReorderSchema = Joi.object({
  commerceFlow: Joi.string().valid(...COMMERCE_FLOW_VALUES).required(),
  orderedKeys: Joi.array().items(Joi.string().valid(...HOME_SECTION_KEYS)).min(1).required(),
});

const cmsPageSchema = Joi.object({
  title: Joi.string().trim().min(2).max(200).required(),
  content: Joi.string().min(1).required(),
  isPublished: Joi.boolean().optional(),
});

const legalPageSchema = Joi.object({
  title: Joi.string().trim().min(2).max(200).required(),
  content: Joi.string().min(1).required(),
});

const presignSchema = Joi.object({
  context: Joi.string().valid(...Object.values(UPLOAD_CONTEXTS)).required(),
  fileName: Joi.string().trim().min(1).max(255).required(),
  mimeType: Joi.string().trim().required(),
});

const confirmUploadSchema = Joi.object({
  context: Joi.string().valid(...Object.values(UPLOAD_CONTEXTS)).required(),
  storageKey: Joi.string().trim().required(),
  mimeType: Joi.string().trim().required(),
});

module.exports = {
  bannerSchema,
  chipSchema,
  sectionUpdateSchema,
  sectionReorderSchema,
  cmsPageSchema,
  legalPageSchema,
  presignSchema,
  confirmUploadSchema,
};
