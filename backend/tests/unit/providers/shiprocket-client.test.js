const { ShiprocketClient } = require('../../../src/core/providers/shipping/ShiprocketClient');

describe('ShiprocketClient auth cache', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('caches token between requests', async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      text: async () => JSON.stringify({ token: 'abc123' }),
    });
    global.fetch = fetchMock;

    const client = new ShiprocketClient({ email: 'api@test.com', password: 'secret' });
    const t1 = await client.getToken();
    const t2 = await client.getToken();

    expect(t1).toBe('abc123');
    expect(t2).toBe('abc123');
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
