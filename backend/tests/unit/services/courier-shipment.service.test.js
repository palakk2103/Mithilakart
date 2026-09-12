jest.mock('../../../src/database', () => ({
  withTransaction: (callback) => callback(null),
}));

const { CourierShipmentService } = require('../../../src/services/shipping/CourierShipmentService');
const { ORDER_STATUS } = require('../../../src/constants/commerce');

describe('CourierShipmentService webhook', () => {
  it('updates order shipment and status from Shiprocket webhook payload', async () => {
    const order = {
      _id: 'order1',
      status: ORDER_STATUS.PLACED,
      shipment: { awb: 'AWB123' },
    };

    const orderRepository = {
      findOne: jest.fn().mockResolvedValue(order),
      updateById: jest.fn().mockResolvedValue(true),
      updateStatus: jest.fn().mockResolvedValue(true),
      findById: jest.fn().mockResolvedValue({ ...order, status: ORDER_STATUS.SHIPPED }),
    };

    const orderTrackingRepository = { createInitial: jest.fn().mockResolvedValue(true) };
    const orderStatusHistoryRepository = { addTransition: jest.fn().mockResolvedValue(true) };

    const service = new CourierShipmentService({
      orderRepository,
      orderItemRepository: {},
      orderTrackingRepository,
      orderStatusHistoryRepository,
      productRepository: {},
      sellerRepository: {},
    });

    const result = await service.handleWebhookPayload({
      awb: 'AWB123',
      current_status: 'IN TRANSIT',
    });

    expect(result.handled).toBe(true);
    expect(orderRepository.updateById).toHaveBeenCalled();
    expect(orderRepository.updateStatus).toHaveBeenCalledWith('order1', ORDER_STATUS.SHIPPED);
  });

  it('Requirement 6: Webhook Idempotency & Checkpoint Deduplication on replay', async () => {
    const timestamp = '2026-09-09T10:00:00.000Z';
    const existingCheckpoints = [
      { status: 'in_transit', at: timestamp, note: 'IN TRANSIT' },
    ];
    const order = {
      _id: 'order1',
      status: ORDER_STATUS.SHIPPED,
      shipment: { awb: 'AWB123', checkpoints: existingCheckpoints },
    };

    const orderRepository = {
      findOne: jest.fn().mockResolvedValue(order),
      updateById: jest.fn().mockResolvedValue(true),
      updateStatus: jest.fn().mockResolvedValue(true),
    };

    const service = new CourierShipmentService({
      orderRepository,
      orderItemRepository: {},
      orderTrackingRepository: { createInitial: jest.fn() },
      orderStatusHistoryRepository: { addTransition: jest.fn() },
      productRepository: {},
      sellerRepository: {},
    });

    // Send identical duplicate webhook
    const result = await service.handleWebhookPayload({
      awb: 'AWB123',
      current_status: 'IN TRANSIT',
      current_timestamp: timestamp,
    });

    expect(result.handled).toBe(true);
    expect(result.duplicate).toBe(true);
    // Order was already SHIPPED, so no redundant status update occurs
    expect(orderRepository.updateStatus).not.toHaveBeenCalled();

    // Check that checkpoints array was not duplicated
    const updateCall = orderRepository.updateById.mock.calls[0][1];
    expect(updateCall.shipment.checkpoints).toHaveLength(1);
  });

  it('Requirement 6: reconcilePendingShipments syncs pending in-transit orders', async () => {
    const order1 = { _id: 'ord1', status: 'shipped', shipment: { awb: 'AWB-101', trackingId: 'TRK-101' } };
    const order2 = { _id: 'ord2', status: 'out_for_delivery', shipment: { awb: 'AWB-102', trackingId: 'TRK-102' } };

    const orderRepository = {
      find: jest.fn().mockResolvedValue([order1, order2]),
      updateById: jest.fn().mockResolvedValue(true),
      updateStatus: jest.fn().mockResolvedValue(true),
      findById: jest.fn().mockImplementation((id) => (id === 'ord1' ? order1 : order2)),
    };

    const service = new CourierShipmentService({
      orderRepository,
      orderItemRepository: {},
      orderTrackingRepository: { createInitial: jest.fn() },
      orderStatusHistoryRepository: { addTransition: jest.fn() },
      productRepository: {},
      sellerRepository: {},
    });

    // Mock syncTrackingForOrder
    service.syncTrackingForOrder = jest.fn().mockResolvedValue({ synced: true });

    const result = await service.reconcilePendingShipments(10);
    expect(result.reconciledCount).toBe(2);
    expect(service.syncTrackingForOrder).toHaveBeenCalledTimes(2);
  });
});
