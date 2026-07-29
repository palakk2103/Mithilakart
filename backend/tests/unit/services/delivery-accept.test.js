jest.mock('../../../src/database', () => ({
  withTransaction: (callback) => callback(null),
}));

const { DeliveryOrderService } = require('../../../src/services/delivery/DeliveryOrderService');
const { ORDER_STATUS } = require('../../../src/constants/commerce');
const { AppError } = require('../../../src/utils/AppError');

describe('DeliveryOrderService.acceptOrder', () => {
  const partnerId = 'partner1';
  const orderId = 'order1';

  function buildService(overrides = {}) {
    const deliveryAssignmentRepository = {
      findByOrderId: jest.fn(),
      create: jest.fn(),
      acceptByOrderId: jest.fn(),
      ...overrides.deliveryAssignmentRepository,
    };

    const deliveryPartnerRepository = {
      findById: jest.fn().mockResolvedValue({ _id: partnerId, isOnline: true }),
      ...overrides.deliveryPartnerRepository,
    };

    const deliveryOtpService = {
      createOtp: jest.fn().mockResolvedValue('1234'),
    };

    const orderRepository = {
      findById: jest.fn().mockResolvedValue({
        _id: orderId,
        status: ORDER_STATUS.PACKED,
      }),
    };

    return {
      service: new DeliveryOrderService({
        deliveryAssignmentRepository,
        deliveryPartnerRepository,
        deliveryEarningRepository: {},
        deliveryOtpService,
        orderRepository,
        orderTrackingRepository: { createInitial: jest.fn() },
        orderStatusHistoryRepository: { addTransition: jest.fn() },
      }),
      deliveryAssignmentRepository,
    };
  }

  it('uses atomic accept and returns conflict when order already taken', async () => {
    const { service, deliveryAssignmentRepository } = buildService({
      deliveryAssignmentRepository: {
        findByOrderId: jest.fn().mockResolvedValue({ _id: 'assign1', orderId }),
        acceptByOrderId: jest.fn().mockResolvedValue(null),
      },
    });

    await expect(service.acceptOrder(partnerId, orderId)).rejects.toMatchObject({
      statusCode: AppError.conflict().statusCode,
    });

    expect(deliveryAssignmentRepository.acceptByOrderId).toHaveBeenCalledWith(orderId, partnerId, null);
  });

  it('returns assignment when atomic accept succeeds', async () => {
    const assignment = { _id: 'assign1', orderId, partnerId, status: 'accepted' };
    const { service } = buildService({
      deliveryAssignmentRepository: {
        findByOrderId: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockResolvedValue({ _id: 'assign1', orderId }),
        acceptByOrderId: jest.fn().mockResolvedValue(assignment),
      },
    });

    const result = await service.acceptOrder(partnerId, orderId);
    expect(result.assignment).toEqual(assignment);
    expect(result.pickupOtp).toBe('1234');
  });
});
