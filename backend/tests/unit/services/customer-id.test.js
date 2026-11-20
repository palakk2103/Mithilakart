/**
 * Every registered customer gets a permanent unique customer id (MK000123).
 */
const Counter = require('../../../src/models/Counter');
const User = require('../../../src/models/User');
const { formatCustomerId, nextCustomerId, CUSTOMER_ID_PATTERN } = require('../../../src/utils/customerId');
const { AdminUserService } = require('../../../src/services/admin/AdminUserService');
const { UserProfileService } = require('../../../src/services/users/UserProfileService');

describe('customer id format', () => {
  it.each([[1, 'MK000001'], [42, 'MK000042'], [123456, 'MK123456'], [1000000, 'MK1000000']])('%d -> %s', (n, id) => {
    expect(formatCustomerId(n)).toBe(id);
    expect(CUSTOMER_ID_PATTERN.test(id)).toBe(true);
  });
});

describe('customer id assignment', () => {
  let seq;
  beforeEach(() => {
    seq = 0;
    jest.spyOn(Counter, 'findOneAndUpdate').mockImplementation(async () => ({ seq: (seq += 1) }));
  });
  afterEach(() => jest.restoreAllMocks());

  it('increments atomically through the counter', async () => {
    expect(await nextCustomerId()).toBe('MK000001');
    expect(await nextCustomerId()).toBe('MK000002');
    expect(Counter.findOneAndUpdate).toHaveBeenCalledWith({ _id: 'customerId' }, { $inc: { seq: 1 } }, expect.objectContaining({ upsert: true, new: true }));
  });

  it('gives every new user an id when it is validated (all creation paths)', async () => {
    const a = new User({ name: 'A', phone: '9876543210', authProvider: 'phone' });
    const b = new User({ name: 'B', phone: '9876543211', authProvider: 'phone' });
    await a.validate();
    await b.validate();
    expect(a.customerId).toBe('MK000001');
    expect(b.customerId).toBe('MK000002');
  });

  it('never replaces an id that is already set', async () => {
    const u = new User({ name: 'A', phone: '9876543210', authProvider: 'phone', customerId: 'MK000500' });
    await u.validate();
    expect(u.customerId).toBe('MK000500');
    expect(Counter.findOneAndUpdate).not.toHaveBeenCalled();
  });

  it('does not touch the counter for an existing user being saved again', async () => {
    const u = User.hydrate({ _id: new (require('mongoose').Types.ObjectId)(), name: 'Old', phone: '9876543210', authProvider: 'phone', customerId: 'MK000007' });
    await u.validate();
    expect(Counter.findOneAndUpdate).not.toHaveBeenCalled();
  });

  it('the id cannot be changed afterwards (immutable)', () => {
    expect(User.schema.path('customerId').options.immutable).toBe(true);
    expect(User.schema.path('customerId').options.unique).toBe(true);
  });
});

describe('where the id is exposed', () => {
  it('profile includes the customer id', async () => {
    const svc = new UserProfileService({ userRepository: { findById: async () => ({ _id: 'u1', customerId: 'MK000009', name: 'A', deletedAt: null }) } });
    expect(await svc.getProfile('u1')).toMatchObject({ customerId: 'MK000009' });
  });

  it('admin search by customer id, name, email or phone', async () => {
    const find = jest.fn(async () => []);
    const svc = new AdminUserService({ userRepository: { find, count: async () => 0 } });
    await svc.list({ search: 'MK0001' });
    const filter = find.mock.calls[0][0];
    expect(filter.$or.map((c) => Object.keys(c)[0])).toEqual(['customerId', 'name', 'email', 'phone']);
    expect(filter.$or[0].customerId.test('MK000123')).toBe(true);
    expect(filter.$or[0].customerId.test('MK000223')).toBe(false);
  });

  it('search input is escaped so it cannot be used as a regex', async () => {
    const find = jest.fn(async () => []);
    const svc = new AdminUserService({ userRepository: { find, count: async () => 0 } });
    await svc.list({ search: '.*' });
    const rx = find.mock.calls[0][0].$or[0].customerId;
    expect(rx.test('MK000123')).toBe(false);
  });

  it('csv export starts with the customer id', async () => {
    const svc = new AdminUserService({ userRepository: { find: async () => [{ customerId: 'MK000001', _id: 'x', name: 'A', email: 'a@b.c', phone: '1', status: 'active', createdAt: 'd' }], count: async () => 1 } });
    const csv = await svc.exportCsv();
    expect(csv.split('\n')[0]).toBe('customerId,id,name,email,phone,status,createdAt');
    expect(csv.split('\n')[1].startsWith('MK000001,')).toBe(true);
  });
});
