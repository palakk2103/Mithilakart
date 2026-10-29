const { BaseService } = require('../../core/BaseService');
const { getProvider } = require('../../core/providers.registry');
const { AppError } = require('../../utils/AppError');
const { PAYMENT_METHOD, PAYMENT_STATUS, ORDER_STATUS } = require('../../constants/commerce');
const { logger } = require('../../utils/logger');

/** Razorpay webhook events that mean the money was captured. */
const WEBHOOK_PAID_EVENTS = new Set(['payment.captured', 'order.paid']);

class PaymentService extends BaseService {
  constructor({
    paymentTransactionRepository,
    paymentWebhookRepository,
    orderRepository,
    orderTrackingRepository,
    orderStatusHistoryRepository,
    orderService = null,
  }) {
    super();
    this.paymentProvider = getProvider('payment');
    this.paymentTransactionRepository = paymentTransactionRepository;
    this.paymentWebhookRepository = paymentWebhookRepository;
    this.orderRepository = orderRepository;
    this.orderTrackingRepository = orderTrackingRepository;
    this.orderStatusHistoryRepository = orderStatusHistoryRepository;
    this.orderService = orderService;
  }

  setOrderService(orderService) {
    this.orderService = orderService;
  }

  async initiatePayment({
    userId,
    orderId,
    orderNumber,
    paymentMethod,
    amount,
    currency,
    idempotencyKey = null,
    sessionMeta = {},
    session = null,
  }) {
    if (!orderId) throw AppError.validation('orderId is required');

    const existing =
      idempotencyKey ? await this.paymentTransactionRepository.findByIdempotencyKey(idempotencyKey) : null;

    if (existing && existing.status === PAYMENT_STATUS.PAID) {
      return {
        paymentTransactionId: existing._id,
        providerPaymentId: existing.providerPaymentId,
        paymentStatus: existing.status,
        provider: existing.provider,
        providerOrderId: existing.providerPaymentId,
      };
    }

    if (existing && existing.status === PAYMENT_STATUS.PENDING) {
      return {
        paymentTransactionId: existing._id,
        providerPaymentId: existing.providerPaymentId,
        paymentStatus: existing.status,
        provider: existing.provider,
        providerOrderId: existing.rawResponse?.providerOrderId || existing.providerPaymentId,
        keyId: existing.rawResponse?.keyId || null,
        amountInPaise: existing.rawResponse?.amountInPaise || Math.round(Number(amount) * 100),
        currency: currency || 'INR',
      };
    }

    const provider = this.paymentProvider?.providerName || 'mock';

    const tx = await this.paymentTransactionRepository.create(
      {
        orderId,
        userId,
        paymentMethod,
        provider,
        amount,
        currency,
        status: paymentMethod === PAYMENT_METHOD.COD ? PAYMENT_STATUS.PAID : PAYMENT_STATUS.PENDING,
        idempotencyKey: idempotencyKey || null,
        providerPaymentId: null,
        rawRequest: { orderNumber, paymentMethod },
      },
      session
    );

    if (paymentMethod === PAYMENT_METHOD.COD) {
      await this.orderRepository.updateById(
        orderId,
        { paymentStatus: PAYMENT_STATUS.PAID },
        session
      );

      return {
        paymentTransactionId: tx._id,
        providerPaymentId: null,
        paymentStatus: PAYMENT_STATUS.PAID,
        provider,
      };
    }

    const providerOrder = await this.paymentProvider.createOrder({
      orderId: orderNumber,
      amount,
      currency,
      paymentMethod,
    });

    if (provider === 'mock') {
      const mockPaymentId = `mock_pay_${orderId}_${Date.now()}`;
      await this.paymentTransactionRepository.updateStatus(
        tx._id,
        PAYMENT_STATUS.PAID,
        { ...providerOrder, providerPaymentId: mockPaymentId, sessionMeta },
        session
      );
      await this.paymentTransactionRepository.updateById(
        tx._id,
        { providerPaymentId: mockPaymentId, rawResponse: { ...providerOrder, providerPaymentId: mockPaymentId } },
        session
      );
      await this.orderRepository.updateById(orderId, { paymentStatus: PAYMENT_STATUS.PAID }, session);

      return {
        paymentTransactionId: tx._id,
        providerPaymentId: mockPaymentId,
        provider,
        paymentStatus: PAYMENT_STATUS.PAID,
        providerOrderId: providerOrder.providerOrderId,
        mockPayment: true,
      };
    }

    await this.paymentTransactionRepository.updateStatus(
      tx._id,
      PAYMENT_STATUS.PENDING,
      { ...providerOrder, sessionMeta },
      session
    );

    await this.paymentTransactionRepository.updateById(
      tx._id,
      { providerPaymentId: providerOrder.providerOrderId, rawResponse: providerOrder },
      session
    );

    return {
      paymentTransactionId: tx._id,
      providerPaymentId: providerOrder.providerOrderId,
      provider,
      paymentStatus: PAYMENT_STATUS.PENDING,
      providerOrderId: providerOrder.providerOrderId,
      redirectUrl: providerOrder.redirectUrl || null,
      keyId: providerOrder.keyId || null,
      amountInPaise: providerOrder.amountInPaise || Math.round(Number(amount) * 100),
      currency: currency || 'INR',
    };
  }

  async verifyPayment({
    userId,
    orderId,
    providerPaymentId,
    providerOrderId = null,
    signature = null,
    sessionMeta = {},
    session = null,
  }) {
    const order = await this.orderRepository.findActiveById(orderId, userId);
    if (!order) throw AppError.notFound('Order not found');

    const paymentTx = await this.paymentTransactionRepository.findByOrderId(order._id);
    if (!paymentTx) throw AppError.notFound('Payment transaction not found');

    const resolvedOrderId = providerOrderId
      || paymentTx.rawResponse?.providerOrderId
      || paymentTx.providerPaymentId;

    const verified = await this.paymentProvider.verifyPayment({
      providerPaymentId,
      providerOrderId: resolvedOrderId,
      _payload: { signature, razorpay_payment_id: providerPaymentId, razorpay_order_id: resolvedOrderId, razorpay_signature: signature, sessionMeta },
    });

    return this._settlePayment({
      paymentTx,
      order,
      status: verified.status === 'paid' ? PAYMENT_STATUS.PAID : PAYMENT_STATUS.FAILED,
      providerPaymentId,
      providerOrderId: resolvedOrderId,
      raw: verified,
      session,
    });
  }

  /**
   * Applies a provider outcome to the transaction and the order, exactly once.
   *
   * A captured payment is final: a later "failed" (a retried or replayed
   * verify, a payment.failed webhook for an earlier attempt, a forged
   * signature) must never turn a paid order back into a failed one.
   */
  async _settlePayment({ paymentTx, order, status, providerPaymentId, providerOrderId, raw = {}, session = null }) {
    if (paymentTx.status === PAYMENT_STATUS.PAID) {
      return {
        paymentTransactionId: paymentTx._id,
        paymentStatus: PAYMENT_STATUS.PAID,
        providerPaymentId: paymentTx.rawResponse?.providerPaymentId || providerPaymentId,
        idempotent: true,
      };
    }

    await this.paymentTransactionRepository.updateStatus(paymentTx._id, status, {
      ...(paymentTx.rawResponse || {}),
      ...raw,
      providerOrderId: providerOrderId || paymentTx.rawResponse?.providerOrderId || null,
      // The captured payment id (pay_...) is what a refund needs; the
      // transaction field providerPaymentId holds the provider ORDER id.
      providerPaymentId: providerPaymentId || null,
    }, session);

    // Paid after the order was already cancelled (abandoned-payment sweep or a
    // cancel racing the payment): record the money and send it back.
    if (order.status === ORDER_STATUS.CANCELLED) {
      if (status === PAYMENT_STATUS.PAID) {
        await this.orderRepository.updateById(order._id, { paymentStatus: PAYMENT_STATUS.PAID }, session);
        const refund = () => this.refundOrderPayment(order._id, { reason: 'paid_after_cancellation' })
          .catch((err) => logger.error({ err, orderId: String(order._id) }, 'Refund of payment on cancelled order failed'));
        if (session && typeof session.afterCommit === 'function') session.afterCommit(refund);
        else await refund();
      }
      return { paymentTransactionId: paymentTx._id, paymentStatus: status, providerPaymentId, orderCancelled: true };
    }

    await this.orderRepository.updateById(order._id, { paymentStatus: status }, session);

    if (status === PAYMENT_STATUS.FAILED && this.orderService) {
      await this.orderService.releaseOrderReservations(order._id, session);
    }

    if (status === PAYMENT_STATUS.PAID && this.orderService) {
      await this.orderService.confirmOrder(order._id, order.userId, session);
    }

    return {
      paymentTransactionId: paymentTx._id,
      paymentStatus: status,
      providerPaymentId,
    };
  }

  /**
   * Returns money for a prepaid order to the original payment method.
   * COD and unpaid orders have nothing to refund. Pass `amount` for a partial
   * refund (returns); omit it to refund whatever is left of the payment.
   */
  async refundOrderPayment(orderId, { amount = null, reason = null } = {}) {
    const paymentTx = await this.paymentTransactionRepository.findOne({
      orderId, status: PAYMENT_STATUS.PAID, deletedAt: null,
    });
    if (!paymentTx || paymentTx.paymentMethod === PAYMENT_METHOD.COD) {
      return { refunded: false, reason: 'not_prepaid' };
    }

    const previous = paymentTx.rawResponse?.refunds || [];
    const alreadyRefunded = previous.reduce((sum, r) => sum + (Number(r.amount) || 0), 0);
    const refundable = Math.max(0, Number(paymentTx.amount) - alreadyRefunded);
    const refundAmount = Math.min(amount == null ? refundable : Number(amount), refundable);
    if (refundAmount <= 0) return { refunded: false, reason: 'nothing_left_to_refund' };

    const providerPaymentId = paymentTx.rawResponse?.providerPaymentId || paymentTx.providerPaymentId;
    const result = await this.paymentProvider.refund({ providerPaymentId, amount: refundAmount });

    const refunds = [...previous, { amount: refundAmount, refundId: result?.refundId || null, reason, at: new Date() }];
    const fullyRefunded = alreadyRefunded + refundAmount >= Number(paymentTx.amount);
    await this.paymentTransactionRepository.updateById(paymentTx._id, {
      rawResponse: { ...(paymentTx.rawResponse || {}), refunds },
      ...(fullyRefunded ? { status: PAYMENT_STATUS.REFUNDED } : {}),
    });
    if (fullyRefunded) {
      await this.orderRepository.updateById(orderId, { paymentStatus: PAYMENT_STATUS.REFUNDED });
    }

    logger.info({ orderId: String(orderId), amount: refundAmount, reason }, 'Order payment refunded to source');
    return { refunded: true, amount: refundAmount, refundId: result?.refundId || null, fullyRefunded };
  }

  async handleRazorpayWebhook({ provider, payload = {}, signature = null, rawBody = null }, session = null) {
    // Production-readiness audit (2026-08-25): this previously read
    // `&& rawBody` as an extra condition, which meant that whenever rawBody
    // was falsy for ANY reason (a proxy stripping it, a middleware ordering
    // regression, RAZORPAY_WEBHOOK_SECRET left unset in .env so the real
    // provider's own internal check never even ran) verification was SKIPPED
    // entirely rather than failing. The provider's own
    // verifyWebhookSignature() already correctly returns false when
    // rawBody/signature/webhookSecret is missing — that's the one and only
    // place this decision should be made. Fails closed by default when the
    // provider exposes no verification method at all.
    if (typeof this.paymentProvider.verifyWebhookSignature === 'function') {
      const valid = await this.paymentProvider.verifyWebhookSignature({ rawBody, signature });
      if (!valid) {
        throw AppError.unauthorized('Invalid webhook signature');
      }
    } else {
      throw AppError.unauthorized('Webhook signature verification is not available for this provider');
    }

    const paymentEntity = payload?.payload?.payment?.entity || payload?.payment?.entity || payload;
    const providerPaymentId = paymentEntity?.id || payload.payment_id || payload.providerPaymentId || payload.paymentId || null;
    const providerOrderId = paymentEntity?.order_id || payload.order_id || payload.providerOrderId || null;
    const eventId = payload.event_id || payload.eventId || payload.id || providerPaymentId;

    if (!providerPaymentId) {
      throw AppError.validation('Invalid webhook payload');
    }

    const hasProcessed = await this.paymentWebhookRepository.hasProcessed({
      provider,
      eventId,
      idempotencyKey: payload.idempotencyKey || null,
    });

    if (hasProcessed) {
      return { processed: true };
    }

    let existingTx = await this.paymentTransactionRepository.findByProviderPaymentId(providerOrderId || providerPaymentId);
    if (!existingTx && providerOrderId) {
      existingTx = await this.paymentTransactionRepository.findOne({ 'rawResponse.providerOrderId': providerOrderId });
    }
    if (!existingTx) {
      throw AppError.notFound('Payment transaction not found for webhook');
    }

    // The webhook signature (checked above) already proves Razorpay sent this,
    // so the outcome comes from the event. Re-running the checkout-signature
    // check here (the old behaviour) could never pass, so every
    // payment.captured webhook marked a paid order as FAILED.
    const event = String(payload.event || '');
    const outcome = WEBHOOK_PAID_EVENTS.has(event)
      ? PAYMENT_STATUS.PAID
      : (event === 'payment.failed' ? PAYMENT_STATUS.FAILED : null);

    await this.paymentWebhookRepository.create(
      {
        provider,
        eventId,
        idempotencyKey: payload.idempotencyKey || null,
        orderId: existingTx.orderId,
        paymentTransactionId: existingTx._id,
        status: 'processed',
        rawPayload: payload,
      },
      session
    );

    if (!outcome) return { processed: true, ignored: event || 'unknown_event' };

    const paidPaise = Number(paymentEntity?.amount);
    if (outcome === PAYMENT_STATUS.PAID && Number.isFinite(paidPaise)
      && paidPaise !== Math.round(Number(existingTx.amount) * 100)) {
      logger.error({ orderId: String(existingTx.orderId), paidPaise, expected: existingTx.amount },
        'Razorpay webhook amount does not match the order; not marking it paid');
      return { processed: true, ignored: 'amount_mismatch' };
    }

    const order = await this.orderRepository.findById(existingTx.orderId, { session });
    if (!order) throw AppError.notFound('Order not found for webhook');

    const settled = await this._settlePayment({
      paymentTx: existingTx,
      order,
      status: outcome,
      providerPaymentId,
      providerOrderId: providerOrderId || existingTx.rawResponse?.providerOrderId,
      raw: { webhookEvent: event },
      session,
    });

    return { processed: true, ...settled };
  }
}

module.exports = {
  PaymentService,
};
