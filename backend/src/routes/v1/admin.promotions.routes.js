const express = require('express');
const Joi = require('joi');
const { validateBody, validateParams } = require('../../middleware/validate');
const { objectIdSchema } = require('../../validators/common.validator');
const { requirePermission } = require('../../middleware/authMiddleware');
const { createAdminPromotionHandlers } = require('../../controllers/admin/adminPromotionHandlers');
const { COUPON_TYPE_VALUES } = require('../../constants/pricing');

function createAdminPromotionRoutes(services, middleware) {
  const router = express.Router();
  const authAdmin = middleware.authenticateAdmin();
  const h = createAdminPromotionHandlers(services);

  router.get('/coupons', authAdmin, requirePermission('coupons.view'), h.listCoupons);
  router.post('/coupons', authAdmin, requirePermission('coupons.edit'), validateBody(Joi.object({
    code: Joi.string().required(),
    description: Joi.string().optional(),
    type: Joi.string().valid(...COUPON_TYPE_VALUES).required(),
    value: Joi.number().min(0).required(),
    minOrderAmount: Joi.number().min(0).optional(),
    maxDiscount: Joi.number().min(0).optional(),
    usageLimit: Joi.number().min(1).optional(),
    perUserLimit: Joi.number().min(1).optional(),
    startsAt: Joi.date().optional(),
    expiresAt: Joi.date().optional(),
    isActive: Joi.boolean().optional(),
  })), h.createCoupon);
  router.put('/coupons/:id', authAdmin, requirePermission('coupons.edit'), validateParams(Joi.object({ id: objectIdSchema })), h.updateCoupon);
  router.delete('/coupons/:id', authAdmin, requirePermission('coupons.delete'), validateParams(Joi.object({ id: objectIdSchema })), h.deleteCoupon);

  router.get('/flash-sales', authAdmin, requirePermission('coupons.view'), h.listFlashSales);
  router.post('/flash-sales', authAdmin, requirePermission('coupons.edit'), validateBody(Joi.object({
    title: Joi.string().required(),
    description: Joi.string().optional(),
    startsAt: Joi.date().required(),
    endsAt: Joi.date().required(),
    isActive: Joi.boolean().optional(),
  })), h.createFlashSale);
  router.put('/flash-sales/:id', authAdmin, requirePermission('coupons.edit'), validateParams(Joi.object({ id: objectIdSchema })), h.updateFlashSale);
  router.delete('/flash-sales/:id', authAdmin, requirePermission('coupons.delete'), validateParams(Joi.object({ id: objectIdSchema })), h.deleteFlashSale);
  router.post('/flash-sales/:id/products', authAdmin, requirePermission('coupons.edit'), validateParams(Joi.object({ id: objectIdSchema })), validateBody(Joi.object({
    productId: objectIdSchema.required(),
    salePrice: Joi.number().min(0).required(),
  })), h.addFlashSaleProduct);

  router.get('/featured-products', authAdmin, requirePermission('coupons.view'), h.listFeaturedProducts);
  router.post('/featured-products', authAdmin, requirePermission('coupons.edit'), validateBody(Joi.object({
    productId: objectIdSchema.required(),
    sortOrder: Joi.number().optional(),
  })), h.setFeaturedProduct);
  router.delete('/featured-products/:id', authAdmin, requirePermission('coupons.delete'), validateParams(Joi.object({ id: objectIdSchema })), h.removeFeaturedProduct);

  router.get('/sub-admins', authAdmin, requirePermission('system.roles'), h.listSubAdmins);
  router.post('/sub-admins', authAdmin, requirePermission('system.roles'), validateBody(Joi.object({
    name: Joi.string().required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(8).required(),
    roleId: objectIdSchema.required(),
    status: Joi.string().valid('active', 'inactive').optional(),
  })), h.createSubAdmin);
  router.put('/sub-admins/:id', authAdmin, requirePermission('system.roles'), validateParams(Joi.object({ id: objectIdSchema })), h.updateSubAdmin);
  router.delete('/sub-admins/:id', authAdmin, requirePermission('system.roles'), validateParams(Joi.object({ id: objectIdSchema })), h.deleteSubAdmin);

  router.get('/payouts', authAdmin, requirePermission('finance.view'), h.listPayouts);
  router.patch('/payouts/:id', authAdmin, requirePermission('finance.edit'), validateParams(Joi.object({ id: objectIdSchema })), validateBody(Joi.object({
    status: Joi.string().valid('pending', 'processing', 'completed', 'rejected').required(),
    rejectionReason: Joi.string().optional().allow(null, ''),
  })), h.updatePayoutStatus);

  return router;
}

module.exports = { createAdminPromotionRoutes };
