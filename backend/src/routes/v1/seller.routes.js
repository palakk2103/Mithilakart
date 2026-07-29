const express = require('express');
const Joi = require('joi');
const { validateBody, validateParams, validateQuery } = require('../../middleware/validate');
const { objectIdSchema } = require('../../validators/common.validator');
const { requireSellerContext } = require('../../helpers/sellerScope');
const { requireActiveSeller } = require('../../middleware/authMiddleware');
const { ORDER_STATUS_VALUES } = require('../../constants/commerce');
const {
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
} = require('../../validators/seller/seller.validator');
const { listProductsQuerySchema } = require('../../validators/catalog/catalog.validator');

function createSellerRoutes(controllers, middleware) {
  const router = express.Router();
  const authSeller = middleware.authenticateSeller();
  const sellerScope = [authSeller, requireActiveSeller(), requireSellerContext()];

  router.get('/dashboard', ...sellerScope, controllers.dashboard.getDashboard);
  router.get('/dashboard/stats', ...sellerScope, controllers.dashboard.getStats);

  router.get('/products', ...sellerScope, validateQuery(listProductsQuerySchema), controllers.products.list);
  router.get('/products/:id', ...sellerScope, validateParams(Joi.object({ id: objectIdSchema })), controllers.products.getById);
  router.post('/products', ...sellerScope, validateBody(sellerProductCreateSchema), controllers.products.create);
  router.put('/products/:id', ...sellerScope, validateParams(Joi.object({ id: objectIdSchema })), validateBody(sellerProductUpdateSchema), controllers.products.update);
  router.delete('/products/:id', ...sellerScope, validateParams(Joi.object({ id: objectIdSchema })), controllers.products.remove);
  router.post('/products/:id/duplicate', ...sellerScope, validateParams(Joi.object({ id: objectIdSchema })), controllers.products.duplicate);
  router.patch('/products/:id/status', ...sellerScope, validateParams(Joi.object({ id: objectIdSchema })), validateBody(sellerProductStatusSchema), controllers.products.updateStatus);

  router.get('/orders', ...sellerScope, controllers.orders.listOrdersForSeller);
  router.get('/orders/:id', ...sellerScope, validateParams(Joi.object({ id: objectIdSchema })), controllers.orders.getOrderDetailForSeller);
  router.patch(
    '/orders/:id/status',
    ...sellerScope,
    validateParams(Joi.object({ id: objectIdSchema })),
    validateBody(Joi.object({
      status: Joi.string().valid(...ORDER_STATUS_VALUES).required(),
      note: Joi.string().trim().optional().allow(null, ''),
    })),
    controllers.orders.updateOrderStatusAsSeller
  );

  router.get('/returns', ...sellerScope, controllers.returns.list);
  router.patch('/returns/:id/approve', ...sellerScope, validateParams(Joi.object({ id: objectIdSchema })), validateBody(Joi.object({ note: Joi.string().optional() })), controllers.returns.approve);
  router.patch('/returns/:id/reject', ...sellerScope, validateParams(Joi.object({ id: objectIdSchema })), validateBody(Joi.object({ note: Joi.string().optional() })), controllers.returns.reject);

  router.get('/customers', ...sellerScope, controllers.customers.list);
  router.get('/customers/:id', ...sellerScope, validateParams(Joi.object({ id: objectIdSchema })), controllers.customers.getById);

  router.get('/inventory', ...sellerScope, controllers.inventory.list);
  router.patch('/inventory/:id/stock', ...sellerScope, validateParams(Joi.object({ id: objectIdSchema })), validateBody(sellerStockUpdateSchema), controllers.inventory.updateStock);
  router.get('/inventory/:id/history', ...sellerScope, validateParams(Joi.object({ id: objectIdSchema })), controllers.inventory.getHistory);

  router.get('/coupons', ...sellerScope, controllers.coupons.list);
  router.post('/coupons', ...sellerScope, validateBody(sellerCouponSchema), controllers.coupons.create);
  router.put('/coupons/:id', ...sellerScope, validateParams(Joi.object({ id: objectIdSchema })), validateBody(sellerCouponSchema), controllers.coupons.update);
  router.delete('/coupons/:id', ...sellerScope, validateParams(Joi.object({ id: objectIdSchema })), controllers.coupons.remove);

  router.get('/analytics/sales', ...sellerScope, controllers.analytics.sales);
  router.get('/analytics/revenue', ...sellerScope, controllers.analytics.revenue);
  router.get('/analytics/products', ...sellerScope, controllers.analytics.products);
  router.get('/analytics/categories', ...sellerScope, controllers.analytics.categories);
  router.get('/analytics/customers', ...sellerScope, controllers.analytics.customers);

  router.get('/earnings', ...sellerScope, controllers.earnings.summary);
  router.get('/earnings/transactions', ...sellerScope, controllers.earnings.transactions);
  router.get('/earnings/settlements', ...sellerScope, controllers.earnings.settlements);
  router.post('/earnings/payout', ...sellerScope, validateBody(sellerPayoutSchema), controllers.earnings.requestPayout);

  router.get('/notifications', ...sellerScope, controllers.notifications.list);
  router.patch('/notifications/:id/read', ...sellerScope, validateParams(Joi.object({ id: objectIdSchema })), controllers.notifications.markRead);
  router.patch('/notifications/read-all', ...sellerScope, controllers.notifications.markAllRead);

  router.get('/reviews', ...sellerScope, controllers.reviews.list);
  router.post('/reviews/:id/reply', ...sellerScope, validateParams(Joi.object({ id: objectIdSchema })), validateBody(Joi.object({ reply: Joi.string().required() })), controllers.reviews.reply);
  router.post('/reviews/:id/report', ...sellerScope, validateParams(Joi.object({ id: objectIdSchema })), validateBody(Joi.object({ reason: Joi.string().optional() })), controllers.reviews.report);

  router.get('/questions', ...sellerScope, controllers.questions.list);
  router.post('/questions/:id/answer', ...sellerScope, validateParams(Joi.object({ id: objectIdSchema })), validateBody(Joi.object({ answer: Joi.string().required() })), controllers.questions.answer);

  router.get('/settings/profile', ...sellerScope, controllers.settings.getProfile);
  router.put('/settings/profile', ...sellerScope, validateBody(sellerSettingsProfileSchema), controllers.settings.updateProfile);
  router.put('/settings/bank', ...sellerScope, validateBody(sellerSettingsBankSchema), controllers.settings.updateBank);
  router.put('/settings/password', ...sellerScope, validateBody(sellerSettingsPasswordSchema), controllers.settings.updatePassword);
  router.put('/settings/notifications', ...sellerScope, validateBody(sellerSettingsNotificationsSchema), controllers.settings.updateNotifications);

  return router;
}

module.exports = { createSellerRoutes };
