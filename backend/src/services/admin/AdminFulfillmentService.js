const { BaseService } = require('../../core/BaseService');
const { AppError } = require('../../utils/AppError');
const { parsePagination, buildPaginationMeta } = require('../../utils/pagination');
const { isFiniteNumber, toFiniteNumber } = require('../../utils/numeric');
const {
  PLATFORM_SETTING_KEYS: K,
  FULFILLMENT_SETTING_RANGES,
  DEFAULT_SELLER_RANKING_WEIGHTS,
  DEFAULT_PARTNER_RANKING_WEIGHTS,
} = require('../../constants/platformSettings');
const { DELIVERY_ASSIGNMENT_MODE_VALUES } = require('../../constants/fulfillment');

/**
 * CR-002 P11 — Admin fulfillment configuration and monitoring.
 *
 * Configuration is a VALIDATING FAÇADE over the existing platform settings
 * store — it writes the same `platform_settings` rows through the existing
 * AdminPlatformSettingsService, and therefore reuses its cache invalidation.
 * No second configuration system is introduced. What it adds is range and type
 * validation the generic `PUT /admin/settings` cannot provide.
 *
 * Monitoring exists so an operator can diagnose a failed order from the admin
 * panel, without shell access to server logs.
 */

/** Keys this façade owns. Anything else is rejected rather than silently stored. */
const NUMERIC_KEYS = [
  K.QUICK_FULFILLMENT_SEARCH_TIMEOUT_SECONDS,
  K.SELLER_ACCEPTANCE_TIMEOUT_SECONDS,
  K.DELIVERY_PARTNER_ASSIGNMENT_TIMEOUT_SECONDS,
  K.SELLER_SEARCH_RADIUS_KM,
  K.MAX_DELIVERY_RADIUS_KM,
  K.DEFAULT_PREPARATION_TIME_MINUTES,
  K.DELIVERY_BUFFER_MINUTES,
  K.MAX_SELLER_ATTEMPTS_PER_ORDER,
  K.FULFILLMENT_SWEEPER_INTERVAL_SECONDS,
  K.ROUTING_FALLBACK_SPEED_KMPH,
  // Commercial — existing keys, reused not duplicated.
  K.PLATFORM_FEE,
  K.PACKAGING_FEE,
  K.MIN_ORDER_AMOUNT,
  K.FREE_SHIPPING_THRESHOLD,
  K.DEFAULT_DELIVERY_CHARGE,
  K.COD_HANDLING_FEE,
];

const BOOLEAN_KEYS = [
  K.WAREHOUSE_FALLBACK_ENABLED,
  K.COURIER_FALLBACK_ENABLED,
  K.ROUTING_PROVIDER_ENABLED,
  K.CROSS_SELLER_SUBSTITUTION_ENABLED,
  K.QUICK_COMMERCE_ENABLED,
  K.COD_ENABLED,
];

/** Ranges for reused commercial keys that have no CR-002 range defined. */
const EXTRA_RANGES = {
  [K.PLATFORM_FEE]: { min: 0, max: 10000 },
  [K.PACKAGING_FEE]: { min: 0, max: 10000 },
  [K.MIN_ORDER_AMOUNT]: { min: 0, max: 1000000 },
  [K.FREE_SHIPPING_THRESHOLD]: { min: 0, max: 1000000 },
  [K.DEFAULT_DELIVERY_CHARGE]: { min: 0, max: 100000 },
  [K.COD_HANDLING_FEE]: { min: 0, max: 10000 },
  [K.MAX_DELIVERY_RADIUS_KM]: { min: 1, max: 500 },
};

class AdminFulfillmentService extends BaseService {
  constructor({
    adminPlatformSettingsService,
    fulfillmentConfigService,
    orderFulfillmentRepository,
    fulfillmentAttemptRepository,
    orderRepository,
    deliveryAssignmentRepository = null,
    fulfillmentEngineService = null,
    auditService = null,
  }) {
    super();
    this.adminPlatformSettingsService = adminPlatformSettingsService;
    this.fulfillmentConfigService = fulfillmentConfigService;
    this.orderFulfillmentRepository = orderFulfillmentRepository;
    this.fulfillmentAttemptRepository = fulfillmentAttemptRepository;
    this.orderRepository = orderRepository;
    this.deliveryAssignmentRepository = deliveryAssignmentRepository;
    this.fulfillmentEngineService = fulfillmentEngineService;
    this.auditService = auditService;
  }

  static get MANAGED_KEYS() {
    return [
      ...NUMERIC_KEYS,
      ...BOOLEAN_KEYS,
      K.SELLER_RANKING_WEIGHTS,
      K.PARTNER_RANKING_WEIGHTS,
      K.DELIVERY_ASSIGNMENT_MODE,
    ];
  }

  _rangeFor(key) {
    return FULFILLMENT_SETTING_RANGES[key] || EXTRA_RANGES[key] || null;
  }

  /**
   * Validates a proposed settings patch.
   *
   * Rejects rather than clamps: an admin who typed 99999 into a timeout field
   * should be told, not silently given 300.
   */
  validate(updates) {
    if (!updates || typeof updates !== 'object' || Array.isArray(updates)) {
      throw AppError.validation('Settings payload must be an object');
    }

    const keys = Object.keys(updates);
    if (!keys.length) throw AppError.validation('No settings provided');

    const errors = [];
    const clean = {};

    for (const key of keys) {
      const value = updates[key];

      if (NUMERIC_KEYS.includes(key)) {
        if (!isFiniteNumber(value)) {
          errors.push({ field: key, message: 'must be a number' });
          continue;
        }
        const num = Number(value);
        const range = this._rangeFor(key);
        if (range && (num < range.min || num > range.max)) {
          errors.push({ field: key, message: `must be between ${range.min} and ${range.max}` });
          continue;
        }
        clean[key] = num;
        continue;
      }

      if (BOOLEAN_KEYS.includes(key)) {
        if (typeof value !== 'boolean') {
          errors.push({ field: key, message: 'must be true or false' });
          continue;
        }
        clean[key] = value;
        continue;
      }

      if (key === K.DELIVERY_ASSIGNMENT_MODE) {
        if (!DELIVERY_ASSIGNMENT_MODE_VALUES.includes(value)) {
          errors.push({ field: key, message: `must be one of: ${DELIVERY_ASSIGNMENT_MODE_VALUES.join(', ')}` });
          continue;
        }
        clean[key] = value;
        continue;
      }

      if (key === K.SELLER_RANKING_WEIGHTS) {
        const weightErrors = this._validateWeights(value, K.SELLER_RANKING_WEIGHTS, DEFAULT_SELLER_RANKING_WEIGHTS);
        if (weightErrors.length) {
          errors.push(...weightErrors);
          continue;
        }
        clean[key] = value;
        continue;
      }

      if (key === K.PARTNER_RANKING_WEIGHTS) {
        const weightErrors = this._validateWeights(value, K.PARTNER_RANKING_WEIGHTS, DEFAULT_PARTNER_RANKING_WEIGHTS);
        if (weightErrors.length) {
          errors.push(...weightErrors);
          continue;
        }
        clean[key] = value;
        continue;
      }

      errors.push({ field: key, message: 'is not a fulfillment setting' });
    }

    if (errors.length) {
      throw AppError.validation('Invalid fulfillment settings', errors);
    }

    return clean;
  }

  /** Shared validator for both seller and partner ranking-weight maps. */
  _validateWeights(value, settingKey, defaults) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      return [{ field: settingKey, message: 'must be an object' }];
    }

    const allowed = Object.keys(defaults);
    const errors = [];

    for (const [factor, weight] of Object.entries(value)) {
      if (!allowed.includes(factor)) {
        errors.push({ field: `${settingKey}.${factor}`, message: 'is not a known ranking factor' });
        continue;
      }
      if (!isFiniteNumber(weight) || Number(weight) < 0 || Number(weight) > 1) {
        errors.push({ field: `${settingKey}.${factor}`, message: 'must be between 0 and 1' });
      }
    }

    const total = allowed.reduce((sum, f) => sum + toFiniteNumber(value[f], 0), 0);
    if (total <= 0) {
      errors.push({ field: settingKey, message: 'at least one weight must be greater than 0' });
    }

    return errors;
  }

  /** Current effective configuration plus the valid ranges, for the admin UI. */
  async getSettings(marketplaceTab = null) {
    const resolved = await this.fulfillmentConfigService.resolve(marketplaceTab);

    return {
      settings: resolved,
      ranges: { ...FULFILLMENT_SETTING_RANGES, ...EXTRA_RANGES },
      deliveryAssignmentModes: DELIVERY_ASSIGNMENT_MODE_VALUES,
      rankingFactors: Object.keys(DEFAULT_SELLER_RANKING_WEIGHTS),
      partnerRankingFactors: Object.keys(DEFAULT_PARTNER_RANKING_WEIGHTS),
      managedKeys: AdminFulfillmentService.MANAGED_KEYS,
    };
  }

  /** Validates, writes through the existing settings service, and audits. */
  async updateSettings(updates, adminId, req = null) {
    const clean = this.validate(updates);

    const before = await this.fulfillmentConfigService.resolve(null);
    await this.adminPlatformSettingsService.updateSettings(clean, adminId);
    const after = await this.fulfillmentConfigService.resolve(null);

    if (typeof this.auditService?.log === 'function') {
      // Recording old and new makes an unintended change traceable later.
      await this.auditService.log({
        adminId,
        action: 'fulfillment.settings.update',
        targetType: 'platform_settings',
        targetId: null,
        metadata: {
          keys: Object.keys(clean),
          changes: Object.fromEntries(
            Object.keys(clean).map((k) => [k, { from: before[k] ?? null, to: clean[k] }])
          ),
        },
        req,
      });
    }

    return { updated: Object.keys(clean), settings: after };
  }

  _serializeFulfillment(fulfillment, order = null) {
    return {
      orderId: String(fulfillment.orderId),
      orderNumber: order?.orderNumber || null,
      fulfillmentId: String(fulfillment._id),
      state: fulfillment.state,
      marketplaceTab: fulfillment.marketplaceTab,
      attemptCount: fulfillment.attemptCount,
      fallbackLevel: fulfillment.fallbackLevel,
      failureCode: fulfillment.failureCode,
      traceId: fulfillment.traceId,
      resolvedSellerId: fulfillment.resolvedSellerId ? String(fulfillment.resolvedSellerId) : null,
      excludedSellerCount: (fulfillment.excludedSellerIds || []).length,
      searchDeadlineAt: fulfillment.searchDeadlineAt,
      acceptanceDeadlineAt: fulfillment.acceptanceDeadlineAt,
      createdAt: fulfillment.createdAt,
      updatedAt: fulfillment.updatedAt,
    };
  }

  /** Monitor list. Filterable by state, tab, fallback level, and failure code. */
  async listFulfillments(query = {}) {
    const pagination = parsePagination(query);

    const filter = {};
    if (query.state) filter.state = query.state;
    if (query.tab) filter.marketplaceTab = query.tab;
    if (query.failureCode) filter.failureCode = query.failureCode;
    if (isFiniteNumber(query.fallbackLevel)) filter.fallbackLevel = Number(query.fallbackLevel);

    const [rows, total] = await Promise.all([
      this.orderFulfillmentRepository.listForAdmin(filter, {
        skip: pagination.skip, limit: pagination.limit,
      }),
      this.orderFulfillmentRepository.count(filter),
    ]);

    const orderIds = rows.map((r) => r.orderId);
    const orders = orderIds.length
      ? await this.orderRepository.find({ _id: { $in: orderIds } })
      : [];
    const orderById = new Map(orders.map((o) => [String(o._id), o]));

    return {
      items: rows.map((r) => this._serializeFulfillment(r, orderById.get(String(r.orderId)))),
      meta: buildPaginationMeta(pagination.page, pagination.limit, total),
    };
  }

  /**
   * Full diagnostic view of one order.
   *
   * This is the answer to "why did this order go to courier?" — the ordered
   * candidate list with each rank breakdown and failure code, plus the
   * delivery assignment state, all without touching server logs.
   */
  async getFulfillmentDetail(orderId) {
    const fulfillment = await this.orderFulfillmentRepository.findByOrderId(orderId);
    if (!fulfillment) throw AppError.notFound('No fulfillment record for this order');

    const [order, attempts] = await Promise.all([
      this.orderRepository.findById(fulfillment.orderId),
      this.fulfillmentAttemptRepository.listByFulfillment(fulfillment._id),
    ]);

    let deliveryAssignment = null;
    if (this.deliveryAssignmentRepository) {
      try {
        const assignment = await this.deliveryAssignmentRepository.findByOrderId(fulfillment.orderId);
        if (assignment) {
          deliveryAssignment = {
            assignmentId: String(assignment._id),
            status: assignment.status,
            partnerId: assignment.partnerId ? String(assignment.partnerId) : null,
            offeredTo: (assignment.offeredTo || []).map(String),
            rejectedBy: (assignment.rejectedBy || []).map(String),
            offerExpiresAt: assignment.offerExpiresAt,
            offerRound: assignment.offerRound,
          };
        }
      } catch {
        // Diagnostics must degrade rather than fail the whole view.
        deliveryAssignment = null;
      }
    }

    return {
      fulfillment: this._serializeFulfillment(fulfillment, order),
      order: order ? {
        status: order.status,
        paymentStatus: order.paymentStatus,
        total: order.total,
        fulfilmentType: order.fulfilmentType,
        fulfillment: order.fulfillment || null,
      } : null,
      configSnapshot: fulfillment.configSnapshot || null,
      attempts: attempts.map((a) => ({
        attemptNumber: a.attemptNumber,
        kind: a.kind,
        status: a.status,
        sellerId: a.sellerId ? String(a.sellerId) : null,
        rankScore: a.rankScore,
        rankBreakdown: a.rankBreakdown,
        distanceKm: a.distanceKm,
        routeEtaMinutes: a.routeEtaMinutes,
        estimatedDeliveryMinutes: a.estimatedDeliveryMinutes,
        failureCode: a.failureCode,
        failureDetail: a.failureDetail,
        reservations: (a.reservations || []).map((r) => ({
          productId: String(r.productId), quantity: r.quantity, releasedAt: r.releasedAt,
        })),
        offeredAt: a.offeredAt,
        respondedAt: a.respondedAt,
        expiresAt: a.expiresAt,
      })),
      deliveryAssignment,
    };
  }

  /** Re-runs the engine for a stuck fulfillment. Audited. */
  async retryFulfillment(orderId, adminId, req = null) {
    if (!this.fulfillmentEngineService) {
      throw AppError.serviceUnavailable('Fulfillment engine is not available');
    }

    const fulfillment = await this.orderFulfillmentRepository.findByOrderId(orderId);
    if (!fulfillment) throw AppError.notFound('No fulfillment record for this order');

    // Guarded so a retry can never double-reserve alongside a live attempt.
    const retryable = ['failed', 'searching'];
    if (!retryable.includes(fulfillment.state)) {
      throw AppError.conflict(`Cannot retry a fulfillment in state '${fulfillment.state}'`);
    }

    if (this.auditService) {
      await this.auditService.log({
        adminId,
        action: 'fulfillment.retry',
        targetType: 'order',
        targetId: String(orderId),
        metadata: { fromState: fulfillment.state, traceId: fulfillment.traceId },
        req,
      });
    }

    const result = await this.fulfillmentEngineService.attemptNext(fulfillment._id);
    return { retried: true, state: result?.state || fulfillment.state };
  }

  /** Manual escalation to courier. Audited. */
  async forceCourier(orderId, adminId, req = null) {
    if (!this.fulfillmentEngineService) {
      throw AppError.serviceUnavailable('Fulfillment engine is not available');
    }

    const fulfillment = await this.orderFulfillmentRepository.findByOrderId(orderId);
    if (!fulfillment) throw AppError.notFound('No fulfillment record for this order');

    if (this.auditService) {
      await this.auditService.log({
        adminId,
        action: 'fulfillment.force_courier',
        targetType: 'order',
        targetId: String(orderId),
        metadata: { fromState: fulfillment.state, traceId: fulfillment.traceId },
        req,
      });
    }

    const result = await this.fulfillmentEngineService.forceCourier(orderId);
    return { forced: true, state: result?.state || null };
  }
}

module.exports = { AdminFulfillmentService, NUMERIC_KEYS, BOOLEAN_KEYS, EXTRA_RANGES };
