const {
  mapShiprocketStatusToOrderStatus,
  normalizeShiprocketStatus,
  isRtoStatus,
} = require('../../../src/core/providers/shipping/shiprocketStatusMap');
const { ORDER_STATUS } = require('../../../src/constants/commerce');

describe('shiprocketStatusMap', () => {
  it('maps delivered status to internal delivered', () => {
    expect(mapShiprocketStatusToOrderStatus('DELIVERED')).toBe(ORDER_STATUS.DELIVERED);
  });

  it('maps in transit to shipped', () => {
    expect(mapShiprocketStatusToOrderStatus('In Transit')).toBe(ORDER_STATUS.SHIPPED);
  });

  it('maps out for delivery correctly', () => {
    expect(mapShiprocketStatusToOrderStatus('OUT FOR DELIVERY')).toBe(ORDER_STATUS.OUT_FOR_DELIVERY);
  });

  it('detects RTO statuses', () => {
    expect(isRtoStatus('RTO Initiated')).toBe(true);
    expect(normalizeShiprocketStatus('RTO_INITIATED')).toBe('rto initiated');
  });
});
