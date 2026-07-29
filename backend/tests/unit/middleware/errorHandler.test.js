const { errorHandler } = require('../../../src/middleware/errorHandler');
const { AppError } = require('../../../src/utils/AppError');

describe('errorHandler middleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = { id: 'req-1', method: 'POST', originalUrl: '/api/v1/seller/products' };
    res = {
      headersSent: false,
      locals: { requestId: 'req-1' },
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    next = jest.fn();
  });

  it('formats compound index 11000 duplicate error for sellerId + sku correctly', () => {
    const err = {
      code: 11000,
      keyValue: { sellerId: '6A69992619E8356889C78261', sku: 'MH-LIP-001' },
    };

    errorHandler(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: expect.objectContaining({
          code: 'CONFLICT',
          message: 'Product SKU "MH-LIP-001" is already in use by another active product',
        }),
      })
    );
  });
});
