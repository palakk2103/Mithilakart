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
});
