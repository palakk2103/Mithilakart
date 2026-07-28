const { BaseController } = require('../../core/BaseController');
const { asyncHandler } = require('../../utils/asyncHandler');
const { getProvider } = require('../../core/providers.registry');

class ShippingController extends BaseController {
  constructor({ courierShipmentService }) {
    super();
    this.courierShipmentService = courierShipmentService;
    this.bindMethods(['checkServiceability', 'shiprocketWebhook', 'getShipmentLabel']);
  }

  checkServiceability = asyncHandler(async (req, res) => {
    const pincode = req.query.pincode || req.query.deliveryPincode;
    const weightKg = Number(req.query.weightKg || req.query.weight || 0.5);
    const cod = String(req.query.cod || 'false').toLowerCase() === 'true';

    const result = await this.courierShipmentService.checkPincodeServiceability({
      pincode,
      weightKg,
      cod,
      pickupPincode: req.query.pickupPincode || null,
    });

    return this.sendSuccess(res, result);
  });

  shiprocketWebhook = asyncHandler(async (req, res) => {
    const shipping = getProvider('shipping');
    const token = req.headers['x-api-key'] || req.headers['x-shiprocket-token'];

    if (typeof shipping.verifyWebhookToken === 'function' && !shipping.verifyWebhookToken(token)) {
      return res.status(401).json({ success: false, message: 'Invalid webhook token' });
    }

    const result = await this.courierShipmentService.handleWebhookPayload(req.body || {});
    return res.status(200).json({ success: true, data: result });
  });

  getShipmentLabel = asyncHandler(async (req, res) => {
    const filter = { _id: req.params.orderId, deletedAt: null };
    if (req.user?.portal === 'customer') {
      filter.userId = req.user.id;
    }

    const order = await this.courierShipmentService.orderRepository.findOne(filter);
    if (!order?.shipment?.labelUrl) {
      return res.status(404).json({ success: false, message: 'Label not available' });
    }
    return this.sendSuccess(res, {
      labelUrl: order.shipment.labelUrl,
      awb: order.shipment.awb,
      courierName: order.shipment.courierName,
    });
  });
}

module.exports = { ShippingController };
