const {
  ShiprocketShippingProvider,
} = require('../../../src/core/providers/shipping/ShiprocketShippingProvider');

/**
 * REGRESSION — CR-002 Failure 3a.
 * See docs/cr-002/REAL_FLOW_FAILURE_ANALYSIS.md.
 *
 * `.env` carried SHIPROCKET_PICKUP_LOCATION=Primary while the live account only
 * had "BhaveshTailor", "AtharvaTailor_2113f4" and "MayurTailor". Shiprocket
 * rejected every ad-hoc order. Because the provider blindly sent
 * `this.config.pickupLocation || 'Primary'` and never checked, a one-line config
 * typo surfaced as 79 consecutive generic COURIER_UNAVAILABLE failures with
 * nothing in the logs pointing at the cause.
 *
 * These tests lock in that a pickup-location mismatch is detected, named, and
 * reported as a distinct, actionable operator error.
 */
const ACCOUNT_LOCATIONS = [
  { nickname: 'BhaveshTailor', pincode: '452001', city: 'Indore', verified: false },
  { nickname: 'MayurTailor', pincode: '452001', city: 'Indore', verified: true },
];

function makeProvider(pickupLocation, { locations = ACCOUNT_LOCATIONS, listError = null } = {}) {
  const provider = new ShiprocketShippingProvider({
    email: 'api@test.com',
    password: 'secret',
    pickupLocation,
  });

  provider.client.listPickupLocations = listError
    ? jest.fn().mockRejectedValue(listError)
    : jest.fn().mockResolvedValue(locations);

  return provider;
}

describe('ShiprocketShippingProvider pickup location resolution', () => {
  it('accepts a nickname that exists on the account', async () => {
    const provider = makeProvider('MayurTailor');
    await expect(provider.resolvePickupLocation())
      .resolves.toMatchObject({ nickname: 'MayurTailor', pincode: '452001' });
  });

  it('matches case-insensitively rather than failing on capitalisation', async () => {
    const provider = makeProvider('mayurtailor');
    // Returns the account's canonical spelling, which is what Shiprocket expects.
    await expect(provider.resolvePickupLocation())
      .resolves.toMatchObject({ nickname: 'MayurTailor' });
  });

  it('rejects the exact production misconfiguration and names the valid options', async () => {
    const provider = makeProvider('Primary');

    await expect(provider.resolvePickupLocation()).rejects.toMatchObject({
      code: 'COURIER_MISCONFIGURED',
    });

    // The message must be actionable on its own — that is the whole point.
    await expect(provider.resolvePickupLocation()).rejects.toThrow(/"Primary" does not exist/);
    await expect(provider.resolvePickupLocation()).rejects.toThrow(/MayurTailor/);
    await expect(provider.resolvePickupLocation()).rejects.toThrow(/SHIPROCKET_PICKUP_LOCATION/);
  });

  it('flags unverified pickup addresses in the guidance', async () => {
    const provider = makeProvider('Primary');
    await expect(provider.resolvePickupLocation())
      .rejects.toThrow(/"BhaveshTailor" \(unverified\)/);
  });

  it('fails clearly when the account has no pickup address at all', async () => {
    const provider = makeProvider('Primary', { locations: [] });

    await expect(provider.resolvePickupLocation()).rejects.toMatchObject({
      code: 'COURIER_MISCONFIGURED',
    });
    await expect(provider.resolvePickupLocation()).rejects.toThrow(/no pickup locations registered/);
  });

  it('treats an unset pickup location as misconfigured, not as "Primary"', async () => {
    const provider = makeProvider(null);
    await expect(provider.resolvePickupLocation()).rejects.toThrow(/\(not set\)/);
  });

  it('does not block a shipment when the settings endpoint is briefly unreadable', async () => {
    // A transient settings outage must not take down fulfillment; fall back to
    // the configured value and let Shiprocket itself arbitrate.
    const provider = makeProvider('MayurTailor', { listError: new Error('502 Bad Gateway') });
    await expect(provider.resolvePickupLocation())
      .resolves.toMatchObject({ nickname: 'MayurTailor' });
  });
});

describe('ShiprocketClient.listPickupLocations', () => {
  const originalFetch = global.fetch;
  afterEach(() => { global.fetch = originalFetch; });

  it('normalises the Shiprocket settings payload and caches it', async () => {
    const { ShiprocketClient } = require('../../../src/core/providers/shipping/ShiprocketClient');

    global.fetch = jest.fn()
      .mockResolvedValueOnce({ ok: true, text: async () => JSON.stringify({ token: 'tok' }) })
      .mockResolvedValueOnce({
        ok: true,
        text: async () => JSON.stringify({
          data: {
            shipping_address: [
              { pickup_location: 'MayurTailor', pin_code: 452001, city: 'Indore', status: 1 },
              { pickup_location: 'BhaveshTailor', pin_code: 452001, city: 'Indore', status: 2 },
            ],
          },
        }),
      });

    const client = new ShiprocketClient({ email: 'a@b.com', password: 'p' });

    const first = await client.listPickupLocations();
    expect(first).toEqual([
      { nickname: 'MayurTailor', pincode: '452001', city: 'Indore', verified: true },
      { nickname: 'BhaveshTailor', pincode: '452001', city: 'Indore', verified: false },
    ]);

    // Cached — pickup addresses change at operator pace, and this sits on the
    // fulfillment hot path.
    const second = await client.listPickupLocations();
    expect(second).toBe(first);
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });
});
