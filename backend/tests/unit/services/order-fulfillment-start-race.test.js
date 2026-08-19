/**
 * REGRESSION — CR-002 Failure 4 (the transaction-visibility race).
 * See docs/cr-002/REAL_FLOW_FAILURE_ANALYSIS.md.
 *
 * Order placement fired the fulfillment engine from INSIDE the checkout
 * transaction, fire-and-forget. The engine reads the order on its own
 * connection, so it queried outside the uncommitted transaction, could not see
 * the order, logged "CR-002 start called for a missing order", and the order
 * was never fulfilled at all.
 *
 * It was a race, so it failed intermittently — and invisibly to the whole test
 * suite, because unit tests never open a real transaction. Reproduced against
 * live MongoDB Atlas: two consecutive quick_shop orders produced zero
 * fulfillment documents until the fix.
 *
 * These tests pin the contract that makes the race impossible:
 *   1. withTransaction runs after-commit hooks only after a successful commit.
 *   2. An aborted transaction runs none of them.
 *   3. OrderService registers the engine start as an after-commit hook.
 */
jest.mock('../../../src/config/database', () => ({
  mongoose: {
    startSession: jest.fn(),
  },
}));

const { mongoose } = require('../../../src/config/database');
const { withTransaction } = require('../../../src/config/database.transaction');

function fakeSession({ failCommit = false } = {}) {
  return {
    startTransaction: jest.fn(),
    commitTransaction: jest.fn(async () => {
      if (failCommit) throw new Error('commit failed');
    }),
    abortTransaction: jest.fn(async () => {}),
    endSession: jest.fn(),
  };
}

describe('withTransaction after-commit hooks', () => {
  it('runs hooks only AFTER the transaction commits', async () => {
    const session = fakeSession();
    mongoose.startSession.mockResolvedValue(session);

    const order = [];

    await withTransaction(async (s) => {
      s.afterCommit(() => { order.push('hook'); });
      order.push('work');
    });

    // The whole point: the hook must not observe pre-commit state.
    expect(order).toEqual(['work', 'hook']);
    expect(session.commitTransaction).toHaveBeenCalled();
  });

  it('does NOT run hooks when the transaction aborts', async () => {
    const session = fakeSession();
    mongoose.startSession.mockResolvedValue(session);

    const hook = jest.fn();

    await expect(withTransaction(async (s) => {
      s.afterCommit(hook);
      throw new Error('checkout failed');
    })).rejects.toThrow();

    // A rolled-back order must never trigger fulfillment.
    expect(hook).not.toHaveBeenCalled();
    expect(session.abortTransaction).toHaveBeenCalled();
  });

  it('does not run hooks when the commit itself fails', async () => {
    const session = fakeSession({ failCommit: true });
    mongoose.startSession.mockResolvedValue(session);

    const hook = jest.fn();

    await expect(withTransaction(async (s) => { s.afterCommit(hook); })).rejects.toThrow();
    expect(hook).not.toHaveBeenCalled();
  });

  it('a failing hook does not fail the already-committed transaction', async () => {
    const session = fakeSession();
    mongoose.startSession.mockResolvedValue(session);

    const second = jest.fn();

    const result = await withTransaction(async (s) => {
      s.afterCommit(() => { throw new Error('engine start blew up'); });
      s.afterCommit(second);
      return 'committed';
    });

    expect(result).toBe('committed');
    // One bad hook must not swallow the rest.
    expect(second).toHaveBeenCalled();
  });

  it('runs hooks in registration order', async () => {
    const session = fakeSession();
    mongoose.startSession.mockResolvedValue(session);

    const seen = [];
    await withTransaction(async (s) => {
      s.afterCommit(() => seen.push(1));
      s.afterCommit(async () => { seen.push(2); });
      s.afterCommit(() => seen.push(3));
    });

    expect(seen).toEqual([1, 2, 3]);
  });
});

describe('OrderService defers the fulfillment engine past commit', () => {
  const { OrderService } = require('../../../src/services/orders/OrderService');

  function serviceUnderTest() {
    const engine = {
      isEnabledForTab: jest.fn().mockResolvedValue(true),
      start: jest.fn().mockResolvedValue({}),
    };

    const service = Object.create(OrderService.prototype);
    service.fulfillmentEngineService = engine;
    service.deliveryOrderService = {};
    service.orderRepository = { updateById: jest.fn().mockResolvedValue({}) };

    return { service, engine };
  }

  const quickOrder = { _id: 'order-1', marketplaceTab: 'quick_shop' };

  it('registers the engine start as an after-commit hook, not an inline call', async () => {
    const { service, engine } = serviceUnderTest();
    const hooks = [];
    const session = { afterCommit: (fn) => hooks.push(fn) };

    await service._afterOrderConfirmed(quickOrder, session);

    // The exact regression: starting here would read an uncommitted order.
    expect(engine.start).not.toHaveBeenCalled();
    expect(hooks).toHaveLength(1);

    await hooks[0]();
    expect(engine.start).toHaveBeenCalledWith('order-1');
  });

  it('starts immediately when there is no transaction in play', async () => {
    const { service, engine } = serviceUnderTest();

    await service._afterOrderConfirmed(quickOrder, null);
    await new Promise((resolve) => setImmediate(resolve));

    expect(engine.start).toHaveBeenCalledWith('order-1');
  });

  it('does not start the engine for a tab the engine is disabled for', async () => {
    const { service, engine } = serviceUnderTest();
    engine.isEnabledForTab.mockResolvedValue(false);

    const hooks = [];
    await service._afterOrderConfirmed(quickOrder, { afterCommit: (fn) => hooks.push(fn) });
    await hooks[0]();

    expect(engine.start).not.toHaveBeenCalled();
  });
});
