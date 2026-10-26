/**
 * Production readiness audit (2026-08-25) — Razorpay webhook authentication.
 *
 * Real, live-confirmed bug: handleRazorpayWebhook() only called
 * verifyWebhookSignature() when `rawBody` was truthy
 * (`typeof ... === 'function' && rawBody`). If rawBody was ever falsy for
 * ANY reason — RAZORPAY_WEBHOOK_SECRET left unset in .env (confirmed: it is
 * currently absent from the real .env, only templated in .env.example), a
 * proxy stripping the raw body, a middleware-ordering regression —
 * verification was SKIPPED ENTIRELY rather than failing. The provider's own
 * verifyWebhookSignature() already correctly returns false for any of those
 * cases; the outer `&& rawBody` short-circuit was the actual defect.
 *
 * Fixed to always invoke verifyWebhookSignature() when the provider exposes
 * one, and to fail closed (reject) if the provider exposes no verification
 * method at all.
 */
const { registerProvider, getProvider } = require('../../../src/core/providers.registry');
const { PaymentService } = require('../../../src/services/payments/PaymentService');
const { AppError } = require('../../../src/utils/AppError');

function buildService() {
  return new PaymentService({
    paymentTransactionRepository: { findByProviderPaymentId: jest.fn(), findOne: jest.fn() },
    paymentWebhookRepository: { hasProcessed: jest.fn().mockResolvedValue(false), create: jest.fn() },
    orderRepository: { updateById: jest.fn() },
    orderTrackingRepository: {},
    orderStatusHistoryRepository: {},
  });
}

describe('production-readiness — PaymentService.handleRazorpayWebhook signature verification', () => {
  const originalProvider = getProvider('payment');
  afterEach(() => registerProvider('payment', originalProvider));

  it('rejects the webhook when the provider signature check fails, even with rawBody present', async () => {
    registerProvider('payment', { verifyWebhookSignature: jest.fn().mockResolvedValue(false) });
    const service = buildService();

    await expect(service.handleRazorpayWebhook({
      provider: 'razorpay',
      payload: { payment_id: 'p1' },
      signature: 'bad-sig',
      rawBody: Buffer.from('{"payment_id":"p1"}'),
    })).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
  });

  it('THE ACTUAL BUG: rejects the webhook when rawBody is falsy — does not silently skip verification', async () => {
    const verifyWebhookSignature = jest.fn().mockResolvedValue(false);
    registerProvider('payment', { verifyWebhookSignature });
    const service = buildService();

    // Before the fix, `rawBody: null` meant the `&& rawBody` guard was
    // false, verifyWebhookSignature was NEVER CALLED, and the webhook
    // proceeded to be processed as if it were genuine.
    await expect(service.handleRazorpayWebhook({
      provider: 'razorpay',
      payload: { payment_id: 'p1' },
      signature: 'whatever',
      rawBody: null,
    })).rejects.toMatchObject({ code: 'UNAUTHORIZED' });

    expect(verifyWebhookSignature).toHaveBeenCalledTimes(1);
  });

  it('rejects when the provider exposes no verification method at all, rather than proceeding unauthenticated', async () => {
    registerProvider('payment', {});
    const service = buildService();

    await expect(service.handleRazorpayWebhook({
      provider: 'razorpay',
      payload: { payment_id: 'p1' },
      signature: 'x',
      rawBody: Buffer.from('{}'),
    })).rejects.toBeInstanceOf(AppError);
  });

  it('proceeds past signature verification when the provider confirms it valid', async () => {
    registerProvider('payment', { verifyWebhookSignature: jest.fn().mockResolvedValue(true) });
    const service = buildService();

    // No matching transaction exists for this made-up id, so it should fail
    // on the NEXT step (payment transaction lookup) — proving signature
    // verification is no longer the blocker once it genuinely passes.
    await expect(service.handleRazorpayWebhook({
      provider: 'razorpay',
      payload: { payment_id: 'p1' },
      signature: 'good-sig',
      rawBody: Buffer.from('{"payment_id":"p1"}'),
    })).rejects.toMatchObject({ code: 'NOT_FOUND' });
  });
});
