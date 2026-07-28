const request = require('supertest');
const { createIntegrationApp } = require('../../helpers/integrationHarness');
const { CourierShipmentService } = require('../../../src/services/shipping/CourierShipmentService');

describe('shipping serviceability (mock provider)', () => {
  let app;

  beforeAll(async () => {
    app = await createIntegrationApp();
  });

  beforeEach(() => {
    jest.spyOn(CourierShipmentService.prototype, 'handleWebhookPayload').mockResolvedValue({
      handled: false,
      awb: 'UNKNOWN-AWB',
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('GET /api/v1/shipping/serviceability returns serviceable for valid pincode', async () => {
    const response = await request(app)
      .get('/api/v1/shipping/serviceability')
      .query({ pincode: '110001' });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.serviceable).toBe(true);
    expect(response.body.data.provider).toBe('courier_mock');
  });

  it('GET /api/v1/shipping/serviceability rejects invalid pincode format', async () => {
    const response = await request(app)
      .get('/api/v1/shipping/serviceability')
      .query({ pincode: '1100' });

    expect(response.status).toBe(422);
    expect(response.body.success).toBe(false);
  });

  it('POST /api/v1/shipping/webhooks/shiprocket accepts mock webhook payload', async () => {
    const response = await request(app)
      .post('/api/v1/shipping/webhooks/shiprocket')
      .send({ awb: 'UNKNOWN-AWB', current_status: 'IN TRANSIT' });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.handled).toBe(false);
  });
});
