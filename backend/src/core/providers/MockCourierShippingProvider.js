const crypto = require('crypto');
const { ShippingProvider } = require('./index');

/**
 * Courier-based shipping for non-quick (e-commerce) orders.
 * Creates a tracking ID + AWB without an external courier API.
 */
class MockCourierShippingProvider extends ShippingProvider {
  constructor() {
    super();
    this.providerName = 'courier_mock';
    this.displayName = 'Mithilakart Courier';
    this.markConfigured();
  }

  isEnabled() {
    return true;
  }

  async createShipment({ orderId, orderNumber, address = {}, weightKg = 0.5 }) {
    const awb = `MKC${Date.now().toString().slice(-8)}${crypto.randomInt(10, 99)}`;
    const trackingId = `TRK-${awb}`;

    return {
      provider: this.providerName,
      orderId: String(orderId),
      orderNumber,
      awb,
      trackingId,
      courierName: 'Mithilakart Courier',
      status: 'shipment_created',
      estimatedDays: 3,
      weightKg,
      labelUrl: `https://mock.mithilakart.local/labels/${awb}.pdf`,
      destination: {
        city: address.city || null,
        pincode: address.pincode || null,
      },
      createdAt: new Date().toISOString(),
    };
  }

  async checkServiceability({ address = {}, deliveryPincode, paymentMethod, cod, weightKg = 0.5 } = {}) {
    const pincode = address.pincode || deliveryPincode;
    return {
      serviceable: Boolean(pincode && /^\d{6}$/.test(String(pincode))),
      provider: this.providerName,
      weightKg,
      cod: cod === true || paymentMethod === 'cod',
      couriers: [{ name: 'Mithilakart Courier', estimatedDays: 3 }],
    };
  }

  async trackShipment({ trackingId, awb }) {
    return {
      provider: this.providerName,
      trackingId: trackingId || null,
      awb: awb || null,
      status: 'in_transit',
      checkpoints: [
        { status: 'shipment_created', at: new Date().toISOString() },
        { status: 'in_transit', at: new Date().toISOString() },
      ],
    };
  }

  async cancelShipment({ trackingId }) {
    return { cancelled: true, trackingId };
  }
}

module.exports = {
  MockCourierShippingProvider,
};
