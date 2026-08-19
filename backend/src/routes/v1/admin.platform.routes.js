const express = require('express');
const Joi = require('joi');
const { validateBody, validateParams } = require('../../middleware/validate');
const { objectIdSchema } = require('../../validators/common.validator');
const { requirePermission } = require('../../middleware/authMiddleware');
const { createAdminHandlers } = require('../../controllers/admin/adminHandlers');

function createAdminPlatformRoutes(services, middleware) {
  const router = express.Router();
  const authAdmin = middleware.authenticateAdmin();
  const h = createAdminHandlers(services);

  router.get('/dashboard/stats', authAdmin, requirePermission('dashboard.view'), h.dashboardStats);
  router.get('/dashboard/revenue', authAdmin, requirePermission('dashboard.view'), h.dashboardRevenue);
  router.get('/dashboard/recent-orders', authAdmin, requirePermission('dashboard.view'), h.dashboardRecentOrders);
  router.get('/dashboard/activities', authAdmin, requirePermission('dashboard.view'), h.dashboardActivities);

  router.get('/users', authAdmin, requirePermission('users.view'), h.listUsers);
  router.get('/users/export', authAdmin, requirePermission('reports.export'), h.exportUsers);
  router.get('/users/:id', authAdmin, requirePermission('users.view'), validateParams(Joi.object({ id: objectIdSchema })), h.getUser);
  router.patch('/users/:id/block', authAdmin, requirePermission('users.block'), validateParams(Joi.object({ id: objectIdSchema })), h.blockUser);
  router.patch('/users/:id/unblock', authAdmin, requirePermission('users.block'), validateParams(Joi.object({ id: objectIdSchema })), h.unblockUser);
  router.patch('/users/:id/suspend', authAdmin, requirePermission('users.block'), validateParams(Joi.object({ id: objectIdSchema })), h.suspendUser);
  router.get('/users/:id/wallet', authAdmin, requirePermission('users.view'), validateParams(Joi.object({ id: objectIdSchema })), h.userWallet);
  router.get('/users/:id/orders', authAdmin, requirePermission('users.view'), validateParams(Joi.object({ id: objectIdSchema })), h.userOrders);

  router.get('/vendors', authAdmin, requirePermission('sellers.view'), h.listVendors);
  router.get('/vendors/:id', authAdmin, requirePermission('sellers.view'), validateParams(Joi.object({ id: objectIdSchema })), h.getVendor);
  router.patch('/vendors/:id/approve', authAdmin, requirePermission('sellers.approve'), validateParams(Joi.object({ id: objectIdSchema })), h.approveVendor);
  router.patch('/vendors/:id/reject', authAdmin, requirePermission('sellers.approve'), validateParams(Joi.object({ id: objectIdSchema })), h.rejectVendor);
  router.patch('/vendors/:id/suspend', authAdmin, requirePermission('sellers.suspend'), validateParams(Joi.object({ id: objectIdSchema })), h.suspendVendor);
  router.patch('/vendors/:id/activate', authAdmin, requirePermission('sellers.edit'), validateParams(Joi.object({ id: objectIdSchema })), h.activateVendor);
  router.get('/vendors/:id/products', authAdmin, requirePermission('sellers.view'), validateParams(Joi.object({ id: objectIdSchema })), h.vendorProducts);
  router.get('/vendors/:id/earnings', authAdmin, requirePermission('finance.view'), validateParams(Joi.object({ id: objectIdSchema })), h.vendorEarnings);

  router.get('/roles', authAdmin, requirePermission('system.roles'), h.listRoles);
  router.get('/roles/permissions', authAdmin, requirePermission('system.roles'), h.listPermissions);
  router.post('/roles', authAdmin, requirePermission('system.roles'), validateBody(Joi.object({
    name: Joi.string().required(),
    description: Joi.string().optional(),
    permissions: Joi.array().items(Joi.string()).required(),
  })), h.createRole);
  router.put('/roles/:id', authAdmin, requirePermission('system.roles'), validateParams(Joi.object({ id: objectIdSchema })), h.updateRole);
  router.delete('/roles/:id', authAdmin, requirePermission('system.roles'), validateParams(Joi.object({ id: objectIdSchema })), h.deleteRole);

  router.get('/audit/logs', authAdmin, requirePermission('system.audit'), h.listAuditLogs);
  router.get('/audit/login-history', authAdmin, requirePermission('system.audit'), h.loginHistory);

  router.get('/support/tickets', authAdmin, requirePermission('tickets.view'), h.listSupport);
  router.get('/support/tickets/:id', authAdmin, requirePermission('tickets.view'), validateParams(Joi.object({ id: objectIdSchema })), h.getSupport);
  router.post('/support/tickets/:id/reply', authAdmin, requirePermission('tickets.edit'), validateParams(Joi.object({ id: objectIdSchema })), validateBody(Joi.object({ message: Joi.string().required() })), h.replySupport);
  router.patch('/support/tickets/:id/close', authAdmin, requirePermission('tickets.close'), validateParams(Joi.object({ id: objectIdSchema })), h.closeSupport);

  // ── CR-002 — fulfillment configuration & monitoring ─────────────────────
  // A validating façade over the same platform_settings store used below.
  if (services.fulfillment) {
    router.get('/fulfillment/settings', authAdmin, requirePermission('settings.view'), h.fulfillmentSettings);
    router.put('/fulfillment/settings', authAdmin, requirePermission('settings.edit'), h.updateFulfillmentSettings);

    router.get('/fulfillment/orders', authAdmin, requirePermission('orders.view'), h.listFulfillments);
    router.get(
      '/fulfillment/orders/:orderId',
      authAdmin,
      requirePermission('orders.view'),
      validateParams(Joi.object({ orderId: objectIdSchema })),
      h.getFulfillmentDetail
    );
    router.post(
      '/fulfillment/orders/:orderId/retry',
      authAdmin,
      requirePermission('orders.edit'),
      validateParams(Joi.object({ orderId: objectIdSchema })),
      h.retryFulfillment
    );
    router.post(
      '/fulfillment/orders/:orderId/force-courier',
      authAdmin,
      requirePermission('orders.edit'),
      validateParams(Joi.object({ orderId: objectIdSchema })),
      h.forceCourierFulfillment
    );
  }

  router.get('/settings', authAdmin, requirePermission('settings.view'), h.getSettings);
  router.put('/settings', authAdmin, requirePermission('settings.edit'), h.updateSettings);
  router.put('/settings/commission', authAdmin, requirePermission('finance.edit'), validateBody(Joi.object({ rate: Joi.number().min(0).max(1).required() })), h.updateCommission);

  router.get('/finance/earnings', authAdmin, requirePermission('finance.view'), h.financeEarnings);
  router.get('/finance/commission-rules', authAdmin, requirePermission('finance.view'), h.listCommissionRules);
  router.post('/finance/commission-rules', authAdmin, requirePermission('finance.edit'), h.createCommissionRule);
  router.put('/finance/commission-rules/:id', authAdmin, requirePermission('finance.edit'), validateParams(Joi.object({ id: objectIdSchema })), h.updateCommissionRule);
  router.delete('/finance/commission-rules/:id', authAdmin, requirePermission('finance.edit'), validateParams(Joi.object({ id: objectIdSchema })), h.deleteCommissionRule);
  router.get('/finance/tax', authAdmin, requirePermission('finance.view'), h.listTaxConfigs);
  router.post('/finance/tax', authAdmin, requirePermission('finance.edit'), h.createTaxConfig);
  router.put('/finance/tax/:id', authAdmin, requirePermission('finance.edit'), validateParams(Joi.object({ id: objectIdSchema })), h.updateTaxConfig);
  router.delete('/finance/tax/:id', authAdmin, requirePermission('finance.edit'), validateParams(Joi.object({ id: objectIdSchema })), h.deleteTaxConfig);
  router.get('/finance/delivery-charges', authAdmin, requirePermission('finance.view'), h.listDeliveryCharges);
  router.post('/finance/delivery-charges', authAdmin, requirePermission('finance.edit'), h.createDeliveryCharge);
  router.put('/finance/delivery-charges/:id', authAdmin, requirePermission('finance.edit'), validateParams(Joi.object({ id: objectIdSchema })), h.updateDeliveryCharge);
  router.delete('/finance/delivery-charges/:id', authAdmin, requirePermission('finance.edit'), validateParams(Joi.object({ id: objectIdSchema })), h.deleteDeliveryCharge);

  router.get('/reports/sales', authAdmin, requirePermission('reports.view'), h.reportSales);
  router.get('/reports/sellers', authAdmin, requirePermission('reports.view'), h.reportSellers);
  router.get('/reports/users', authAdmin, requirePermission('reports.view'), h.reportUsers);
  router.get('/reports/orders', authAdmin, requirePermission('reports.view'), h.reportOrders);
  router.get('/reports/inventory', authAdmin, requirePermission('reports.view'), h.reportInventory);
  router.get('/reports/refunds', authAdmin, requirePermission('reports.view'), h.reportRefunds);
  router.get('/reports/export/:type', authAdmin, requirePermission('reports.export'), h.exportReport);

  router.get('/comms/notifications/templates', authAdmin, requirePermission('notifications.view'), h.listAdminNotifications);
  router.post('/comms/notifications/send', authAdmin, requirePermission('notifications.send'), validateBody(Joi.object({
    title: Joi.string().required(),
    body: Joi.string().required(),
    userIds: Joi.array().items(objectIdSchema).optional(),
  })), h.sendNotification);
  router.put('/comms/notifications/templates', authAdmin, requirePermission('notifications.send'), h.upsertTemplate);

  return router;
}

module.exports = { createAdminPlatformRoutes };
