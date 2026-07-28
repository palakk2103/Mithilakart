const { AppError } = require('../../../utils/AppError');
const { PAYMENT_METHOD } = require('../../../constants/commerce');
const { logger } = require('../../../utils/logger');
const { ShiprocketClient } = require('./ShiprocketClient');
const {
  mapShiprocketStatusToOrderStatus,
  normalizeShiprocketStatus,
  isRtoStatus,
} = require('./shiprocketStatusMap');
const { BaseCourierShippingProvider } = require('./BaseCourierShippingProvider');

class ShiprocketShippingProvider extends BaseCourierShippingProvider {
  constructor(config = {}) {
    super('shiprocket', 'Shiprocket');
    this.config = config;
    this.client = new ShiprocketClient({
      email: config.email,
      password: config.password,
      apiBaseUrl: config.apiBaseUrl,
      webhookSecret: config.webhookSecret,
    });

    if (this.client.isConfigured()) {
      this.markConfigured();
    } else {
      this.isConfigured = false;
      logger.warn('Shiprocket provider selected but SHIPROCKET_EMAIL/SHIPROCKET_PASSWORD not set');
    }
  }

  isEnabled() {
    return this.client.isConfigured();
  }

  verifyWebhookToken(headerToken) {
    return this.client.verifyWebhookToken(headerToken);
  }

  async checkServiceability(payload) {
    this.ensureConfigured();
    const addr = payload.address || payload.destination || {};
    const pickupPincode = payload.pickupPincode || this.config.pickupPincode;
    const deliveryPincode = addr.pincode || payload.deliveryPincode;

    if (!pickupPincode || !deliveryPincode) {
      throw AppError.validation('Pickup and delivery pincodes are required for serviceability check');
    }

    const result = await this.client.checkServiceability({
      pickupPincode,
      deliveryPincode,
      weightKg: payload.weightKg ?? this.config.defaultWeightKg ?? 0.5,
      cod: payload.paymentMethod === PAYMENT_METHOD.COD || payload.cod === true,
    });

    if (!result.serviceable) {
      throw AppError.conflict('Delivery pincode is not serviceable via Shiprocket', [
        { field: 'pincode', message: 'Pincode not serviceable' },
      ]);
    }

    return result;
  }

  async createShipment(payload = {}) {
    this.ensureConfigured();

    const {
      orderId,
      orderNumber,
      address = {},
      items = [],
      paymentMethod = PAYMENT_METHOD.COD,
      subtotal = 0,
      weightKg = this.config.defaultWeightKg ?? 0.5,
      dimensions = this.config.defaultDimensions || { length: 10, breadth: 10, height: 10 },
      pickupPincode = this.config.pickupPincode,
    } = payload;

    if (!address.pincode) {
      throw AppError.validation('Shipping address pincode is required');
    }

    await this.checkServiceability({
      address,
      pickupPincode,
      paymentMethod,
      weightKg,
    });

    const orderDate = new Date().toISOString().slice(0, 10);
    const paymentMode = paymentMethod === PAYMENT_METHOD.COD ? 'COD' : 'Prepaid';
    const customerName = address.name || 'Customer';
    const [firstName, ...rest] = customerName.split(' ');
    const lastName = rest.join(' ') || firstName;

    const orderItems = (items.length ? items : [{ name: 'Order Item', sku: orderNumber, quantity: 1, unitPrice: subtotal }])
      .map((item) => ({
        name: String(item.name || item.title || 'Product').slice(0, 200),
        sku: String(item.sku || item.productId || orderNumber).slice(0, 50),
        units: Number(item.quantity) || 1,
        selling_price: Number(item.unitPrice ?? item.price ?? 0),
        discount: 0,
        tax: 0,
        hsn: item.hsn || 441122,
      }));

    const computedSubtotal = orderItems.reduce(
      (sum, item) => sum + item.selling_price * item.units,
      0
    );

    const createBody = {
      order_id: String(orderNumber || orderId),
      order_date: orderDate,
      pickup_location: this.config.pickupLocation || 'Primary',
      channel_id: this.config.channelId || undefined,
      comment: `Mithilakart order ${orderNumber}`,
      billing_customer_name: firstName,
      billing_last_name: lastName,
      billing_address: address.line1 || address.addressLine || '',
      billing_address_2: address.line2 || '',
      billing_city: address.city || '',
      billing_pincode: String(address.pincode),
      billing_state: address.state || '',
      billing_country: 'India',
      billing_email: address.email || 'customer@mithilakart.com',
      billing_phone: String(address.phone || '9999999999').replace(/\D/g, '').slice(-10),
      shipping_is_billing: true,
      order_items: orderItems,
      payment_method: paymentMode,
      shipping_charges: 0,
      sub_total: computedSubtotal || subtotal || 0,
      length: dimensions.length || 10,
      breadth: dimensions.breadth || 10,
      height: dimensions.height || 10,
      weight: weightKg,
    };

    const created = await this.client.createAdhocOrder(createBody);
    const shipmentId = created?.payload?.shipment_id || created?.shipment_id;
    const shiprocketOrderId = created?.payload?.order_id || created?.order_id;

    if (!shipmentId) {
      throw AppError.internal('Shiprocket order created but shipment_id missing');
    }

    const awbResponse = await this.client.assignAwb({ shipmentId });
    const awb = awbResponse?.response?.data?.awb_code
      || awbResponse?.awb_code
      || awbResponse?.response?.awb_code;
    const courierName = awbResponse?.response?.data?.courier_name
      || awbResponse?.courier_name
      || 'Shiprocket Courier';

    let pickup = null;
    try {
      pickup = await this.client.generatePickup(shipmentId);
    } catch (error) {
      logger.warn({ err: error, shipmentId }, 'Shiprocket pickup scheduling failed');
    }

    let label = null;
    try {
      label = await this.client.generateLabel(shipmentId);
    } catch (error) {
      logger.warn({ err: error, shipmentId }, 'Shiprocket label generation failed');
    }

    const labelUrl = label?.label_url
      || label?.response?.label_url
      || label?.data?.label_url
      || null;

    return {
      provider: this.providerName,
      orderId: String(orderId),
      orderNumber,
      shiprocketOrderId,
      shipmentId,
      awb: awb || null,
      trackingId: awb || String(shipmentId),
      courierName,
      status: awb ? 'awb_assigned' : 'shipment_created',
      paymentMode,
      weightKg,
      destination: {
        city: address.city || null,
        pincode: address.pincode || null,
        state: address.state || null,
      },
      labelUrl,
      pickup,
      createdAt: new Date().toISOString(),
      checkpoints: [
        { status: 'shipment_created', at: new Date().toISOString(), note: 'Order pushed to Shiprocket' },
        ...(awb ? [{ status: 'awb_assigned', at: new Date().toISOString(), note: `AWB ${awb}` }] : []),
      ],
      raw: { create: created, awb: awbResponse },
    };
  }

  async trackShipment({ awb, trackingId, shipmentId }) {
    this.ensureConfigured();
    const code = awb || trackingId;
    if (!code) {
      throw AppError.validation('AWB or trackingId is required');
    }

    const tracked = await this.client.trackByAwb(code);
    const trackData = tracked?.tracking_data || tracked?.data || tracked;
    const activities = trackData?.shipment_track_activities
      || trackData?.track_activities
      || [];

    const checkpoints = (Array.isArray(activities) ? activities : []).map((entry) => ({
      status: normalizeShiprocketStatus(entry.current_status || entry.activity || entry.status),
      at: entry.date || entry.updated_at || entry.created_at || new Date().toISOString(),
      note: entry.activity || entry.current_status || entry.status || '',
      location: entry.location || null,
    }));

    const latest = checkpoints[0] || {};
    const courierStatus = latest.status || normalizeShiprocketStatus(trackData?.shipment_status);

    return {
      provider: this.providerName,
      awb: code,
      shipmentId: shipmentId || trackData?.shipment_id || null,
      status: courierStatus || 'in_transit',
      mappedOrderStatus: mapShiprocketStatusToOrderStatus(courierStatus),
      rto: isRtoStatus(courierStatus),
      checkpoints,
      raw: tracked,
    };
  }

  async cancelShipment({ shipmentId, shiprocketOrderId, awb }) {
    this.ensureConfigured();

    if (shiprocketOrderId) {
      await this.client.cancelShipments([shiprocketOrderId]);
    } else if (awb) {
      await this.client.cancelShipments([awb]);
    } else if (shipmentId) {
      await this.client.cancelShipments([shipmentId]);
    } else {
      throw AppError.validation('shiprocketOrderId, awb, or shipmentId required to cancel');
    }

    return { cancelled: true, provider: this.providerName, shipmentId, awb, shiprocketOrderId };
  }

  /** When Shiprocket credentials are missing, fall back to mock AWB for local dev only. */
  async createShipmentDevFallback(payload) {
    if (this.isConfigured()) {
      return this.createShipment(payload);
    }
    const mock = new BaseCourierShippingProvider('shiprocket_mock', 'Shiprocket (mock fallback)');
    mock.markConfigured();
    return mock.createShipment(payload);
  }
}

module.exports = { ShiprocketShippingProvider };
