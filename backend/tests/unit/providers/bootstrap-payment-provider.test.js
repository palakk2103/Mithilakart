/**
 * REGRESSION — production mock-payment fallback.
 *
 * bootstrapProviders() silently fell back to MockPaymentProvider whenever
 * Razorpay wasn't configured (missing RAZORPAY_KEY_ID/SECRET, or
 * PAYMENT_PROVIDER left unset), regardless of NODE_ENV. A production
 * deployment missing those env vars would boot successfully, log only a
 * `logger.warn`, and every non-COD order would then be auto-marked "paid"
 * with no money actually collected (see frontend Checkout.jsx, which trusted
 * payment.mockPayment / payment.provider === 'mock' from its own backend).
 *
 * bootstrapProviders() must now refuse to start when it would select the
 * mock payment provider under NODE_ENV=production.
 */

function loadBootstrapWithEnv(envOverrides) {
  let bootstrapProviders;
  jest.isolateModules(() => {
    // eslint-disable-next-line global-require
    ({ bootstrapProviders } = require('../../../src/core/providers/bootstrapProviders'));
  });
  return bootstrapProviders;
}

describe('bootstrapProviders — payment provider selection', () => {
  const ORIGINAL_ENV = { ...process.env };

  afterEach(() => {
    process.env = { ...ORIGINAL_ENV };
    jest.resetModules();
  });

  it('refuses to boot in production when Razorpay is not configured (falls to mock)', () => {
    process.env.NODE_ENV = 'production';
    delete process.env.PAYMENT_PROVIDER;
    delete process.env.RAZORPAY_KEY_ID;
    delete process.env.RAZORPAY_KEY_SECRET;

    const bootstrapProviders = loadBootstrapWithEnv();

    expect(() => bootstrapProviders()).toThrow(/mock payment provider/i);
  });

  it('refuses to boot in production when PAYMENT_PROVIDER is explicitly "mock"', () => {
    process.env.NODE_ENV = 'production';
    process.env.PAYMENT_PROVIDER = 'mock';
    process.env.RAZORPAY_KEY_ID = 'rzp_live_x';
    process.env.RAZORPAY_KEY_SECRET = 'secret_x';

    const bootstrapProviders = loadBootstrapWithEnv();

    expect(() => bootstrapProviders()).toThrow(/mock payment provider/i);
  });

  it('boots successfully in production when Razorpay is properly configured', () => {
    process.env.NODE_ENV = 'production';
    process.env.PAYMENT_PROVIDER = 'razorpay';
    process.env.RAZORPAY_KEY_ID = 'rzp_live_x';
    process.env.RAZORPAY_KEY_SECRET = 'secret_x';

    const bootstrapProviders = loadBootstrapWithEnv();

    expect(() => bootstrapProviders()).not.toThrow();
  });

  it('still allows mock payment outside production (development/test)', () => {
    process.env.NODE_ENV = 'development';
    delete process.env.PAYMENT_PROVIDER;
    delete process.env.RAZORPAY_KEY_ID;
    delete process.env.RAZORPAY_KEY_SECRET;

    const bootstrapProviders = loadBootstrapWithEnv();

    expect(() => bootstrapProviders()).not.toThrow();
  });
});
