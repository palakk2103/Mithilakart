const { ApiResponse } = require('../../utils/ApiResponse');
const { asyncHandler } = require('../../utils/asyncHandler');

function createAdminHandlers(services) {
  return {
    dashboardStats: asyncHandler(async (req, res) => {
      const data = await services.dashboard.getStats();
      return ApiResponse.success(res, data);
    }),
    dashboardRevenue: asyncHandler(async (req, res) => {
      const data = await services.dashboard.getRevenueChart(Number(req.query.days) || 30);
      return ApiResponse.success(res, data);
    }),
    dashboardRecentOrders: asyncHandler(async (req, res) => {
      const data = await services.dashboard.getRecentOrders();
      return ApiResponse.success(res, data);
    }),
    dashboardActivities: asyncHandler(async (req, res) => {
      const data = await services.dashboard.getActivities();
      return ApiResponse.success(res, data);
    }),

    listUsers: asyncHandler(async (req, res) => {
      const result = await services.users.list(req.query);
      return ApiResponse.paginated(res, result.items, result.meta);
    }),
    getUser: asyncHandler(async (req, res) => {
      return ApiResponse.success(res, await services.users.getById(req.params.id));
    }),
    blockUser: asyncHandler(async (req, res) => {
      return ApiResponse.success(res, await services.users.block(req.params.id));
    }),
    unblockUser: asyncHandler(async (req, res) => {
      return ApiResponse.success(res, await services.users.unblock(req.params.id));
    }),
    suspendUser: asyncHandler(async (req, res) => {
      return ApiResponse.success(res, await services.users.suspend(req.params.id));
    }),
    userWallet: asyncHandler(async (req, res) => {
      return ApiResponse.success(res, await services.users.getWallet(req.params.id));
    }),
    userOrders: asyncHandler(async (req, res) => {
      const result = await services.users.getOrders(req.params.id, req.query);
      return ApiResponse.paginated(res, result.items, result.meta);
    }),
    exportUsers: asyncHandler(async (req, res) => {
      const csv = await services.users.exportCsv(req.query);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=users.csv');
      return res.send(csv);
    }),

    listVendors: asyncHandler(async (req, res) => {
      const result = await services.vendors.list(req.query);
      return ApiResponse.paginated(res, result.items, result.meta);
    }),
    getVendor: asyncHandler(async (req, res) => {
      return ApiResponse.success(res, await services.vendors.getById(req.params.id));
    }),
    approveVendor: asyncHandler(async (req, res) => {
      return ApiResponse.success(res, await services.vendors.approve(req.params.id));
    }),
    rejectVendor: asyncHandler(async (req, res) => {
      return ApiResponse.success(res, await services.vendors.reject(req.params.id));
    }),
    suspendVendor: asyncHandler(async (req, res) => {
      return ApiResponse.success(res, await services.vendors.suspend(req.params.id));
    }),
    activateVendor: asyncHandler(async (req, res) => {
      return ApiResponse.success(res, await services.vendors.activate(req.params.id));
    }),
    vendorProducts: asyncHandler(async (req, res) => {
      const result = await services.vendors.getProducts(req.params.id, req.query);
      return ApiResponse.paginated(res, result.items, result.meta);
    }),
    vendorEarnings: asyncHandler(async (req, res) => {
      return ApiResponse.success(res, { total: await services.vendors.getEarnings(req.params.id) });
    }),

    listRoles: asyncHandler(async (req, res) => {
      const result = await services.roles.list(req.query);
      return ApiResponse.paginated(res, result.items, result.meta);
    }),
    listPermissions: asyncHandler(async (req, res) => {
      return ApiResponse.success(res, services.roles.listPermissions());
    }),
    createRole: asyncHandler(async (req, res) => {
      return ApiResponse.created(res, await services.roles.create(req.body));
    }),
    updateRole: asyncHandler(async (req, res) => {
      return ApiResponse.success(res, await services.roles.update(req.params.id, req.body));
    }),
    deleteRole: asyncHandler(async (req, res) => {
      return ApiResponse.success(res, await services.roles.remove(req.params.id));
    }),

    listAuditLogs: asyncHandler(async (req, res) => {
      const result = await services.audit.listLogs(req.query);
      return ApiResponse.paginated(res, result.items, result.meta);
    }),
    loginHistory: asyncHandler(async (req, res) => {
      const result = await services.audit.listLoginHistory(req.query);
      return ApiResponse.paginated(res, result.items, result.meta);
    }),

    listSupport: asyncHandler(async (req, res) => {
      const result = await services.support.list(req.query);
      return ApiResponse.paginated(res, result.items, result.meta);
    }),
    getSupport: asyncHandler(async (req, res) => {
      return ApiResponse.success(res, await services.support.getById(req.params.id));
    }),
    replySupport: asyncHandler(async (req, res) => {
      return ApiResponse.success(res, await services.support.reply(req.params.id, req.user.id, req.body.message));
    }),
    closeSupport: asyncHandler(async (req, res) => {
      return ApiResponse.success(res, await services.support.close(req.params.id));
    }),

    getSettings: asyncHandler(async (req, res) => {
      return ApiResponse.success(res, await services.settings.getSettings());
    }),
    updateSettings: asyncHandler(async (req, res) => {
      return ApiResponse.success(res, await services.settings.updateSettings(req.body, req.user.id));
    }),
    updateCommission: asyncHandler(async (req, res) => {
      return ApiResponse.success(res, await services.settings.updateCommission(req.body.rate, req.user.id));
    }),

    financeEarnings: asyncHandler(async (req, res) => {
      return ApiResponse.success(res, await services.finance.getPlatformEarnings());
    }),
    listCommissionRules: asyncHandler(async (req, res) => {
      return ApiResponse.success(res, await services.finance.listCommissionRules());
    }),
    createCommissionRule: asyncHandler(async (req, res) => {
      return ApiResponse.created(res, await services.finance.createCommissionRule(req.body));
    }),
    updateCommissionRule: asyncHandler(async (req, res) => {
      return ApiResponse.success(res, await services.finance.updateCommissionRule(req.params.id, req.body));
    }),
    deleteCommissionRule: asyncHandler(async (req, res) => {
      return ApiResponse.success(res, await services.finance.deleteCommissionRule(req.params.id));
    }),
    listTaxConfigs: asyncHandler(async (req, res) => {
      return ApiResponse.success(res, await services.finance.listTaxConfigs());
    }),
    createTaxConfig: asyncHandler(async (req, res) => {
      return ApiResponse.created(res, await services.finance.createTaxConfig(req.body));
    }),
    updateTaxConfig: asyncHandler(async (req, res) => {
      return ApiResponse.success(res, await services.finance.updateTaxConfig(req.params.id, req.body));
    }),
    deleteTaxConfig: asyncHandler(async (req, res) => {
      return ApiResponse.success(res, await services.finance.deleteTaxConfig(req.params.id));
    }),
    listDeliveryCharges: asyncHandler(async (req, res) => {
      return ApiResponse.success(res, await services.finance.listDeliveryChargeRules());
    }),
    createDeliveryCharge: asyncHandler(async (req, res) => {
      return ApiResponse.created(res, await services.finance.createDeliveryChargeRule(req.body));
    }),
    updateDeliveryCharge: asyncHandler(async (req, res) => {
      return ApiResponse.success(res, await services.finance.updateDeliveryChargeRule(req.params.id, req.body));
    }),
    deleteDeliveryCharge: asyncHandler(async (req, res) => {
      return ApiResponse.success(res, await services.finance.deleteDeliveryChargeRule(req.params.id));
    }),

    reportSales: asyncHandler(async (req, res) => ApiResponse.success(res, await services.reports.salesReport(req.query))),
    reportSellers: asyncHandler(async (req, res) => ApiResponse.success(res, await services.reports.sellersReport())),
    reportUsers: asyncHandler(async (req, res) => ApiResponse.success(res, await services.reports.usersReport())),
    reportOrders: asyncHandler(async (req, res) => ApiResponse.success(res, await services.reports.ordersReport(req.query))),
    reportInventory: asyncHandler(async (req, res) => ApiResponse.success(res, await services.reports.inventoryReport())),
    reportRefunds: asyncHandler(async (req, res) => ApiResponse.success(res, await services.reports.refundsReport())),
    exportReport: asyncHandler(async (req, res) => {
      const exported = await services.reports.exportReport(req.params.type, req.query);
      res.setHeader('Content-Type', exported.contentType);
      res.setHeader('Content-Disposition', `attachment; filename=${exported.filename}`);
      return res.send(exported.body);
    }),

    listAdminNotifications: asyncHandler(async (req, res) => {
      return ApiResponse.success(res, await services.notifications.listTemplates());
    }),
    sendNotification: asyncHandler(async (req, res) => {
      return ApiResponse.success(res, await services.notifications.broadcast(req.body));
    }),
    upsertTemplate: asyncHandler(async (req, res) => {
      return ApiResponse.success(res, await services.notifications.upsertTemplate(req.body));
    }),
  };
}

module.exports = { createAdminHandlers };
