const { FulfillmentSweeper } = require('../../../../src/services/fulfillment/FulfillmentSweeper');

describe('FulfillmentSweeper — interval is admin-configurable at runtime', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  function build(resolve) {
    return new FulfillmentSweeper({
      orderFulfillmentRepository: {
        findExpiredAcceptances: jest.fn(async () => []),
        findExpiredSearches: jest.fn(async () => []),
      },
      fulfillmentEngineService: { handleAcceptanceTimeout: jest.fn(), attemptNext: jest.fn() },
      fulfillmentConfigService: { resolve },
    });
  }

  it('picks up a changed interval on the next cycle without a restart', async () => {
    const resolve = jest.fn()
      .mockResolvedValueOnce({ sweeperIntervalSeconds: 10 }) // at start
      .mockResolvedValue({ sweeperIntervalSeconds: 5 });     // admin lowered it
    const sweeper = build(resolve);
    const tick = jest.spyOn(sweeper, '_tick').mockResolvedValue();

    await sweeper.start();
    expect(resolve).toHaveBeenCalledTimes(1);

    await jest.advanceTimersByTimeAsync(10_000);   // first cycle fires at the old interval
    expect(tick).toHaveBeenCalledTimes(1);

    await jest.advanceTimersByTimeAsync(5_000);    // next cycle uses the NEW interval
    expect(tick).toHaveBeenCalledTimes(2);
    await jest.advanceTimersByTimeAsync(5_000);
    expect(tick).toHaveBeenCalledTimes(3);

    sweeper.stop();
    await jest.advanceTimersByTimeAsync(30_000);
    expect(tick).toHaveBeenCalledTimes(3);
  });

  it('falls back to 15 s when config is unavailable', async () => {
    const sweeper = build(jest.fn().mockRejectedValue(new Error('db down')));
    const tick = jest.spyOn(sweeper, '_tick').mockResolvedValue();
    await sweeper.start();
    await jest.advanceTimersByTimeAsync(14_000);
    expect(tick).not.toHaveBeenCalled();
    await jest.advanceTimersByTimeAsync(1_000);
    expect(tick).toHaveBeenCalledTimes(1);
    sweeper.stop();
  });
});
