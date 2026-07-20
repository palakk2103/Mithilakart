const { BaseController } = require('../../core/BaseController');
const { ApiResponse } = require('../../utils/ApiResponse');
const { asyncHandler } = require('../../utils/asyncHandler');

class CustomerNotificationController extends BaseController {
  constructor(notificationService, supportService) {
    super(notificationService);
    this.supportService = supportService;
    this.bindMethods(['list', 'markRead', 'markAllRead', 'updatePreferences', 'registerDevice', 'createTicket', 'listTickets']);
  }

  list = asyncHandler(async (req, res) => {
    const data = await this.service.listForUser(req.user.id, req.query);
    return ApiResponse.success(res, data);
  });

  markRead = asyncHandler(async (req, res) => {
    const data = await this.service.markRead(req.user.id, req.params.id);
    return ApiResponse.success(res, data);
  });

  markAllRead = asyncHandler(async (req, res) => {
    const data = await this.service.markAllRead(req.user.id);
    return ApiResponse.success(res, data);
  });

  updatePreferences = asyncHandler(async (req, res) => {
    const data = await this.service.updatePreferences(req.user.id, req.body);
    return ApiResponse.success(res, data);
  });

  registerDevice = asyncHandler(async (req, res) => {
    const data = await this.service.registerDeviceToken(
      req.user.id,
      'customer',
      req.body.deviceId,
      req.body.fcmToken,
      req.body.platform || 'web'
    );
    return ApiResponse.success(res, data);
  });

  createTicket = asyncHandler(async (req, res) => {
    const data = await this.supportService.createByUser(req.user.id, req.body);
    return ApiResponse.created(res, data);
  });

  listTickets = asyncHandler(async (req, res) => {
    const result = await this.supportService.listByUser(req.user.id, req.query);
    return ApiResponse.paginated(res, result.items, result.meta);
  });
}

module.exports = { CustomerNotificationController };
