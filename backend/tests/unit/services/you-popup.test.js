const { AdminPlatformSettingsService } = require('../../../src/services/admin/AdminPlatformSettingsService');
const { PlatformConfigService } = require('../../../src/services/platform/PlatformConfigService');
const { mergeYouPopupItems } = require('../../../src/services/platform/youPopupMerge');

const valid = () => [
  { id: 'orders', label: 'My Orders', enabled: true, order: 2 },
  { id: 'buy_again', label: 'Buy Again', enabled: false, order: 4 },
  { id: 'account', label: 'Account', enabled: true, order: 1 },
  { id: 'wishlist', label: 'Wishlist', enabled: true, order: 3 },
];

describe('You popup configuration', () => {
  let repo; let invalidate; let admin;
  beforeEach(() => {
    repo = { findByKey: jest.fn().mockResolvedValue(null), create: jest.fn(), updateById: jest.fn() };
    invalidate = jest.fn();
    admin = new AdminPlatformSettingsService({
      platformSettingRepository: repo, commissionRuleRepository: {}, platformConfigService: { invalidateCache: invalidate },
    });
  });

  it('returns defaults when nothing stored', async () => {
    const r = await admin.getYouPopup();
    expect(r.items.map((i) => i.id)).toEqual(['orders', 'buy_again', 'account', 'wishlist']);
  });

  it('saves a valid payload, trims labels and invalidates cache', async () => {
    const p = valid(); p[0].label = '  My   Orders ';
    const r = await admin.updateYouPopup(p, 'a1');
    expect(repo.create).toHaveBeenCalledWith(expect.objectContaining({ key: 'youPopupConfig' }));
    expect(invalidate).toHaveBeenCalled();
    expect(r.items.map((i) => i.id)).toEqual(['account', 'orders', 'wishlist', 'buy_again']);
    expect(r.items[1].label).toBe('My Orders');
  });

  it.each([
    ['non-array', 'x'],
    ['unknown id', valid().map((i, n) => (n === 0 ? { ...i, id: 'evil' } : i))],
    ['duplicate id', valid().map((i, n) => (n === 1 ? { ...i, id: 'orders' } : i))],
    ['missing item', valid().slice(1)],
    ['empty label', valid().map((i, n) => (n === 0 ? { ...i, label: '  ' } : i))],
    ['html label', valid().map((i, n) => (n === 0 ? { ...i, label: '<b>x</b>' } : i))],
    ['long label', valid().map((i, n) => (n === 0 ? { ...i, label: 'x'.repeat(25) } : i))],
    ['non-boolean enabled', valid().map((i, n) => (n === 0 ? { ...i, enabled: 'yes' } : i))],
    ['duplicate order', valid().map((i, n) => (n === 0 ? { ...i, order: 1 } : i))],
    ['url smuggling is ignored but bad order rejected', valid().map((i, n) => (n === 0 ? { ...i, order: 'a' } : i))],
  ])('rejects %s', async (_n, payload) => {
    await expect(admin.updateYouPopup(payload, 'a1')).rejects.toThrow();
    expect(repo.create).not.toHaveBeenCalled();
  });

  it('never persists client-supplied routes', async () => {
    const p = valid().map((i) => ({ ...i, route: 'https://evil.com' }));
    await admin.updateYouPopup(p, 'a1');
    expect(JSON.stringify(repo.create.mock.calls[0][0].value)).not.toContain('evil');
  });

  it('public config returns only enabled items, ordered, with registry routes', async () => {
    const svc = new PlatformConfigService({
      platformSettingRepository: { find: jest.fn().mockResolvedValue([{ key: 'youPopupConfig', value: valid() }]) },
      deliveryChargeRuleRepository: { findActive: jest.fn().mockResolvedValue([]) },
      cacheService: { get: jest.fn().mockResolvedValue(null), set: jest.fn() },
    });
    const r = await svc.getYouPopup();
    expect(r.items.map((i) => i.id)).toEqual(['account', 'orders', 'wishlist']);
    expect(r.items[0]).toEqual({ id: 'account', label: 'Account', order: 1, route: '/profile' });
    expect(r.items[1].label).toBe('My Orders');
  });

  it('merge tolerates corrupt stored data', () => {
    expect(mergeYouPopupItems('junk')).toHaveLength(4);
    expect(mergeYouPopupItems([{ id: 'nope' }, null])).toHaveLength(4);
  });
});
