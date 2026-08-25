/**
 * Production readiness audit (2026-08-25) — Shiprocket webhook authentication.
 *
 * Real, live-confirmed security gap: verifyWebhookToken() returned TRUE
 * (accept, unauthenticated) whenever SHIPROCKET_WEBHOOK_SECRET was unset —
 * which it currently is in .env (`# SHIPROCKET_WEBHOOK_SECRET=`, commented
 * out). Anyone who discovered the webhook URL and a real AWB could POST a
 * forged "delivered" status and have CourierShipmentService.handleWebhookPayload
 * process it as genuine — falsely marking a real customer's order delivered.
 *
 * Fixed to fail CLOSED: no secret configured means every webhook is rejected,
 * not silently trusted.
 */
const { ShiprocketClient } = require('../../../src/core/providers/shipping/ShiprocketClient');

describe('production-readiness — ShiprocketClient.verifyWebhookToken', () => {
  it('rejects everything when no webhook secret is configured (fails closed, not open)', () => {
    const client = new ShiprocketClient({ email: 'a@b.com', password: 'x', webhookSecret: null });

    // This is the exact live misconfiguration: a real AWB, a plausible
    // header, but no secret on the server side. Before the fix this returned
    // true and the forged payload would have been processed.
    expect(client.verifyWebhookToken('anything-an-attacker-sends')).toBe(false);
    expect(client.verifyWebhookToken('')).toBe(false);
    expect(client.verifyWebhookToken(undefined)).toBe(false);
  });

  it('accepts only the exact configured secret once one is set', () => {
    const client = new ShiprocketClient({ email: 'a@b.com', password: 'x', webhookSecret: 'real-secret-123' });

    expect(client.verifyWebhookToken('real-secret-123')).toBe(true);
    expect(client.verifyWebhookToken('wrong-guess')).toBe(false);
    expect(client.verifyWebhookToken('')).toBe(false);
  });

  it('is not fooled by a numeric-looking header vs a numeric-looking secret of different types', () => {
    const client = new ShiprocketClient({ email: 'a@b.com', password: 'x', webhookSecret: 123 });
    expect(client.verifyWebhookToken('123')).toBe(true);
    expect(client.verifyWebhookToken(123)).toBe(true);
  });
});
