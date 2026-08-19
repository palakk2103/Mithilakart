/**
 * CR-002 P10 — realtime fanout authorisation.
 *
 * The central property under test is that each audience gets its OWN
 * projection: a customer must never learn which seller declined, and a seller
 * must never see another seller's offer.
 */
const {
  registerFulfillmentFanout, ROOM_ADMIN, customerView, adminView, CUSTOMER_MESSAGE,
} = require('../../../src/realtime/fulfillmentFanout');
const { eventBus } = require('../../../src/events/EventBus');
const { FULFILLMENT_EVENTS, DELIVERY_EVENTS } = require('../../../src/events/eventTypes');

/** Records every emit per room so leaks are directly assertable. */
function fakeIo() {
  const emits = [];
  return {
    emits,
    to: (room) => ({
      emit: (event, payload) => emits.push({ room, event, payload }),
    }),
    forRoom: (room) => emits.filter((e) => e.room === room),
    forEvent: (event) => emits.filter((e) => e.event === event),
  };
}

const rooms = {
  roomOrder: (id) => `order:${id}`,
  roomSeller: (id) => `seller:${id}`,
  roomDelivery: (id) => `delivery:${id}`,
};

function setup() {
  const io = fakeIo();
  const unsubs = registerFulfillmentFanout(io, rooms, []);
  return { io, stop: () => unsubs.forEach((fn) => fn()) };
}

const basePayload = {
  orderId: 'order-1',
  orderNumber: 'MK-1',
  fulfillmentId: 'ful-1',
  traceId: 'trace-abc',
  sellerId: 'seller-1',
  attemptId: 'attempt-1',
};

describe('CR-002 P10 — fulfillment realtime fanout', () => {
  let ctx;

  beforeEach(() => { ctx = setup(); });
  afterEach(() => ctx.stop());

  describe('SELLER_ASSIGNED', () => {
    beforeEach(() => {
      eventBus.publish(FULFILLMENT_EVENTS.SELLER_ASSIGNED, {
        ...basePayload, state: 'seller_assigned', expiresAt: '2026-08-18T12:05:00.000Z',
        estimatedDeliveryMinutes: 20,
      });
    });

    it('gives the customer coarse progress only', () => {
      const [emit] = ctx.io.forRoom('order:order-1');

      expect(emit.event).toBe('fulfillment_update');
      expect(emit.payload.message).toBe(CUSTOMER_MESSAGE.seller_assigned);
      // The customer must not learn who is fulfilling.
      expect(emit.payload.sellerId).toBeUndefined();
      expect(emit.payload.attemptId).toBeUndefined();
      expect(emit.payload.traceId).toBeUndefined();
    });

    it('gives the offered seller the actionable offer', () => {
      const [emit] = ctx.io.forRoom('seller:seller-1');

      expect(emit.event).toBe('fulfillment_offer');
      expect(emit.payload.attemptId).toBe('attempt-1');
      expect(emit.payload.expiresAt).toBeTruthy();
    });

    it('sends nothing to any other seller', () => {
      expect(ctx.io.forRoom('seller:seller-2')).toHaveLength(0);
    });

    it('gives admin full diagnostic detail including the trace id', () => {
      const [emit] = ctx.io.forRoom(ROOM_ADMIN);

      expect(emit.payload.traceId).toBe('trace-abc');
      expect(emit.payload.sellerId).toBe('seller-1');
      expect(emit.payload.event).toBe(FULFILLMENT_EVENTS.SELLER_ASSIGNED);
    });
  });

  describe('SELLER_REJECTED — the key non-leak', () => {
    beforeEach(() => {
      eventBus.publish(FULFILLMENT_EVENTS.SELLER_REJECTED, {
        ...basePayload, state: 'searching', reason: 'out_of_stock',
      });
    });

    it('sends NOTHING to the customer', () => {
      // A rejection is internal. The customer keeps seeing "preparing" while
      // the engine works through candidates.
      expect(ctx.io.forRoom('order:order-1')).toHaveLength(0);
    });

    it('closes the offer for the rejecting seller only', () => {
      const [emit] = ctx.io.forRoom('seller:seller-1');
      expect(emit.event).toBe('offer_closed');
      expect(emit.payload.outcome).toBe('rejected');
    });

    it('distinguishes a timeout from a deliberate rejection', () => {
      ctx.stop();
      ctx = setup();
      eventBus.publish(FULFILLMENT_EVENTS.SELLER_REJECTED, {
        ...basePayload, reason: 'timeout',
      });

      expect(ctx.io.forRoom('seller:seller-1')[0].payload.outcome).toBe('expired');
    });

    it('still reports the rejection to admin', () => {
      expect(ctx.io.forRoom(ROOM_ADMIN)[0].payload.reason).toBe('out_of_stock');
    });
  });

  describe('SELLER_ACCEPTED', () => {
    it('notifies the customer and closes the seller offer', () => {
      eventBus.publish(FULFILLMENT_EVENTS.SELLER_ACCEPTED, {
        ...basePayload, state: 'seller_accepted',
      });

      expect(ctx.io.forRoom('order:order-1')[0].event).toBe('fulfillment_update');
      expect(ctx.io.forRoom('seller:seller-1')[0].payload.outcome).toBe('accepted');
      expect(ctx.io.forRoom(ROOM_ADMIN)).toHaveLength(1);
    });
  });

  describe('COURIER_FALLBACK', () => {
    it('tells the customer the REAL mode and clears the quick ETA', () => {
      eventBus.publish(FULFILLMENT_EVENTS.COURIER_FALLBACK, {
        ...basePayload, state: 'courier_assigned',
        estimatedDeliveryMinutes: 20, // stale quick value on the event
        fallbackLevel: 3, fallbackReason: 'NO_SELLER_AVAILABLE',
      });

      const [emit] = ctx.io.forRoom('order:order-1');

      expect(emit.payload.deliveryMode).toBe('standard');
      // A quick-commerce promise must not survive the downgrade.
      expect(emit.payload.estimatedDeliveryMinutes).toBeNull();
      // The internal reason is admin-only.
      expect(emit.payload.fallbackReason).toBeUndefined();
      expect(ctx.io.forRoom(ROOM_ADMIN)[0].payload.fallbackReason).toBe('NO_SELLER_AVAILABLE');
    });
  });

  describe('FULFILLMENT_FAILED', () => {
    it('gives the customer a safe message and admin the failure code', () => {
      eventBus.publish(FULFILLMENT_EVENTS.FAILED, {
        ...basePayload, state: 'failed', failureCode: 'COURIER_UNAVAILABLE',
      });

      const [customer] = ctx.io.forRoom('order:order-1');
      expect(customer.payload.message).toBe(CUSTOMER_MESSAGE.failed);
      expect(customer.payload.failureCode).toBeUndefined();

      expect(ctx.io.forRoom(ROOM_ADMIN)[0].payload.failureCode).toBe('COURIER_UNAVAILABLE');
    });
  });

  describe('DELIVERY_ACCEPTED', () => {
    it('notifies the customer, the assigned partner, and admin only', () => {
      eventBus.publish(DELIVERY_EVENTS.ASSIGNMENT_ACCEPTED, {
        ...basePayload, partnerId: 'partner-1', assignmentId: 'assign-1',
      });

      expect(ctx.io.forRoom('order:order-1')[0].payload.status).toBe('delivery_assigned');
      expect(ctx.io.forRoom('delivery:partner-1')[0].event).toBe('assignment_confirmed');
      // No other partner hears about it.
      expect(ctx.io.forRoom('delivery:partner-2')).toHaveLength(0);
      expect(ctx.io.forRoom(ROOM_ADMIN)).toHaveLength(1);
    });
  });

  describe('resilience', () => {
    it('a fanout fault does not propagate to the publisher', () => {
      const io = {
        to: () => ({ emit: () => { throw new Error('socket dead'); } }),
      };
      const unsubs = registerFulfillmentFanout(io, rooms, []);

      expect(() => eventBus.publish(FULFILLMENT_EVENTS.SELLER_ASSIGNED, basePayload)).not.toThrow();

      unsubs.forEach((fn) => fn());
    });

    it('unsubscribing stops all further emits', () => {
      ctx.stop();
      eventBus.publish(FULFILLMENT_EVENTS.SELLER_ASSIGNED, basePayload);

      expect(ctx.io.emits).toHaveLength(0);
      ctx = setup(); // so afterEach has something to stop
    });

    it('handles an event with no sellerId without emitting to a seller room', () => {
      eventBus.publish(FULFILLMENT_EVENTS.SELLER_ASSIGNED, {
        orderId: 'order-9', state: 'seller_assigned',
      });

      expect(ctx.io.emits.some((e) => e.room.startsWith('seller:'))).toBe(false);
      expect(ctx.io.forRoom('order:order-9')).toHaveLength(1);
    });
  });

  describe('projections', () => {
    it('customerView never carries internal identifiers', () => {
      const view = customerView({
        orderId: 'o1', state: 'searching', traceId: 't', sellerId: 's', attemptId: 'a',
      });

      expect(Object.keys(view).sort()).toEqual([
        'deliveryMode', 'estimatedDeliveryMinutes', 'message', 'orderId', 'state', 'type', 'updatedAt',
      ]);
    });

    it('customerView falls back to a safe message for an unknown state', () => {
      expect(customerView({ orderId: 'o1', state: 'something_new' }).message)
        .toBe('Preparing your order');
    });

    it('adminView carries the diagnostic fields operators need', () => {
      const view = adminView('evt', { ...basePayload, failureCode: 'X', fallbackLevel: 2 });

      expect(view.traceId).toBe('trace-abc');
      expect(view.failureCode).toBe('X');
      expect(view.fallbackLevel).toBe(2);
      expect(view.event).toBe('evt');
    });
  });
});
