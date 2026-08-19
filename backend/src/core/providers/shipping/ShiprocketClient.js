const { logger } = require('../../../utils/logger');

const TOKEN_TTL_MS = 9 * 24 * 60 * 60 * 1000; // refresh before Shiprocket 10-day expiry

class ShiprocketClient {
  constructor({
    email,
    password,
    apiBaseUrl = 'https://apiv2.shiprocket.in',
    webhookSecret = null,
  } = {}) {
    this.email = email;
    this.password = password;
    this.apiBaseUrl = String(apiBaseUrl || 'https://apiv2.shiprocket.in').replace(/\/$/, '');
    this.webhookSecret = webhookSecret;
    this._token = null;
    this._tokenExpiresAt = 0;
  }

  isConfigured() {
    return Boolean(this.email && this.password);
  }

  verifyWebhookToken(headerToken) {
    if (!this.webhookSecret) return true;
    return String(headerToken || '') === String(this.webhookSecret);
  }

  async getToken(forceRefresh = false) {
    if (!this.isConfigured()) {
      throw new Error('Shiprocket credentials are not configured');
    }

    if (!forceRefresh && this._token && Date.now() < this._tokenExpiresAt) {
      return this._token;
    }

    const response = await this._request('/v1/external/auth/login', {
      method: 'POST',
      auth: false,
      body: { email: this.email, password: this.password },
    });

    const token = response?.token;
    if (!token) {
      throw new Error('Shiprocket auth failed — no token returned');
    }

    this._token = token;
    this._tokenExpiresAt = Date.now() + TOKEN_TTL_MS;
    return token;
  }

  async checkServiceability({
    pickupPincode,
    deliveryPincode,
    weightKg = 0.5,
    cod = false,
  }) {
    const query = new URLSearchParams({
      pickup_postcode: String(pickupPincode),
      delivery_postcode: String(deliveryPincode),
      weight: String(weightKg),
      cod: cod ? '1' : '0',
    });

    const data = await this._authedRequest(`/v1/external/courier/serviceability/?${query.toString()}`, {
      method: 'GET',
    });

    const companies = data?.data?.available_courier_companies
      || data?.data?.available_courier_companies_with_rates
      || [];

    return {
      serviceable: Array.isArray(companies) ? companies.length > 0 : Boolean(data?.status),
      couriers: companies,
      raw: data,
    };
  }

  /**
   * Pickup locations registered on the account.
   *
   * `pickup_location` in an ad-hoc order is a NICKNAME that must already exist
   * on the account — Shiprocket rejects the order otherwise. Reading the real
   * list is what lets us fail with "you configured X, the account has Y and Z"
   * instead of a generic rejection.
   *
   * Cached for the process lifetime: pickup locations change at operator pace,
   * not per order, and this sits on the fulfillment hot path.
   */
  async listPickupLocations({ forceRefresh = false } = {}) {
    if (!forceRefresh && this._pickupLocations) return this._pickupLocations;

    const response = await this._authedRequest('/v1/external/settings/company/pickup');
    const raw = response?.data?.shipping_address || response?.data || [];
    const list = Array.isArray(raw) ? raw : [];

    this._pickupLocations = list.map((entry) => ({
      nickname: entry.pickup_location,
      pincode: entry.pin_code ? String(entry.pin_code) : null,
      city: entry.city || null,
      // Shiprocket marks a verified/usable address with status 1.
      verified: Number(entry.status) === 1,
    }));

    return this._pickupLocations;
  }

  async createAdhocOrder(payload) {
    return this._authedRequest('/v1/external/orders/create/adhoc', {
      method: 'POST',
      body: payload,
    });
  }

  async assignAwb({ shipmentId, courierId = null }) {
    const body = { shipment_id: shipmentId };
    if (courierId) body.courier_id = courierId;
    return this._authedRequest('/v1/external/courier/assign/awb', {
      method: 'POST',
      body,
    });
  }

  async generatePickup(shipmentIds) {
    const ids = Array.isArray(shipmentIds) ? shipmentIds : [shipmentIds];
    return this._authedRequest('/v1/external/courier/generate/pickup', {
      method: 'POST',
      body: { shipment_id: ids },
    });
  }

  async trackByAwb(awb) {
    return this._authedRequest(`/v1/external/courier/track/awb/${encodeURIComponent(awb)}`, {
      method: 'GET',
    });
  }

  /**
   * Cancels by Shiprocket ORDER id.
   *
   * Verified against the live API: passing a shipment_id here is rejected with
   * "Order Id does not exist". The two id spaces are not interchangeable, and
   * mixing them up means a Mithilakart cancellation leaves the parcel live at
   * the courier. Use cancelByAwb() once an AWB exists.
   */
  async cancelShipments(orderIds) {
    const list = Array.isArray(orderIds) ? orderIds : [orderIds];
    return this._authedRequest('/v1/external/orders/cancel', {
      method: 'POST',
      body: { ids: list },
    });
  }

  /** Cancels an already-manifested shipment by AWB — a different endpoint. */
  async cancelByAwb(awbs) {
    const list = Array.isArray(awbs) ? awbs : [awbs];
    return this._authedRequest('/v1/external/orders/cancel/shipment/awbs', {
      method: 'POST',
      body: { awbs: list },
    });
  }

  /**
   * Shiprocket requires POST here. The previous GET returned HTTP 405
   * ("The GET method is not supported for this route") on every call, so label
   * generation could never succeed — it was silently swallowed by the caller's
   * try/catch and every shipment went out without a label URL.
   */
  async generateLabel(shipmentIds) {
    const list = Array.isArray(shipmentIds) ? shipmentIds : [shipmentIds];
    return this._authedRequest('/v1/external/courier/generate/label', {
      method: 'POST',
      body: { shipment_id: list },
    });
  }

  async _authedRequest(path, options = {}) {
    const token = await this.getToken();
    return this._request(path, { ...options, token });
  }

  async _request(path, { method = 'GET', body = null, auth = true, token = null } = {}) {
    const url = `${this.apiBaseUrl}${path.startsWith('/') ? path : `/${path}`}`;
    const headers = {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    };

    if (auth) {
      headers.Authorization = `Bearer ${token || (await this.getToken())}`;
    }

    const response = await fetch(url, {
      method,
      headers,
      body: body != null ? JSON.stringify(body) : undefined,
    });

    const text = await response.text();
    let data = {};
    if (text) {
      try {
        data = JSON.parse(text);
      } catch {
        data = { raw: text };
      }
    }

    if (!response.ok) {
      const message = data?.message || data?.error || response.statusText || 'Shiprocket API error';
      logger.warn({ status: response.status, path, message }, 'Shiprocket API request failed');
      const error = new Error(message);
      error.statusCode = response.status;
      error.response = data;
      throw error;
    }

    return data;
  }
}

module.exports = { ShiprocketClient };
