const { BaseService } = require('../../core/BaseService');
const { getProvider } = require('../../core/providers.registry');
const { AppError } = require('../../utils/AppError');
const { PAYMENT_METHOD, PAYMENT_STATUS } = require('../../constants/commerce');

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

    const paymentTx = await this.paymentTransactionRepository.findByOrderId(orderId);
    if (!paymentTx) throw AppError.notFound('Payment transaction not found');

    const resolvedOrderId = providerOrderId
      || paymentTx.rawResponse?.providerOrderId
      || paymentTx.providerPaymentId;

    const verified = await this.paymentProvider.verifyPayment({
      providerPaymentId,
      providerOrderId: resolvedOrderId,
      _payload: { signature, razorpay_payment_id: providerPaymentId, razorpay_order_id: resolvedOrderId, razorpay_signature: signature, sessionMeta },
    });

    const status = verified.status === 'paid' ? PAYMENT_STATUS.PAID : PAYMENT_STATUS.FAILED;

    await this.paymentTransactionRepository.updateStatus(paymentTx._id, status, verified, session);
    await this.orderRepository.updateById(orderId, { paymentStatus: status }, session);

    if (status === PAYMENT_STATUS.FAILED && this.orderService) {
      await this.orderService.releaseOrderReservations(orderId, session);
    }

    if (status === PAYMENT_STATUS.PAID && this.orderService) {
      await this.orderService.confirmOrder(orderId, userId, session);
    }

    return {
      paymentTransactionId: paymentTx._id,
      paymentStatus: status,
      providerPaymentId,
    };
  }

  async handleRazorpayWebhook({ provider, payload = {}, signature = null, rawBody = null }, session = null) {
    if (typeof this.paymentProvider.verifyWebhookSignature === 'function' && rawBody) {
      const valid = this.paymentProvider.verifyWebhookSignature({ rawBody, signature });
      if (!valid) {
        throw AppError.unauthorized('Invalid webhook signature');
      }
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

    const verification = await this.verifyPayment({
      userId: existingTx.userId,
      orderId: existingTx.orderId,
      providerPaymentId,
      providerOrderId: providerOrderId || existingTx.rawResponse?.providerOrderId,
      signature,
      sessionMeta: {},
      session,
    });

    return { processed: true, ...verification };
  }
}

module.exports = {
  PaymentService,
};
