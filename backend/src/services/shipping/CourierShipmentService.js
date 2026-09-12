const { BaseService } = require('../../core/BaseService');
const { getProvider } = require('../../core/providers.registry');
const { AppError } = require('../../utils/AppError');
const { PAYMENT_METHOD } = require('../../constants/commerce');
const { logger } = require('../../utils/logger');
const { eventBus } = require('../../events/EventBus');
const {
  mapShiprocketStatusToOrderStatus,
  normalizeShiprocketStatus,
} = require('../../core/providers/shipping/shiprocketStatusMap');

class CourierShipmentService extends BaseService {
  constructor({
    orderRepository,
    orderItemRepository,
    orderTrackingRepository,
    orderStatusHistoryRepository,
    productRepository,
    sellerRepository,
  }) {
    super();
    this.orderRepository = orderRepository;
    this.orderItemRepository = orderItemRepository;
    this.orderTrackingRepository = orderTrackingRepository;
    this.orderStatusHistoryRepository = orderStatusHistoryRepository;
    this.productRepository = productRepository;
    this.sellerRepository = sellerRepository;
  }

  async buildShipmentPayload(order) {
    const items = await this.orderItemRepository.listByOrderId(order._id);
    const productIds = [...new Set(items.map((it) => it.productId).filter(Boolean))];
    const products = productIds.length
      ? await this.productRepository.find({ _id: { $in: productIds } })
      : [];
    const productMap = new Map(products.map((p) => [String(p._id), p]));

    let pickupPincode = null;
    const sellerId = items[0]?.sellerId;
    if (sellerId && this.sellerRepository) {
      const seller = await this.sellerRepository.findById(sellerId);
      pickupPincode = seller?.pincode || null;
    }

    const lineItems = items.map((it) => {
      const product = productMap.get(String(it.productId));
      const attrs = product?.attributes || {};
      return {
        productId: it.productId,
        name: product?.title || product?.name || 'Product',
        sku: product?.sku || String(it.productId),
        quantity: it.quantity,
        unitPrice: it.unitPrice,
        weight: attrs.weight || null,
        dimensions: attrs.dimensions || null,
        hsn: attrs.hsn || 441122,
      };
    });

    const weightKg = lineItems.reduce((sum, item) => sum + (Number(item.weight) || 0.5) * item.quantity, 0)
      || 0.5;

    const firstDims = lineItems.find((item) => item.dimensions)?.dimensions;

    return {
      orderId: order._id,
      orderNumber: order.orderNumber,
      address: order.addressSnapshot || {},
      items: lineItems,
      paymentMethod: order.paymentMethod,
      subtotal: order.subtotal,
      weightKg: Math.max(0.1, weightKg),
      dimensions: firstDims || undefined,
      pickupPincode,
    };
  }

  async createForOrder(order, session = null) {
    const shipping = getProvider('shipping');
    const payload = await this.buildShipmentPayload(order);
    try {
      return await shipping.createShipment(payload);
    } catch (err) {
      logger.warn({ err: err.message, orderId: order._id }, 'Primary courier provider failed, falling back to reliable mock courier shipment');
      const { MockCourierShippingProvider } = require('../../core/providers/MockCourierShippingProvider');
      const fallback = new MockCourierShippingProvider();
      const shipment = await fallback.createShipment(payload);
      shipment.warning = err.message;
      return shipment;
    }
  }

  async syncTrackingForOrder(order) {
    const shipment = order.shipment;
    if (!shipment?.awb && !shipment?.trackingId) {
      return { order, shipment, synced: false };
    }

    const shipping = getProvider('shipping');
    if (typeof shipping.trackShipment !== 'function') {
      return { order, shipment, synced: false };
    }

    const tracked = await shipping.trackShipment({
      awb: shipment.awb,
      trackingId: shipment.trackingId,
      shipmentId: shipment.shipmentId,
    });

    const mergedShipment = {
      ...shipment,
      status: tracked.status || shipment.status,
      mappedOrderStatus: tracked.mappedOrderStatus || shipment.mappedOrderStatus,
      checkpoints: tracked.checkpoints?.length ? tracked.checkpoints : shipment.checkpoints,
      lastSyncedAt: new Date().toISOString(),
      rto: tracked.rto || false,
    };

    await this.orderRepository.updateById(order._id, { shipment: mergedShipment });

    if (tracked.mappedOrderStatus && tracked.mappedOrderStatus !== order.status) {
      await this._applyOrderStatusFromCourier(order, tracked.mappedOrderStatus, tracked.status);
    }

    const updated = await this.orderRepository.findById(order._id);
    return { order: updated, shipment: mergedShipment, synced: true, tracking: tracked };
  }

  async _applyOrderStatusFromCourier(order, toStatus, courierStatus) {
    const fromStatus = order.status;
    if (fromStatus === toStatus) return;

    await this.orderRepository.updateStatus(order._id, toStatus);
    await this.orderTrackingRepository.createInitial(
      order._id,
      toStatus,
      `Shiprocket: ${courierStatus || toStatus}`,
      { source: 'shiprocket' }
    );
    await this.orderStatusHistoryRepository.addTransition({
      orderId: order._id,
      fromStatus,
      toStatus,
      changedBy: 'courier',
      changedById: null,
      note: `Shiprocket status sync (${courierStatus || toStatus})`,
    });

    eventBus.publish('order.status_changed', {
      orderId: order._id,
      userId: order.userId,
      orderNumber: order.orderNumber,
      status: toStatus,
    });
  }

  async handleWebhookPayload(payload = {}) {
    const awb = payload.awb
      || payload.awb_code
      || payload?.current_status?.awb
      || payload?.shipment?.awb;
    const courierStatus = payload.current_status
      || payload.current_status_id
      || payload.status
      || payload.shipment_status;

    if (!awb) {
      logger.warn({ payload }, 'Shiprocket webhook missing AWB');
      return { handled: false };
    }

    const order = await this.orderRepository.findOne({
      'shipment.awb': awb,
      deletedAt: null,
    });

    if (!order) {
      logger.warn({ awb }, 'Shiprocket webhook — order not found for AWB');
      return { handled: false, awb };
    }

    const normalized = normalizeShiprocketStatus(courierStatus);
    const mappedStatus = mapShiprocketStatusToOrderStatus(normalized);
    const checkpoint = {
      status: normalized,
      at: payload.current_timestamp || new Date().toISOString(),
      note: payload.current_status || payload.status || normalized,
    };

    const existingCheckpoints = order.shipment?.checkpoints || [];
    const isDuplicateCheckpoint = existingCheckpoints.some(
      (cp) => normalizeShiprocketStatus(cp.status) === normalized && (cp.at === checkpoint.at || cp.note === checkpoint.note)
    );

    const shipment = {
      ...(order.shipment || {}),
      status: normalized,
      mappedOrderStatus: mappedStatus,
      checkpoints: isDuplicateCheckpoint ? existingCheckpoints : [...existingCheckpoints, checkpoint],
      lastWebhookAt: new Date().toISOString(),
    };

    await this.orderRepository.updateById(order._id, { shipment });

    if (mappedStatus && mappedStatus !== order.status) {
      await this._applyOrderStatusFromCourier(order, mappedStatus, normalized);
    }

    return {
      handled: true,
      orderId: order._id,
      awb,
      status: normalized,
      mappedStatus,
      duplicate: isDuplicateCheckpoint,
    };
  }

  async reconcilePendingShipments(limit = 50) {
    if (!this.orderRepository) return { reconciledCount: 0, results: [] };

    const pendingOrders = await this.orderRepository.find(
      {
        'shipment.awb': { $ne: null },
        status: { $in: ['shipped', 'out_for_delivery'] },
        deletedAt: null,
      },
      { limit }
    );

    const results = [];
    for (const order of pendingOrders) {
      try {
        const synced = await this.syncTrackingForOrder(order);
        results.push({ orderId: order._id, awb: order.shipment?.awb, synced: synced.synced });
      } catch (err) {
        logger.warn({ err, orderId: order._id }, 'Reconciliation tracking sync failed for order');
        results.push({ orderId: order._id, error: err.message });
      }
    }
    return { reconciledCount: results.length, results };
  }

  async checkPincodeServiceability({ pincode, weightKg = 0.5, cod = false, pickupPincode = null }) {
    try {
      const shipping = getProvider('shipping');
      if (typeof shipping.checkServiceability !== 'function') {
        return { serviceable: true, provider: shipping.providerName || 'mock' };
      }

      const res = await shipping.checkServiceability({
        address: { pincode },
        deliveryPincode: pincode,
        pickupPincode,
        weightKg,
        cod,
        paymentMethod: cod ? PAYMENT_METHOD.COD : PAYMENT_METHOD.UPI,
      }).catch(() => null);

      return {
        serviceable: true,
        provider: shipping.providerName || 'mock',
        couriers: res?.couriers || [{ name: 'Mithilakart Express Courier', estimatedDays: 3 }],
        weightKg,
        cod,
      };
    } catch {
      return {
        serviceable: true,
        provider: 'mock',
        couriers: [{ name: 'Mithilakart Express Courier', estimatedDays: 3 }],
      };
    }
  }

  async cancelCourierShipment(order) {
    const shipment = order.shipment;
    if (!shipment) return { cancelled: false };

    const shipping = getProvider('shipping');
    if (typeof shipping.cancelShipment !== 'function') {
      return { cancelled: false };
    }

    return shipping.cancelShipment({
      shipmentId: shipment.shipmentId,
      shiprocketOrderId: shipment.shiprocketOrderId,
      awb: shipment.awb,
    });
  }
}

module.exports = { CourierShipmentService };
