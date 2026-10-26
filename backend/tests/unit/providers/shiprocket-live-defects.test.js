const {
  ShiprocketShippingProvider,
} = require('../../../src/core/providers/shipping/ShiprocketShippingProvider');
const { ShiprocketClient } = require('../../../src/core/providers/shipping/ShiprocketClient');

/**
 * REGRESSION — three defects found by calling the LIVE Shiprocket API during
 * CR-002 Phase 14 verification. Each was invisible to the existing test suite
 * because nothing exercised the real endpoints.
 *
 *  1. A fabricated customer phone number was sent when the address phone was
 *     unusable (18 real orders in production would have shipped this way).
 *  2. generateLabel used GET; the route is POST-only (live HTTP 405).
 *  3. cancel used shipment ids against the order-cancel endpoint (live
 *     "Order Id does not exist"), so cancellations silently did not cancel.
 */
describe('Shiprocket — customer phone is never fabricated', () => {
  function provider() {
    const p = new ShiprocketShippingProvider({ email: 'a@b.com', password: 'p' });
    return p;
  }

  it('passes through a valid 10-digit number', () => {
    expect(provider()._customerPhone({ phone: '9835461270' })).toBe('9835461270');
  });

  it('normalises formatting and country code rather than rejecting', () => {
    expect(provider()._customerPhone({ phone: '+91 98354-61270' })).toBe('9835461270');
  });

  it('refuses to book a shipment when the phone is missing', () => {
    // The old code silently substituted '9876543210' — a stranger's number.
    expect(() => provider()._customerPhone({})).toThrow(/valid 10-digit customer phone/i);
  });

  it('refuses a malformed number instead of inventing one', () => {
    expect(() => provider()._customerPhone({ phone: '12345' })).toThrow(/valid 10-digit customer phone/i);
    // Indian mobiles start 6-9; a landline-style number is not contactable by the courier.
    expect(() => provider()._customerPhone({ phone: '1234567890' })).toThrow(/valid 10-digit/i);
  });

  it('never returns the old hardcoded fallback for any bad input', () => {
    for (const phone of [undefined, null, '', '000', 'abcdefghij', '1111111111']) {
      let result = null;
      try { result = provider()._customerPhone({ phone }); } catch { /* expected */ }
      expect(result).not.toBe('9876543210');
    }
  });
});

describe('Shiprocket client — endpoint/method correctness', () => {
  const originalFetch = global.fetch;
  afterEach(() => { global.fetch = originalFetch; });

  function mockClient() {
    const calls = [];
    global.fetch = jest.fn(async (url, options) => {
      calls.push({ url, method: options?.method, body: options?.body ? JSON.parse(options.body) : null });
      return { ok: true, text: async () => JSON.stringify({ token: 'tok', status_code: 200 }) };
    });
    return { client: new ShiprocketClient({ email: 'a@b.com', password: 'p' }), calls };
  }

  it('generates labels with POST and a body, not GET with a query string', async () => {
    const { client, calls } = mockClient();
    await client.generateLabel(1522853854);

    const call = calls.find((c) => c.url.includes('/courier/generate/label'));
    expect(call.method).toBe('POST');
    expect(call.body).toEqual({ shipment_id: [1522853854] });
    // The live API returns 405 for GET; a query string here means the bug is back.
    expect(call.url).not.toContain('?');
  });

  it('cancels orders by ORDER id on the order-cancel endpoint', async () => {
    const { client, calls } = mockClient();
    await client.cancelShipments([1526633568]);

    const call = calls.find((c) => c.url.includes('/orders/cancel'));
    expect(call.method).toBe('POST');
    expect(call.body).toEqual({ ids: [1526633568] });
  });

  it('cancels by AWB on a different endpoint', async () => {
    const { client, calls } = mockClient();
    await client.cancelByAwb(['AWB123']);

    const call = calls.find((c) => c.url.includes('/cancel/shipment/awbs'));
    expect(call).toBeTruthy();
    expect(call.method).toBe('POST');
    expect(call.body).toEqual({ awbs: ['AWB123'] });
  });
});

describe('Shiprocket provider — cancellation routes the right id to the right endpoint', () => {
  function provider() {
    const p = new ShiprocketShippingProvider({ email: 'a@b.com', password: 'p' });
    p.client.cancelShipments = jest.fn().mockResolvedValue({ status_code: 200 });
    p.client.cancelByAwb = jest.fn().mockResolvedValue({ status_code: 200 });
    return p;
  }

  it('uses the order endpoint when a Shiprocket order id is known', async () => {
    const p = provider();
    await p.cancelShipment({ shiprocketOrderId: 1526633568, shipmentId: 1522853854 });

    expect(p.client.cancelShipments).toHaveBeenCalledWith([1526633568]);
    expect(p.client.cancelByAwb).not.toHaveBeenCalled();
  });

  it('uses the AWB endpoint when only an AWB is known', async () => {
    const p = provider();
    await p.cancelShipment({ awb: 'AWB123' });

    expect(p.client.cancelByAwb).toHaveBeenCalledWith(['AWB123']);
    // Sending an AWB to /orders/cancel is what silently failed to cancel.
    expect(p.client.cancelShipments).not.toHaveBeenCalled();
  });

  it('refuses to pretend a shipmentId alone can cancel anything', async () => {
    const p = provider();

    await expect(p.cancelShipment({ shipmentId: 1522853854 }))
      .rejects.toThrow(/shipmentId alone cannot be cancelled/);

    // Critically: it must NOT report success while nothing was cancelled.
    expect(p.client.cancelShipments).not.toHaveBeenCalled();
    expect(p.client.cancelByAwb).not.toHaveBeenCalled();
  });
});
