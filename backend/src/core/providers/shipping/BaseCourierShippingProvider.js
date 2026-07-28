const crypto = require('crypto');
const { ShippingProvider } = require('../index');

/**
 * Base class for courier adapters (Shiprocket, Delhivery, Blue Dart, DTDC, XpressBees).
 * Subclasses override providerName and optionally call external APIs.
 */
class BaseCourierShippingProvider extends ShippingProvider {
  constructor(providerName, displayName) {
    super();
    this.providerName = providerName;
    this.displayName = displayName;
    this.markConfigured();
  }

  isEnabled() {
    return true;
  }

  _generateAwb(prefix = 'MKC') {
    return `${prefix}${Date.now().toString().slice(-8)}${crypto.randomInt(10, 99)}`;
  }

  async createShipment({ orderId, orderNumber, address = {}, weightKg = 0.5 }) {
    const awb = this._generateAwb(this.providerName.slice(0, 3).toUpperCase());
    return {
      provider: this.providerName,
      orderId: String(orderId),
      orderNumber,
      awb,
      trackingId: `TRK-${awb}`,
      courierName: this.displayName,
      status: 'shipment_created',
      estimatedDays: 3,
      weightKg,
      destination: {
        city: address.city || null,
        pincode: address.pincode || null,
      },
      createdAt: new Date().toISOString(),
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
    return { cancelled: true, trackingId, provider: this.providerName };
  }
}

module.exports = { BaseCourierShippingProvider };
