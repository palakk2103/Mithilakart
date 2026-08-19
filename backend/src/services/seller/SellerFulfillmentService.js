const { BaseService } = require('../../core/BaseService');
const { AppError } = require('../../utils/AppError');
const { ATTEMPT_STATUS } = require('../../constants/fulfillment');

/**
 * CR-002 — the seller side of the fulfillment offer workflow.
 *
 * Scope is deliberately narrow. `GET /seller/orders` and `/seller/orders/:id`
 * already work (OrderService.listOrdersForSeller / getOrderDetailForSeller) and
 * are NOT touched: modifying a working endpoint on the seller panel's critical
 * path would add regression risk for no benefit. This service only adds what
 * genuinely does not exist — listing live offers and responding to them.
 */
class SellerFulfillmentService extends BaseService {
  constructor({
    orderRepository,
    fulfillmentAttemptRepository,
    fulfillmentEngineService = null,
    productRepository = null,
  }) {
    super();
    this.orderRepository = orderRepository;
    this.fulfillmentAttemptRepository = fulfillmentAttemptRepository;
    this.fulfillmentEngineService = fulfillmentEngineService;
    this.productRepository = productRepository;
  }

  setFulfillmentEngineService(fulfillmentEngineService) {
    this.fulfillmentEngineService = fulfillmentEngineService;
  }

  _secondsRemaining(expiresAt) {
    if (!expiresAt) return null;
    return Math.max(0, Math.ceil((new Date(expiresAt).getTime() - Date.now()) / 1000));
  }

  /**
   * Only what the seller needs to decide. Rank scores, competing candidates,
   * and fulfillment internals are Admin-only and never serialised here.
   */
  _serializeOffer(attempt, order, productById = new Map()) {
    const address = order?.addressSnapshot || {};
    const reservations = attempt.reservations || [];

    // What the seller is being asked to pack. Without this the offer popup can
    // only say "3 items", which is not enough to make an accept/reject call.
    const items = reservations.map((entry) => {
      const product = productById.get(String(entry.productId));
      return {
        productId: String(entry.productId),
        title: product?.title || product?.name || 'Product',
        image: product?.images?.[0]?.url || product?.image || null,
        quantity: entry.quantity,
      };
    });

    return {
      attemptId: String(attempt._id),
      orderId: String(attempt.orderId),
      orderNumber: order?.orderNumber || null,
      expiresAt: attempt.expiresAt,
      secondsRemaining: this._secondsRemaining(attempt.expiresAt),
      estimatedDeliveryMinutes: attempt.estimatedDeliveryMinutes ?? null,
      distanceKm: attempt.distanceKm ?? null,
      itemCount: reservations.length,
      totalUnits: reservations.reduce((sum, entry) => sum + (entry.quantity || 0), 0),
      items,
      // Order value the seller is authorised to see: the goods subtotal. Customer
      // identity, phone, and exact address stay hidden until the offer is accepted.
      orderValue: order?.subtotal ?? null,
      paymentMethod: order?.paymentMethod || null,
      deliveryArea: {
        city: address.city || null,
        pincode: address.pincode || null,
      },
    };
  }

  /** Live offers addressed to this seller, freshest first. */
  async listOffers(sellerId) {
    if (!sellerId) throw AppError.unauthorized('Seller required');

    const attempts = await this.fulfillmentAttemptRepository.listPendingOffersForSeller(sellerId);
    if (!attempts.length) return { items: [] };

    const orderIds = [...new Set(attempts.map((a) => String(a.orderId)))];
    const orders = await this.orderRepository.find({ _id: { $in: orderIds } });
    const orderById = new Map(orders.map((o) => [String(o._id), o]));

    const now = Date.now();
    const live = attempts
      // An offer past its deadline is the sweeper's to reassign, not the
      // seller's to accept — hide it rather than invite a doomed tap.
      .filter((a) => !a.expiresAt || new Date(a.expiresAt).getTime() > now);

    // Resolve product titles for the live offers only.
    let productById = new Map();
    if (this.productRepository && live.length) {
      const productIds = [...new Set(
        live.flatMap((a) => (a.reservations || []).map((r) => String(r.productId)))
      )];
      if (productIds.length) {
        const products = await this.productRepository.find({ _id: { $in: productIds } });
        productById = new Map(products.map((p) => [String(p._id), p]));
      }
    }

    return {
      items: live.map((a) => this._serializeOffer(a, orderById.get(String(a.orderId)), productById)),
    };
  }

  /**
   * Resolves and authorises the offer being responded to.
   *
   * attemptId is required and must match both the seller and the order, so an
   * accept can never be applied to a different or stale offer.
   */
  async _resolveAttempt(sellerId, orderId, attemptId) {
    const attempt = await this.fulfillmentAttemptRepository.findById(attemptId);

    if (!attempt) throw AppError.notFound('Offer not found');
    if (String(attempt.sellerId) !== String(sellerId)) {
      throw AppError.forbidden('Offer not found for this seller');
    }
    if (String(attempt.orderId) !== String(orderId)) {
      throw AppError.validation('Offer does not belong to this order');
    }

    return attempt;
  }

  _assertEngine() {
    if (!this.fulfillmentEngineService) {
      throw AppError.serviceUnavailable('Fulfillment is not available');
    }
  }

  async acceptOffer({ sellerId, orderId, attemptId }) {
    this._assertEngine();

    const attempt = await this._resolveAttempt(sellerId, orderId, attemptId);

    // A retried request or a double tap is harmless, not an error.
    if (attempt.status === ATTEMPT_STATUS.ACCEPTED) {
      return { accepted: true, idempotent: true, orderId: String(orderId) };
    }

    const result = await this.fulfillmentEngineService.handleSellerAccept({ attemptId, sellerId });

    if (!result.ok) {
      if (result.code === 'FORBIDDEN') throw AppError.forbidden('Offer not found for this seller');
      throw AppError.offerExpired('This order is no longer available');
    }

    return {
      accepted: true,
      idempotent: Boolean(result.idempotent),
      orderId: String(orderId),
    };
  }

  async rejectOffer({ sellerId, orderId, attemptId, reason = null }) {
    this._assertEngine();

    const attempt = await this._resolveAttempt(sellerId, orderId, attemptId);

    if (attempt.status === ATTEMPT_STATUS.REJECTED) {
      return { rejected: true, idempotent: true, orderId: String(orderId) };
    }

    const result = await this.fulfillmentEngineService.handleSellerReject({ attemptId, sellerId, reason });

    if (!result.ok) {
      if (result.code === 'FORBIDDEN') throw AppError.forbidden('Offer not found for this seller');
      throw AppError.offerExpired('This order is no longer available');
    }

    // Deliberately does not reveal which seller is tried next.
    return { rejected: true, orderId: String(orderId) };
  }
}

module.exports = { SellerFulfillmentService };
