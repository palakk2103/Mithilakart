const { authorize } = require('../../../src/middleware/authorize');
const { AppError } = require('../../../src/utils/AppError');

describe('RBAC authorize middleware', () => {
  it('returns required permissions in 403 details', () => {
    const middleware = authorize(['users.view']);
    const req = {
      auth: { token: 't' },
      user: { permissions: ['dashboard.view'] },
    };
    const next = jest.fn();

    middleware(req, {}, next);

    expect(next).toHaveBeenCalledWith(expect.any(AppError));
    const err = next.mock.calls[0][0];
    expect(err.statusCode).toBe(403);
    expect(err.details.requiredPermissions).toEqual(['users.view']);
  });
});
